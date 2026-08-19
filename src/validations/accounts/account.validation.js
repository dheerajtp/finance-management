import { z } from 'zod'
import { ACCOUNT_TYPE_CODES } from '../../constants/accountTypes'
import { CURRENCY_CODES } from '../../constants/currencies'

const balanceAmount = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? NaN : Number(val)))
  .refine((val) => !Number.isNaN(val), { message: 'Enter a valid amount' })
  .refine((val) => val >= 0, { message: 'Balance cannot be negative' })

export const accountSchema = z.object({
  name: z.string().trim().min(1, 'Account name is required').max(80, 'Name must be under 80 characters'),
  type: z.enum(ACCOUNT_TYPE_CODES, { errorMap: () => ({ message: 'Select an account type' }) }),
  balance: balanceAmount,
  currency: z.enum(CURRENCY_CODES, { errorMap: () => ({ message: 'Select a currency' }) }),
})
