import { z } from 'zod'

const positiveAmount = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? NaN : Number(val)))
  .refine((val) => !Number.isNaN(val), { message: 'Enter a valid amount' })
  .refine((val) => val > 0, { message: 'Contribution amount must be greater than zero' })

export const goalContributionSchema = z.object({
  amount: positiveAmount,
  contribution_date: z.string().min(1, 'Date is required'),
  description: z.string().trim().max(280, 'Description must be under 280 characters').optional().or(z.literal('')),
})
