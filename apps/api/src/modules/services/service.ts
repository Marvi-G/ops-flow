import { serviceRepository } from './repository.js';
import { NotFoundError } from '../../infrastructure/errors.js';
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

  async create(organizationId: string, input: CreateServiceInput) {
    return serviceRepository.create(organizationId, input);
  }

  async update(organizationId: string, id: string, input: UpdateServiceInput) {
    const service = await serviceRepository.findById(organizationId, id);
    if (!service) {
      throw new NotFoundError('Service not found');
    }
    return serviceRepository.update(id, input);
  }
}

export const serviceService = new ServiceService();
