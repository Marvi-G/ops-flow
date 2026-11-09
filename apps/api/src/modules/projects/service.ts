import { projectRepository } from './repository.js';
import { ConflictError, NotFoundError, ValidationError } from '../../infrastructure/errors.js';
import type { CreateProjectInput, UpdateProjectInput } from './schemas.js';

export class ProjectService {
  async findAll(organizationId: string) {
    return projectRepository.findAll(organizationId);
  }

  async findById(organizationId: string, id: string) {
    const project = await projectRepository.findById(organizationId, id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    return project;
  }

  /** A team id sent by the client must belong to the caller's organization. */
  private async assertTeam(organizationId: string, teamId: string | null | undefined) {
    if (teamId && !(await projectRepository.teamExists(organizationId, teamId))) {
      throw new ValidationError('The selected team does not exist', {
        teamId: ['Not found in this organization'],
      });
    }
  }

  private async assertNameFree(organizationId: string, name: string, exceptId?: string) {
    if (await projectRepository.nameTaken(organizationId, name, exceptId)) {
      throw new ConflictError('A project with this name already exists', 'DUPLICATE_NAME');
    }
  }

  async create(organizationId: string, input: CreateProjectInput) {
    await this.assertTeam(organizationId, input.teamId);
    await this.assertNameFree(organizationId, input.name);

    const created = await projectRepository.create(organizationId, input);
    return this.findById(organizationId, created.id);
  }

  async update(organizationId: string, id: string, input: UpdateProjectInput) {
    await this.findById(organizationId, id);
    await this.assertTeam(organizationId, input.teamId);
    if (input.name) {
      await this.assertNameFree(organizationId, input.name, id);
    }

    await projectRepository.update(organizationId, id, input);
    return this.findById(organizationId, id);
  }

  async delete(organizationId: string, id: string) {
    const project = await this.findById(organizationId, id);

    // Services would silently lose their project, so the user has to decide what happens to them
    if (project._count.services > 0) {
      throw new ConflictError(
        `This project still has ${project._count.services} service${project._count.services === 1 ? '' : 's'}. Move or delete them first, or archive the project instead.`,
        'PROJECT_HAS_SERVICES'
      );
    }

    await projectRepository.delete(organizationId, id);
  }
}

export const projectService = new ProjectService();
