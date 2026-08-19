import { z } from 'zod'

// Matches this project's actual Supabase auth policy — an 8-character
// minimum is the real "weak_password" threshold already handled by
// utils/authErrors.js, not an invented stronger requirement.
export const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
