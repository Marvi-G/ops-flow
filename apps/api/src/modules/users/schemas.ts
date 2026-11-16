import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  avatar: z.string().url().nullable().optional(),
});

// bcrypt only looks at the first 72 bytes, so a longer password would give a false sense of safety
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'Choose a password that is different from the current one',
    path: ['newPassword'],
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
