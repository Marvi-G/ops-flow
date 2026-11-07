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

  async update(id: string, input: UpdateTeamInput) {
    const db = getDatabase();
    return db.team.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string) {
    const db = getDatabase();
    return db.team.delete({
      where: { id },
    });
  }

  async addMember(teamId: string, userId: string, role: string = 'member') {
    const db = getDatabase();
    return db.teamMember.create({
      data: {
        teamId,
        userId,
        role,
      },
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
