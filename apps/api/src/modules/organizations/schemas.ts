import { z } from 'zod';

const slug = z
  .string()
  .trim()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens');

export const memberRoleEnum = z.enum(['owner', 'admin', 'member', 'viewer']);

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug,
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: slug.optional(),
});

export const memberParamsSchema = z.object({
  userId: z.string().uuid(),
});

export const updateMemberSchema = z.object({
  role: memberRoleEnum,
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
