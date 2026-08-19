import { z } from 'zod'
import { INVESTMENT_FREQUENCY_CODES } from '../../constants/investmentFrequencies'
import { CURRENCY_CODES } from '../../constants/currencies'

const positiveAmount = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? NaN : Number(val)))
  .refine((val) => Number.isFinite(val), { message: 'Enter a valid amount' })
  .refine((val) => val > 0, { message: 'Amount must be greater than zero' })

// holding_id is intentionally not required here — it's fixed by context
// (the holding's own SIP section), not picked from this form; the
// functionality hook validates its presence, same pattern as Task 17's
// goal_transaction_allocations form.
export const investmentPlanSchema = z
  .object({
    holding_id: z.string().optional().or(z.literal('')),
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
    amount: positiveAmount,
    currency: z.enum(CURRENCY_CODES, { errorMap: () => ({ message: 'Select a currency' }) }),
    frequency: z.enum(INVESTMENT_FREQUENCY_CODES, { errorMap: () => ({ message: 'Select a frequency' }) }),
    contribution_day: z.union([z.string(), z.number()]).optional().or(z.literal('')),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().optional().or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    const day = values.contribution_day === '' ? null : Number(values.contribution_day)
    const dayIsValid = day !== null && Number.isFinite(day) && day >= 1 && day <= 31

    if (values.frequency === 'monthly' && !dayIsValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contribution_day'],
        message: 'Contribution day (1–31) is required for monthly plans',
      })
    } else if (day !== null && !dayIsValid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contribution_day'], message: 'Contribution day must be 1–31' })
    }

    if (values.end_date && values.start_date && values.end_date < values.start_date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end_date'], message: 'End date must be on or after the start date' })
    }
  })
