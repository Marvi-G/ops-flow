import { teamRepository } from './repository.js';
import { NotFoundError, ConflictError, ValidationError } from '../../infrastructure/errors.js';
import type {
  CreateTeamInput,
  UpdateTeamInput,
  AddTeamMemberInput,
  UpdateTeamMemberInput,
} from './schemas.js';

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

  private async assertNameFree(organizationId: string, name: string, exceptId?: string) {
    if (await teamRepository.nameTaken(organizationId, name, exceptId)) {
      throw new ConflictError('A team with this name already exists', 'DUPLICATE_NAME');
    }
  }

  async create(organizationId: string, input: CreateTeamInput) {
    await this.assertNameFree(organizationId, input.name);

    const created = await teamRepository.create(organizationId, input);
    return this.findById(organizationId, created.id);
  }

  async update(organizationId: string, id: string, input: UpdateTeamInput) {
    await this.findById(organizationId, id);
    if (input.name) {
      await this.assertNameFree(organizationId, input.name, id);
    }

    await teamRepository.update(organizationId, id, input);
    return this.findById(organizationId, id);
  }

  async delete(organizationId: string, id: string) {
    const team = await this.findById(organizationId, id);

    // Deleting would silently strip the team from its projects and from incident history
    const projects = team._count.projects;
    if (projects > 0) {
      throw new ConflictError(
        `This team still owns ${projects} project${projects === 1 ? '' : 's'}. Move them to another team first.`,
        'TEAM_HAS_PROJECTS'
      );
    }

    const incidents = await teamRepository.countIncidents(organizationId, id);
    if (incidents > 0) {
      throw new ConflictError(
        `This team is on ${incidents} incident${incidents === 1 ? '' : 's'}, so it can't be deleted. Remove its members instead.`,
        'TEAM_HAS_INCIDENTS'
      );
    }

    await teamRepository.delete(organizationId, id);
  }

  async addMember(organizationId: string, teamId: string, input: AddTeamMemberInput) {
    const team = await this.findById(organizationId, teamId);

    // Only people who belong to this organization can join its teams
    if (!(await teamRepository.isOrganizationMember(organizationId, input.userId))) {
      throw new ValidationError('That person is not a member of this organization', {
        userId: ['Not a member of this organization'],
      });
    }

    if (team.members.some((m) => m.user.id === input.userId)) {
      throw new ConflictError('User is already a member of this team');
    }

    await teamRepository.addMember(teamId, input.userId, input.role);
    return this.findById(organizationId, teamId);
  }

  async updateMemberRole(
    organizationId: string,
    teamId: string,
    userId: string,
    input: UpdateTeamMemberInput
  ) {
    const team = await this.findById(organizationId, teamId);

    if (!team.members.some((m) => m.user.id === userId)) {
      throw new NotFoundError('User is not a member of this team');
    }

    await teamRepository.updateMemberRole(teamId, userId, input.role);
    return this.findById(organizationId, teamId);
  }

  async removeMember(organizationId: string, teamId: string, userId: string) {
    const team = await this.findById(organizationId, teamId);

    if (!team.members.some((m) => m.user.id === userId)) {
      throw new NotFoundError('User is not a member of this team');
    }

    await teamRepository.removeMember(teamId, userId);
  }
}

export const teamService = new TeamService();
