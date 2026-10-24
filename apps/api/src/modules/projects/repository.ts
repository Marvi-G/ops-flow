import { getDatabase } from '../../infrastructure/database/index.js';
import type { CreateProjectInput, UpdateProjectInput } from './schemas.js';

export class ProjectRepository {
  async findAll(organizationId: string) {
    const db = getDatabase();
    return db.project.findMany({
      where: { organizationId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            services: true,
            incidents: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(organizationId: string, id: string) {
    const db = getDatabase();
    return db.project.findFirst({
      where: { id, organizationId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        services: {
          select: {
            id: true,
            name: true,
            status: true,
            uptime: true,
            latency: true,
          },
        },
        incidents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            number: true,
            title: true,
            severity: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            services: true,
            incidents: true,
          },
        },
      },
    });
  }

  async create(organizationId: string, input: CreateProjectInput) {
    const db = getDatabase();
    return db.project.create({
      data: {
        organizationId,
        name: input.name,
        description: input.description,
        teamId: input.teamId,
      },
    });
  }

  async update(id: string, input: UpdateProjectInput) {
    const db = getDatabase();
    return db.project.update({
      where: { id },
      data: input,
    });
  }
}

export const projectRepository = new ProjectRepository();
