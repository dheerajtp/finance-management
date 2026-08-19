import { z } from 'zod'
import { INVESTMENT_TYPE_CODES } from '../../constants/investmentTypes'
import { CURRENCY_CODES } from '../../constants/currencies'

const nonNegativeAmount = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? 0 : Number(val)))
  .refine((val) => Number.isFinite(val), { message: 'Enter a valid amount' })
  .refine((val) => val >= 0, { message: 'Amount cannot be negative' })

export const investmentHoldingSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  type: z.enum(INVESTMENT_TYPE_CODES, { errorMap: () => ({ message: 'Select an investment type' }) }),
  account_id: z.string().min(1, 'Select an investment account'),
  currency: z.enum(CURRENCY_CODES, { errorMap: () => ({ message: 'Select a currency' }) }),
  // Deliberately no current_value >= invested_amount rule — investments can
  // lose value (same as the 0016 migration's own CHECK constraints).
  invested_amount: nonNegativeAmount,
  current_value: nonNegativeAmount,
})
