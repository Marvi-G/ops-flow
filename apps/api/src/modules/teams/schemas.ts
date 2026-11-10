import { z } from 'zod';

const memberRole = z.enum(['lead', 'member']);

export const createTeamSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  onCallStatus: z.enum(['active', 'inactive']).optional(),
});

export const addTeamMemberSchema = z.object({
  userId: z.string().uuid(),
  role: memberRole.optional(),
});

export const updateTeamMemberSchema = z.object({
  role: memberRole,
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
