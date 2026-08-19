import { z } from 'zod'
import { FLEXIBLE_CATEGORY_KEYS } from '../../constants/flexibleSpending'

const percentage = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? 0 : Number(val)))
  .refine((val) => !Number.isNaN(val), { message: 'Enter a valid percentage' })
  .refine((val) => val >= 0 && val <= 100, { message: 'Must be between 0 and 100' })

// One field per fixed flexible-spending bucket (see constants/flexibleSpending.js) —
// the buckets themselves are not user-defined, only their percentages are.
export const allocationSchema = z
  .object(Object.fromEntries(FLEXIBLE_CATEGORY_KEYS.map((key) => [`${key}_percentage`, percentage])))
  .superRefine((values, ctx) => {
    const total = FLEXIBLE_CATEGORY_KEYS.reduce((sum, key) => sum + values[`${key}_percentage`], 0)
    if (total > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['other_percentage'], message: 'Your allocations exceed 100%.' })
    }
  })
