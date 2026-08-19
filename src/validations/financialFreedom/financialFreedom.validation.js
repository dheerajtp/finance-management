import { z } from 'zod'
import { FI_MULTIPLIER_CODES, FI_ANALYSIS_MONTHS_CODES, FI_EXPECTED_RETURN_CODES } from '../../constants/financialFreedom'

// Nullable — an empty override means "use current monthly savings" (handled
// by the functionality hook), not zero.
const nullableNonNegativeAmount = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? null : Number(val)))
  .refine((val) => val === null || !Number.isNaN(val), { message: 'Enter a valid amount' })
  .refine((val) => val === null || val >= 0, { message: 'Amount cannot be negative' })

export const financialFreedomSettingsSchema = z.object({
  analysis_months: z.coerce
    .number()
    .refine((val) => FI_ANALYSIS_MONTHS_CODES.includes(val), { message: 'Select a valid analysis period' }),
  fi_multiplier: z.coerce
    .number()
    .refine((val) => FI_MULTIPLIER_CODES.includes(val), { message: 'Select a valid FI multiplier' }),
  expected_annual_return: z.coerce
    .number()
    .refine((val) => FI_EXPECTED_RETURN_CODES.includes(val), { message: 'Select a valid assumed return' }),
  monthly_contribution: nullableNonNegativeAmount,
})
