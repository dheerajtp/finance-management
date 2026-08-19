import { z } from 'zod'

const positiveAmount = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? NaN : Number(val)))
  .refine((val) => Number.isFinite(val), { message: 'Enter a valid amount' })
  .refine((val) => val > 0, { message: 'Amount must be greater than zero' })

// holding_id is fixed by context (the holding page a contribution is
// recorded from), not picked from this form — same convention as
// investmentPlan.validation.js.
export const investmentContributionSchema = z.object({
  holding_id: z.string().optional().or(z.literal('')),
  plan_id: z.string().optional().or(z.literal('')),
  amount: positiveAmount,
  contribution_date: z.string().min(1, 'Contribution date is required'),
  status: z.enum(['completed', 'skipped']),
  notes: z.string().trim().max(280, 'Notes must be under 280 characters').optional().or(z.literal('')),
})
