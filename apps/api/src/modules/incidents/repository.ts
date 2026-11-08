import { Prisma } from '@prisma/client';
import { getDatabase } from '../../infrastructure/database/index.js';
import type { CreateIncidentInput, UpdateIncidentInput, IncidentQueryInput } from './schemas.js';

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'];

function severityRank(severity: string): number {
  const rank = SEVERITY_ORDER.indexOf(severity);
  return rank === -1 ? SEVERITY_ORDER.length : rank;
}

// Relations returned with each row of the incident list
const listInclude = {
  team: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  services: {
    include: {
      service: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.IncidentInclude;

export class IncidentRepository {
  async findAll(organizationId: string, query: IncidentQueryInput) {
    const db = getDatabase();

    const where: Prisma.IncidentWhereInput = {
      organizationId,
    };

    // Search filter: title/description, plus "INC-12" or "inc12" matches by number
    if (query.search) {
      const search: Prisma.IncidentWhereInput[] = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
      const incNumber = /^inc-?(\d{1,9})$/i.exec(query.search.trim());
      if (incNumber) {
        search.push({ number: Number(incNumber[1]) });
      }
      where.OR = search;
    }

    // Severity filter
    if (query.severity) {
      where.severity = { in: query.severity.split(',') };
    }

    // Status filter
    if (query.status) {
      where.status = { in: query.status.split(',') };
    }

    // Team filter (one id or a comma-separated list)
    if (query.teamId) {
      where.teamId = { in: query.teamId.split(',') };
    }

    // Service filter (one id or a comma-separated list)
    if (query.serviceId) {
      where.services = {
        some: { serviceId: { in: query.serviceId.split(',') } },
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

    const skip = (query.page - 1) * query.pageSize;

    let incidents;
    let total: number;

    if (query.sortBy === 'severity') {
      // Severity is stored as text, so the database would sort it alphabetically
      // (critical, high, low, medium). Rank it ourselves: sort the ids of the matching
      // incidents, take the requested page, then load only those rows.
      // 'desc' means most severe first; ties go to the newest incident.
      const rows = await db.incident.findMany({
        where,
        select: { id: true, severity: true, createdAt: true },
      });
      const direction = query.sortOrder === 'desc' ? 1 : -1;
      rows.sort(
        (a, b) =>
          direction * (severityRank(a.severity) - severityRank(b.severity)) ||
          b.createdAt.getTime() - a.createdAt.getTime()
      );
      total = rows.length;

      const pageIds = rows.slice(skip, skip + query.pageSize).map((row) => row.id);
      const loaded = await db.incident.findMany({
        where: { id: { in: pageIds }, organizationId },
        include: listInclude,
      });
      incidents = pageIds
        .map((id) => loaded.find((incident) => incident.id === id))
        .filter((incident): incident is (typeof loaded)[number] => incident !== undefined);
    } else {
      const orderBy: Prisma.IncidentOrderByWithRelationInput = {};
      orderBy[query.sortBy] = query.sortOrder;

      [incidents, total] = await Promise.all([
        db.incident.findMany({
          where,
          orderBy,
          skip,
          take: query.pageSize,
          include: listInclude,
        }),
        db.incident.count({ where }),
      ]);
    }

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

  /**
   * Returns the names of the fields whose ids don't belong to this organization.
   * Teams and services must be in the org; an assignee must be a member of it.
   */
  async findInvalidReferences(
    organizationId: string,
    refs: { teamId?: string | null; assigneeId?: string | null; serviceIds?: string[] }
  ): Promise<string[]> {
    const db = getDatabase();
    const invalid: string[] = [];

    if (refs.teamId) {
      const team = await db.team.findFirst({ where: { id: refs.teamId, organizationId }, select: { id: true } });
      if (!team) invalid.push('teamId');
    }

    if (refs.assigneeId) {
      const member = await db.organizationMember.findFirst({
        where: { organizationId, userId: refs.assigneeId },
        select: { id: true },
      });
      if (!member) invalid.push('assigneeId');
    }

    if (refs.serviceIds?.length) {
      const unique = [...new Set(refs.serviceIds)];
      const count = await db.service.count({ where: { organizationId, id: { in: unique } } });
      if (count !== unique.length) invalid.push('serviceIds');
    }

    return invalid;
  }

  async create(organizationId: string, userId: string, input: CreateIncidentInput) {
    const db = getDatabase();
    const serviceIds = input.serviceIds ? [...new Set(input.serviceIds)] : undefined;

    // The number is "last + 1" per organization. Two requests at the same moment can pick
    // the same number; the unique (organizationId, number) index rejects the second, which
    // then simply retries with the next number.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const incident = await db.$transaction(async (tx) => {
          const last = await tx.incident.findFirst({
            where: { organizationId },
            orderBy: { number: 'desc' },
            select: { number: true },
          });

          const created = await tx.incident.create({
            data: {
              organizationId,
              number: (last?.number ?? 0) + 1,
              title: input.title,
              description: input.description,
              severity: input.severity,
              status: input.status || 'investigating',
              resolvedAt: input.status === 'resolved' ? new Date() : undefined,
              teamId: input.teamId,
              assigneeId: input.assigneeId,
              createdById: userId,
              services: serviceIds ? { create: serviceIds.map((serviceId) => ({ serviceId })) } : undefined,
            },
            include: listInclude,
          });

          await tx.incidentEvent.create({
            data: { incidentId: created.id, userId, type: 'created', title: 'Incident created' },
          });

          return created;
        });

        return { ...incident, services: incident.services.map((is) => is.service) };
      } catch (error) {
        const isNumberClash = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!isNumberClash || attempt === 2) throw error;
      }
    }

    throw new Error('Could not allocate an incident number');
  }

  async update(organizationId: string, id: string, userId: string, input: UpdateIncidentInput) {
    const db = getDatabase();
    const serviceIds = input.serviceIds ? [...new Set(input.serviceIds)] : undefined;

    const result = await db.$transaction(async (tx) => {
      const current = await tx.incident.findFirst({ where: { id, organizationId } });

      if (!current) {
        return null;
      }

      const reopened = input.status !== undefined && input.status !== 'resolved' && current.status === 'resolved';
      const resolvedNow = input.status === 'resolved' && current.status !== 'resolved';

      const incident = await tx.incident.update({
        where: { id },
        data: {
          title: input.title,
          description: input.description,
          severity: input.severity,
          status: input.status,
          teamId: input.teamId,
          assigneeId: input.assigneeId,
          // Stamp the time when it gets resolved, clear it if it is reopened
          resolvedAt: resolvedNow ? new Date() : reopened ? null : undefined,
          services: serviceIds
            ? { deleteMany: {}, create: serviceIds.map((serviceId) => ({ serviceId })) }
            : undefined,
        },
        include: listInclude,
      });

      const events: Array<{ type: string; title: string }> = [];

      if (input.status && input.status !== current.status) {
        events.push({
          type: 'status_change',
          title: `Status changed to ${input.status.charAt(0).toUpperCase()}${input.status.slice(1)}`,
        });
      }

      if (input.severity && input.severity !== current.severity) {
        events.push({
          type: 'severity_change',
          title: `Severity changed from ${current.severity} to ${input.severity}`,
        });
      }

      if (input.assigneeId !== undefined && input.assigneeId !== current.assigneeId) {
        events.push({
          type: 'assigned',
          title: incident.assignee ? `Assigned to ${incident.assignee.name}` : 'Incident unassigned',
        });
      }

      if (events.length > 0) {
        await tx.incidentEvent.createMany({
          data: events.map((event) => ({ incidentId: id, userId, type: event.type, title: event.title })),
        });
      }

      return incident;
    });

    if (!result) {
      return null;
    }

    return { ...result, services: result.services.map((is) => is.service) };
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
