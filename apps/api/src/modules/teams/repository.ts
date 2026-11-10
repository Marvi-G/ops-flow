import { getDatabase } from '../../infrastructure/database/index.js';
import type { CreateTeamInput, UpdateTeamInput } from './schemas.js';

// `_count.incidents` below counts only active incidents (not resolved / post-mortem)
const ACTIVE_INCIDENTS = { where: { status: { notIn: ['resolved', 'postmortem'] } } };

export class TeamRepository {
  async findAll(organizationId: string) {
    const db = getDatabase();
    return db.team.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
            incidents: ACTIVE_INCIDENTS,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(organizationId: string, id: string) {
    const db = getDatabase();
    return db.team.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: {
            members: true,
            projects: true,
            incidents: ACTIVE_INCIDENTS,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        projects: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async create(organizationId: string, input: CreateTeamInput) {
    const db = getDatabase();
    return db.team.create({
      data: {
        organizationId,
        name: input.name,
        description: input.description,
      },
    });
  }

  async update(organizationId: string, id: string, input: UpdateTeamInput) {
    const db = getDatabase();
    return db.team.update({
      where: { id, organizationId },
      data: input,
    });
  }

  async delete(organizationId: string, id: string) {
    const db = getDatabase();
    await db.team.delete({ where: { id, organizationId } });
  }

  /** Is another team in this organization already called this (ignoring upper/lower case)? */
  async nameTaken(organizationId: string, name: string, exceptId?: string): Promise<boolean> {
    const db = getDatabase();
    const count = await db.team.count({
      where: { organizationId, name: { equals: name, mode: 'insensitive' }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    });
    return count > 0;
  }

  /** Every incident the team has been on, open or closed. */
  async countIncidents(organizationId: string, id: string): Promise<number> {
    const db = getDatabase();
    return db.incident.count({ where: { organizationId, teamId: id } });
  }

  async isOrganizationMember(organizationId: string, userId: string): Promise<boolean> {
    const db = getDatabase();
    return (await db.organizationMember.count({ where: { organizationId, userId } })) > 0;
  }

  async addMember(teamId: string, userId: string, role: string = 'member') {
    const db = getDatabase();
    return db.teamMember.create({
      data: { teamId, userId, role },
    });
  }

  async updateMemberRole(teamId: string, userId: string, role: string) {
    const db = getDatabase();
    return db.teamMember.updateMany({
      where: { teamId, userId },
      data: { role },
    });
  }

  async removeMember(teamId: string, userId: string) {
    const db = getDatabase();
    return db.teamMember.deleteMany({
      where: { teamId, userId },
    });
  }
}

export const teamRepository = new TeamRepository();
