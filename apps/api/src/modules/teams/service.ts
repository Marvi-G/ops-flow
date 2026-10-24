import { teamRepository } from './repository.js';
import { NotFoundError, ConflictError } from '../../infrastructure/errors.js';
import type { CreateTeamInput, UpdateTeamInput, AddTeamMemberInput } from './schemas.js';

export class TeamService {
  async findAll(organizationId: string) {
    return teamRepository.findAll(organizationId);
  }

  async findById(organizationId: string, id: string) {
    const team = await teamRepository.findById(organizationId, id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }
    return team;
  }

  async create(organizationId: string, input: CreateTeamInput) {
    // Check if team name already exists in organization
    const teams = await teamRepository.findAll(organizationId);
    const exists = teams.some((t) => t.name.toLowerCase() === input.name.toLowerCase());
    if (exists) {
      throw new ConflictError('Team name already exists');
    }
    return teamRepository.create(organizationId, input);
  }

  async update(organizationId: string, id: string, input: UpdateTeamInput) {
    const team = await teamRepository.findById(organizationId, id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }
    return teamRepository.update(id, input);
  }

  async delete(organizationId: string, id: string) {
    const team = await teamRepository.findById(organizationId, id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }
    return teamRepository.delete(id);
  }

  async addMember(organizationId: string, teamId: string, input: AddTeamMemberInput) {
    const team = await teamRepository.findById(organizationId, teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Check if user is already a member
    const isMember = team.members.some((m) => m.user.id === input.userId);
    if (isMember) {
      throw new ConflictError('User is already a member of this team');
    }

    return teamRepository.addMember(teamId, input.userId, input.role);
  }

  async removeMember(organizationId: string, teamId: string, userId: string) {
    const team = await teamRepository.findById(organizationId, teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    const isMember = team.members.some((m) => m.user.id === userId);
    if (!isMember) {
      throw new NotFoundError('User is not a member of this team');
    }

    return teamRepository.removeMember(teamId, userId);
  }
}

export const teamService = new TeamService();
