import { serviceRepository } from './repository.js';
import { ConflictError, NotFoundError, ValidationError } from '../../infrastructure/errors.js';
import type { CreateServiceInput, UpdateServiceInput } from './schemas.js';

export class ServiceService {
  async findAll(organizationId: string) {
    return serviceRepository.findAll(organizationId);
  }

  async findById(organizationId: string, id: string) {
    const service = await serviceRepository.findById(organizationId, id);
    if (!service) {
      throw new NotFoundError('Service not found');
    }
    return {
      ...service,
      incidents: service.incidents.map((is) => is.incident),
    };
  }

  /** A project id sent by the client must belong to the caller's organization. */
  private async assertProject(organizationId: string, projectId: string | null | undefined) {
    if (projectId && !(await serviceRepository.projectExists(organizationId, projectId))) {
      throw new ValidationError('The selected project does not exist', {
        projectId: ['Not found in this organization'],
      });
    }
  }

  private async assertNameFree(organizationId: string, name: string, exceptId?: string) {
    if (await serviceRepository.nameTaken(organizationId, name, exceptId)) {
      throw new ConflictError('A service with this name already exists', 'DUPLICATE_NAME');
    }
  }

  async create(organizationId: string, input: CreateServiceInput) {
    await this.assertProject(organizationId, input.projectId);
    await this.assertNameFree(organizationId, input.name);

    const created = await serviceRepository.create(organizationId, input);
    return this.findById(organizationId, created.id);
  }

  async update(organizationId: string, id: string, input: UpdateServiceInput) {
    await this.findById(organizationId, id);
    await this.assertProject(organizationId, input.projectId);
    if (input.name) {
      await this.assertNameFree(organizationId, input.name, id);
    }

    await serviceRepository.update(organizationId, id, input);
    return this.findById(organizationId, id);
  }

  async delete(organizationId: string, id: string) {
    await this.findById(organizationId, id);

    // Incidents keep pointing at the services they affected, so deleting one would rewrite history
    const linked = await serviceRepository.countIncidents(organizationId, id);
    if (linked > 0) {
      throw new ConflictError(
        `This service is linked to ${linked} incident${linked === 1 ? '' : 's'}, so it can't be deleted. Set its status to unknown instead.`,
        'SERVICE_HAS_INCIDENTS'
      );
    }

    await serviceRepository.delete(organizationId, id);
  }
}

export const serviceService = new ServiceService();
