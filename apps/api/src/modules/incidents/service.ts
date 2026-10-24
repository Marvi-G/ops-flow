import { incidentRepository } from './repository.js';
import { NotFoundError } from '../../infrastructure/errors.js';
import type { CreateIncidentInput, UpdateIncidentInput, IncidentQueryInput } from './schemas.js';

export class IncidentService {
  async findAll(organizationId: string, query: IncidentQueryInput) {
    return incidentRepository.findAll(organizationId, query);
  }

  async findById(organizationId: string, id: string) {
    const incident = await incidentRepository.findById(organizationId, id);

    if (!incident) {
      throw new NotFoundError('Incident not found');
    }

    return incident;
  }

  async create(organizationId: string, userId: string, input: CreateIncidentInput) {
    return incidentRepository.create(organizationId, userId, input);
  }

  async update(organizationId: string, id: string, userId: string, input: UpdateIncidentInput) {
    const incident = await incidentRepository.update(organizationId, id, userId, input);

    if (!incident) {
      throw new NotFoundError('Incident not found');
    }

    return incident;
  }

  async addComment(organizationId: string, incidentId: string, userId: string, body: string) {
    const comment = await incidentRepository.addComment(organizationId, incidentId, userId, body);

    if (!comment) {
      throw new NotFoundError('Incident not found');
    }

    return comment;
  }

  async getRelatedIncidents(organizationId: string, incidentId: string) {
    // Verify incident exists
    await this.findById(organizationId, incidentId);

    return incidentRepository.getRelatedIncidents(organizationId, incidentId);
  }
}

export const incidentService = new IncidentService();
