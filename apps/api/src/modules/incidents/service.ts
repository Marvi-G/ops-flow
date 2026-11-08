import { incidentRepository } from './repository.js';
import { NotFoundError, ValidationError } from '../../infrastructure/errors.js';
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

  /** Ids sent by the client must point at records of the caller's own organization. */
  private async assertReferences(
    organizationId: string,
    refs: { teamId?: string | null; assigneeId?: string | null; serviceIds?: string[] }
  ) {
    const invalid = await incidentRepository.findInvalidReferences(organizationId, refs);

    if (invalid.length > 0) {
      throw new ValidationError(
        'Some referenced records do not exist',
        Object.fromEntries(invalid.map((field) => [field, ['Not found in this organization']]))
      );
    }
  }

  async create(organizationId: string, userId: string, input: CreateIncidentInput) {
    await this.assertReferences(organizationId, input);
    return incidentRepository.create(organizationId, userId, input);
  }

  async update(organizationId: string, id: string, userId: string, input: UpdateIncidentInput) {
    await this.assertReferences(organizationId, input);
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
