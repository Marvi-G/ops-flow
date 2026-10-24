import { z } from 'zod';

export const severityEnum = z.enum(['critical', 'high', 'medium', 'low']);
export const statusEnum = z.enum(['investigating', 'identified', 'monitoring', 'resolved', 'postmortem']);

export const createIncidentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  severity: severityEnum,
  status: statusEnum.optional().default('investigating'),
  teamId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
});

export const updateIncidentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  severity: severityEnum.optional(),
  status: statusEnum.optional(),
  teamId: z.string().uuid().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  serviceIds: z.array(z.string().uuid()).optional(),
});

export const incidentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  teamId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'severity', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const incidentIdSchema = z.object({
  id: z.string().uuid(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
export type IncidentQueryInput = z.infer<typeof incidentQuerySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
