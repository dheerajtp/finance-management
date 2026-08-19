import { z } from 'zod'
import { CURRENCY_CODES } from '../../constants/currencies'

const isBlank = (val) => val === '' || val === null || val === undefined

const requiredAmount = z
  .union([z.string(), z.number()])
  .transform((val) => (isBlank(val) ? NaN : Number(val)))
  .refine((val) => !Number.isNaN(val), { message: 'Enter a valid amount' })
  .refine((val) => val >= 0, { message: 'Amount cannot be negative' })

const optionalAmount = z
  .union([z.string(), z.number()])
  .transform((val) => (isBlank(val) ? 0 : Number(val)))
  .refine((val) => !Number.isNaN(val), { message: 'Enter a valid amount' })
  .refine((val) => val >= 0, { message: 'Amount cannot be negative' })

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be under 80 characters'),
  currency: z.enum(CURRENCY_CODES, { errorMap: () => ({ message: 'Select a currency' }) }),
  monthlyIncome: requiredAmount,
  monthlySavingsTarget: optionalAmount,
})
