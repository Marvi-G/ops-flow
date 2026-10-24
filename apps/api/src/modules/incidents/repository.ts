import { Prisma } from '@prisma/client';
import { getDatabase } from '../../infrastructure/database/index.js';
import type { CreateIncidentInput, UpdateIncidentInput, IncidentQueryInput } from './schemas.js';

export class IncidentRepository {
  async findAll(organizationId: string, query: IncidentQueryInput) {
    const db = getDatabase();

    const where: Prisma.IncidentWhereInput = {
      organizationId,
    };

    // Search filter
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Severity filter
    if (query.severity) {
      where.severity = { in: query.severity.split(',') };
    }

    // Status filter
    if (query.status) {
      where.status = { in: query.status.split(',') };
    }

    // Team filter
    if (query.teamId) {
      where.teamId = query.teamId;
    }

    // Service filter
    if (query.serviceId) {
      where.services = {
        some: { serviceId: query.serviceId },
      };
    }

    // Assignee filter
    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    // Date range filter
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }

    // Sorting
    const orderBy: Prisma.IncidentOrderByWithRelationInput = {};
    if (query.sortBy === 'severity') {
      // Custom severity ordering
      orderBy.severity = query.sortOrder;
    } else {
      orderBy[query.sortBy] = query.sortOrder;
    }

    const [incidents, total] = await Promise.all([
      db.incident.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      db.incident.count({ where }),
    ]);

    return {
      data: incidents.map((incident) => ({
        ...incident,
        services: incident.services.map((is) => is.service),
      })),
      total,
    };
  }

  async findById(organizationId: string, id: string) {
    const db = getDatabase();

    const incident = await db.incident.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        events: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!incident) {
      return null;
    }

    return {
      ...incident,
      services: incident.services.map((is) => is.service),
    };
  }

  async create(organizationId: string, userId: string, input: CreateIncidentInput) {
    const db = getDatabase();

    // Get next incident number for this organization
    const lastIncident = await db.incident.findFirst({
      where: { organizationId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });

    const number = (lastIncident?.number || 0) + 1;

    const incident = await db.incident.create({
      data: {
        organizationId,
        number,
        title: input.title,
        description: input.description,
        severity: input.severity,
        status: input.status || 'investigating',
        teamId: input.teamId,
        assigneeId: input.assigneeId,
        createdById: userId,
        services: input.serviceIds
          ? {
              create: input.serviceIds.map((serviceId) => ({
                serviceId,
              })),
            }
          : undefined,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Create initial event
    await db.incidentEvent.create({
      data: {
        incidentId: incident.id,
        userId,
        type: 'created',
        title: 'Incident created',
      },
    });

    return {
      ...incident,
      services: incident.services.map((is) => is.service),
    };
  }

  async update(organizationId: string, id: string, userId: string, input: UpdateIncidentInput) {
    const db = getDatabase();

    // Get current incident to track changes
    const current = await db.incident.findFirst({
      where: { id, organizationId },
    });

    if (!current) {
      return null;
    }

    const incident = await db.incident.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        severity: input.severity,
        status: input.status,
        teamId: input.teamId,
        assigneeId: input.assigneeId,
        resolvedAt: input.status === 'resolved' && current.status !== 'resolved'
          ? new Date()
          : undefined,
        services: input.serviceIds
          ? {
              deleteMany: {},
              create: input.serviceIds.map((serviceId) => ({
                serviceId,
              })),
            }
          : undefined,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Create events for changes
    const events: Array<{ type: string; title: string; description?: string }> = [];

    if (input.status && input.status !== current.status) {
      events.push({
        type: 'status_change',
        title: `Status changed to ${input.status}`,
      });
    }

    if (input.severity && input.severity !== current.severity) {
      events.push({
        type: 'severity_change',
        title: `Severity changed from ${current.severity} to ${input.severity}`,
      });
    }

    if (input.assigneeId && input.assigneeId !== current.assigneeId) {
      events.push({
        type: 'assigned',
        title: 'Incident assigned',
      });
    }

    for (const event of events) {
      await db.incidentEvent.create({
        data: {
          incidentId: id,
          userId,
          type: event.type,
          title: event.title,
          description: event.description,
        },
      });
    }

    return {
      ...incident,
      services: incident.services.map((is) => is.service),
    };
  }

  async addComment(organizationId: string, incidentId: string, userId: string, body: string) {
    const db = getDatabase();

    // Verify incident belongs to organization
    const incident = await db.incident.findFirst({
      where: { id: incidentId, organizationId },
    });

    if (!incident) {
      return null;
    }

    const comment = await db.incidentComment.create({
      data: {
        incidentId,
        userId,
        body,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create event
    await db.incidentEvent.create({
      data: {
        incidentId,
        userId,
        type: 'comment',
        title: 'Comment added',
      },
    });

    return comment;
  }

  async getRelatedIncidents(organizationId: string, incidentId: string, limit: number = 5) {
    const db = getDatabase();

    const incident = await db.incident.findFirst({
      where: { id: incidentId, organizationId },
      select: {
        teamId: true,
        services: {
          select: { serviceId: true },
        },
      },
    });

    if (!incident) {
      return [];
    }

    const serviceIds = incident.services.map((s) => s.serviceId);

    const related = await db.incident.findMany({
      where: {
        organizationId,
        id: { not: incidentId },
        OR: [
          { teamId: incident.teamId },
          { services: { some: { serviceId: { in: serviceIds } } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        number: true,
        title: true,
        severity: true,
        status: true,
        createdAt: true,
      },
    });

    return related;
  }
}

export const incidentRepository = new IncidentRepository();
