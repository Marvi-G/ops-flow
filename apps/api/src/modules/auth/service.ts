import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../../infrastructure/database/index.js';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../../infrastructure/errors.js';
import type { LoginInput, RegisterInput } from './schemas.js';
import type { AuthResponse, MeResponse } from './types.js';

const SALT_ROUNDS = 12;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthService {
  async login(input: LoginInput): Promise<{ session: string; data: AuthResponse }> {
    const db = getDatabase();

    // Find user
    const user = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Get user's organizations
    const memberships = await db.organizationMember.findMany({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (memberships.length === 0) {
      throw new UnauthorizedError('User has no organization access');
    }

    // Use first organization as default
    const defaultMembership = memberships[0];

    // Create session
    const sessionToken = uuidv4();
    const session = await db.session.create({
      data: {
        userId: user.id,
        organizationId: defaultMembership.organizationId,
        token: sessionToken,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });

    return {
      session: session.token,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
        organization: {
          id: defaultMembership.organization.id,
          name: defaultMembership.organization.name,
          slug: defaultMembership.organization.slug,
          role: defaultMembership.role,
        },
      },
    };
  }

  async register(input: RegisterInput): Promise<{ session: string; data: AuthResponse }> {
    const db = getDatabase();

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Generate organization slug
    const slug = input.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists
    const existingOrg = await db.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      throw new ConflictError('Organization slug already exists');
    }

    // Create user, organization, and membership in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          name: input.name,
        },
      });

      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: input.organizationName,
          slug,
        },
      });

      // Create membership (user is owner)
      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'owner',
        },
      });

      return { user, organization };
    });

    // Create session
    const sessionToken = uuidv4();
    await db.session.create({
      data: {
        userId: result.user.id,
        organizationId: result.organization.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });

    return {
      session: sessionToken,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          avatar: result.user.avatar,
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug,
          role: 'owner',
        },
      },
    };
  }

  async logout(sessionToken: string): Promise<void> {
    const db = getDatabase();

    await db.session.deleteMany({
      where: { token: sessionToken },
    });
  }

  async refresh(sessionToken: string): Promise<string> {
    const db = getDatabase();

    // Find current session
    const session = await db.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session) {
      throw new UnauthorizedError('Invalid session');
    }

    // Delete old session
    await db.session.delete({
      where: { id: session.id },
    });

    // Create new session
    const newToken = uuidv4();
    await db.session.create({
      data: {
        userId: session.userId,
        organizationId: session.organizationId,
        token: newToken,
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      },
    });

    return newToken;
  }

  async me(userId: string, organizationId: string): Promise<MeResponse> {
    const db = getDatabase();

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const currentMembership = user.memberships.find(
      (m) => m.organizationId === organizationId
    );

    if (!currentMembership) {
      throw new UnauthorizedError('Invalid organization access');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      organization: {
        id: currentMembership.organization.id,
        name: currentMembership.organization.name,
        slug: currentMembership.organization.slug,
        plan: currentMembership.organization.plan,
        role: currentMembership.role,
      },
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
    };
  }

  async switchOrganization(
    userId: string,
    organizationId: string,
    sessionToken: string
  ): Promise<void> {
    const db = getDatabase();

    // Verify user has access to organization
    const membership = await db.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedError('You do not have access to this organization');
    }

    // Update session
    await db.session.update({
      where: { token: sessionToken },
      data: { organizationId },
    });
  }
}

export const authService = new AuthService();
