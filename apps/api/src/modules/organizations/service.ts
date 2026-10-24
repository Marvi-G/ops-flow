import { organizationRepository } from './repository.js';
import { NotFoundError, ConflictError } from '../../infrastructure/errors.js';
import type { CreateOrganizationInput, UpdateOrganizationInput } from './schemas.js';

export class OrganizationService {
  async findById(id: string) {
    const org = await organizationRepository.findById(id);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }
    return org;
  }

  async findByUserId(userId: string) {
    return organizationRepository.findByUserId(userId);
  }

  async create(input: CreateOrganizationInput, ownerId: string) {
    // Check if slug already exists
    const existing = await organizationRepository.findById(input.slug);
    if (existing) {
      throw new ConflictError('Organization slug already exists');
    }
    return organizationRepository.create(input, ownerId);
  }

  async update(id: string, input: UpdateOrganizationInput) {
    const org = await organizationRepository.findById(id);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }
    return organizationRepository.update(id, input);
  }

  async getMembers(organizationId: string) {
    return organizationRepository.getMembers(organizationId);
  }
}

export const organizationService = new OrganizationService();
