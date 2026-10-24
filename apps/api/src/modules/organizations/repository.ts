import { getDatabase } from '../../infrastructure/database/index.js';
import type { CreateOrganizationInput, UpdateOrganizationInput } from './schemas.js';

export class OrganizationRepository {
  async findById(id: string) {
    const db = getDatabase();
    return db.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            teams: true,
            projects: true,
            services: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    const db = getDatabase();
    const memberships = await db.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                members: true,
                teams: true,
                projects: true,
                services: true,
              },
            },
          },
        },
      },
    });
    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));
  }

  async create(input: CreateOrganizationInput, ownerId: string) {
    const db = getDatabase();
    return db.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        members: {
          create: {
            userId: ownerId,
            role: 'owner',
          },
        },
      },
    });
  }

  async update(id: string, input: UpdateOrganizationInput) {
    const db = getDatabase();
    return db.organization.update({
      where: { id },
      data: input,
    });
  }

  async getMembers(organizationId: string) {
    const db = getDatabase();
    return db.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export const organizationRepository = new OrganizationRepository();
