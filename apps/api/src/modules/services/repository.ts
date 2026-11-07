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
        projectId: input.projectId,
      },
    });
  }

  async update(id: string, input: UpdateServiceInput) {
    const db = getDatabase();
    return db.service.update({
      where: { id },
      data: input,
    });
  }
}

export const serviceRepository = new ServiceRepository();
