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

  async findBySlug(slug: string) {
    const db = getDatabase();
    return db.organization.findUnique({ where: { slug } });
  }

  /** One member in the same shape as the members list. */
  async getMember(organizationId: string, userId: string) {
    const db = getDatabase();
    const member = await db.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      include: { user: { select: { id: true, email: true, name: true, avatar: true } } },
    });
    return member ? { ...member.user, role: member.role, joinedAt: member.createdAt } : null;
  }

  async updateMemberRole(organizationId: string, userId: string, role: string) {
    const db = getDatabase();
    await db.organizationMember.update({
      where: { organizationId_userId: { organizationId, userId } },
      data: { role },
    });
  }

  /**
   * Removes the person from this organization and tidies up everything that pointed at
   * them here: team memberships, incidents assigned to them, and their sessions in it.
   * Incidents they created stay (the history is not theirs to take away).
   */
  async removeMember(organizationId: string, userId: string) {
    const db = getDatabase();
    await db.$transaction([
      db.teamMember.deleteMany({ where: { userId, team: { organizationId } } }),
      db.incident.updateMany({ where: { organizationId, assigneeId: userId }, data: { assigneeId: null } }),
      db.session.deleteMany({ where: { userId, organizationId } }),
      db.organizationMember.delete({ where: { organizationId_userId: { organizationId, userId } } }),
    ]);
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
