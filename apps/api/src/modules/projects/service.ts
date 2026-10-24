import { projectRepository } from './repository.js';
import { NotFoundError } from '../../infrastructure/errors.js';
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

  async create(organizationId: string, input: CreateProjectInput) {
    return projectRepository.create(organizationId, input);
  }

  async update(organizationId: string, id: string, input: UpdateProjectInput) {
    const project = await projectRepository.findById(organizationId, id);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    return projectRepository.update(id, input);
  }
}

export const projectService = new ProjectService();
