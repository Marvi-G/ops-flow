import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  organizationName: z.string().min(1, 'Organization name is required').max(100),
});

export const switchOrganizationSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type SwitchOrganizationInput = z.infer<typeof switchOrganizationSchema>;
