import { getDatabase } from '../../infrastructure/database/index.js';
import type { CreateServiceInput, UpdateServiceInput } from './schemas.js';

// `_count.incidents` below counts only open incidents (not resolved / post-mortem)
const OPEN_INCIDENTS = {
  where: { incident: { status: { notIn: ['resolved', 'postmortem'] } } },
};

export class ServiceRepository {
  async findAll(organizationId: string) {
    const db = getDatabase();
    return db.service.findMany({
      where: { organizationId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            incidents: OPEN_INCIDENTS,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(organizationId: string, id: string) {
    const db = getDatabase();
    return db.service.findFirst({
      where: { id, organizationId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        incidents: {
          include: {
            incident: {
              select: {
                id: true,
                number: true,
                title: true,
                severity: true,
                status: true,
                createdAt: true,
              },
            },
          },
          orderBy: { incident: { createdAt: 'desc' } },
          take: 10,
        },
        _count: {
          select: {
            incidents: OPEN_INCIDENTS,
          },
        },
      },
    });
  }

  async create(organizationId: string, input: CreateServiceInput) {
    const db = getDatabase();
    return db.service.create({
      data: {
        organizationId,
        name: input.name,
        description: input.description,
        status: input.status,
        projectId: input.projectId,
      },
    });
  }

  async update(organizationId: string, id: string, input: UpdateServiceInput) {
    const db = getDatabase();
    return db.service.update({
      where: { id, organizationId },
      data: input,
    });
  }

  async delete(organizationId: string, id: string) {
    const db = getDatabase();
    await db.service.delete({ where: { id, organizationId } });
  }

  /** Every incident that has ever been linked to this service, open or closed. */
  async countIncidents(organizationId: string, id: string): Promise<number> {
    const db = getDatabase();
    return db.incidentService.count({ where: { serviceId: id, incident: { organizationId } } });
  }

  async projectExists(organizationId: string, projectId: string): Promise<boolean> {
    const db = getDatabase();
    return (await db.project.count({ where: { id: projectId, organizationId } })) > 0;
  }

  /** Is another service in this organization already called this? */
  async nameTaken(organizationId: string, name: string, exceptId?: string): Promise<boolean> {
    const db = getDatabase();
    const count = await db.service.count({
      where: { organizationId, name, ...(exceptId ? { id: { not: exceptId } } : {}) },
    });
    return count > 0;
  }
}

export const serviceRepository = new ServiceRepository();
