import { getDatabase } from '../../infrastructure/database/index.js';
import type { CreateProjectInput, UpdateProjectInput } from './schemas.js';

const CLOSED_STATUSES = ['resolved', 'postmortem'];

interface ProjectIncidentStats {
  active: number;
  lastIncidentAt: Date | null;
}

export class ProjectRepository {
  /**
   * An incident belongs to a project through the services it affects (incidents.project_id
   * is not populated). Returns, per project: how many of its incidents are still active
   * and when the latest one was updated. Scoped to the organization.
   */
  private async incidentStats(organizationId: string): Promise<Map<string, ProjectIncidentStats>> {
    const db = getDatabase();

    const incidents = await db.incident.findMany({
      where: { organizationId, services: { some: {} } },
      select: {
        status: true,
        updatedAt: true,
        services: { select: { service: { select: { projectId: true } } } },
      },
    });

    const stats = new Map<string, ProjectIncidentStats>();

    for (const incident of incidents) {
      // An incident touching two services of the same project counts once for it
      const projectIds = new Set(
        incident.services
          .map((entry) => entry.service.projectId)
          .filter((projectId): projectId is string => projectId !== null)
      );

      for (const projectId of projectIds) {
        const entry = stats.get(projectId) ?? { active: 0, lastIncidentAt: null };
        if (!CLOSED_STATUSES.includes(incident.status)) {
          entry.active += 1;
        }
        if (!entry.lastIncidentAt || incident.updatedAt > entry.lastIncidentAt) {
          entry.lastIncidentAt = incident.updatedAt;
        }
        stats.set(projectId, entry);
      }
    }

    return stats;
  }

  /** Adds activeIncidentCount and lastActivity (latest of the project and its incidents). */
  private withStats<T extends { id: string; updatedAt: Date }>(
    project: T,
    stats: Map<string, ProjectIncidentStats>
  ) {
    const entry = stats.get(project.id);
    const lastActivity =
      entry?.lastIncidentAt && entry.lastIncidentAt > project.updatedAt
        ? entry.lastIncidentAt
        : project.updatedAt;

    return {
      ...project,
      activeIncidentCount: entry?.active ?? 0,
      lastActivity,
    };
  }

  async findAll(organizationId: string) {
    const db = getDatabase();

    const [projects, stats] = await Promise.all([
      db.project.findMany({
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
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.incidentStats(organizationId),
    ]);

    return projects.map((project) => this.withStats(project, stats));
  }

  async findById(organizationId: string, id: string) {
    const db = getDatabase();

    const [project, stats] = await Promise.all([
      db.project.findFirst({
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
          _count: {
            select: {
              services: true,
            },
          },
        },
      }),
      this.incidentStats(organizationId),
    ]);

    return project ? this.withStats(project, stats) : null;
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
