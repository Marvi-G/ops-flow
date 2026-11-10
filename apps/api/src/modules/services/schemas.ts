import { z } from 'zod';

export const serviceStatusEnum = z.enum(['operational', 'degraded', 'partial_outage', 'major_outage', 'unknown']);

export const createServiceSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  status: serviceStatusEnum.optional(),
  projectId: z.string().uuid().optional(),
});

export const updateServiceSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  status: serviceStatusEnum.optional(),
  uptime: z.number().min(0).max(100).optional(),
  latency: z.number().min(0).optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
