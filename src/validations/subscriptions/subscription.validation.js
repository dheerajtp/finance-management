import { z } from 'zod'
import { CURRENCY_CODES } from '../../constants/currencies'
import { BILLING_FREQUENCY_CODES } from '../../constants/subscriptionFrequency'

const positiveAmount = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? NaN : Number(val)))
  .refine((val) => !Number.isNaN(val), { message: 'Enter a valid amount' })
  .refine((val) => val > 0, { message: 'Amount must be greater than zero' })

const optionalId = z.string().optional().or(z.literal(''))

export const subscriptionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  description: z.string().trim().max(280, 'Description must be under 280 characters').optional().or(z.literal('')),
  amount: positiveAmount,
  currency: z.enum(CURRENCY_CODES, { errorMap: () => ({ message: 'Select a currency' }) }),
  billing_frequency: z.enum(BILLING_FREQUENCY_CODES, { errorMap: () => ({ message: 'Select a billing frequency' }) }),
  next_billing_date: z.string().min(1, 'Next billing date is required'),
  account_id: optionalId,
  category_id: optionalId,
})
