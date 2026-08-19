import { z } from 'zod'
import { CURRENCY_CODES } from '../../constants/currencies'

const positiveAmount = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? NaN : Number(val)))
  .refine((val) => !Number.isNaN(val), { message: 'Enter a valid amount' })
  .refine((val) => val > 0, { message: 'Budget amount must be greater than zero' })

export const budgetSchema = z.object({
  category_id: z.string().min(1, 'Select a category'),
  amount: positiveAmount,
  currency: z.enum(CURRENCY_CODES, { errorMap: () => ({ message: 'Select a currency' }) }),
})
