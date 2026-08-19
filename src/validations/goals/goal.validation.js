import { z } from 'zod'
import { format } from 'date-fns'
import { GOAL_TYPE_CODES } from '../../constants/goalTypes'
import { CURRENCY_CODES } from '../../constants/currencies'
import { GOAL_PRIORITY_CODES } from '../../constants/goalPriority'

const positiveAmount = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? NaN : Number(val)))
  .refine((val) => !Number.isNaN(val), { message: 'Enter a valid amount' })
  .refine((val) => val > 0, { message: 'Target amount must be greater than zero' })

const todayDateString = () => format(new Date(), 'yyyy-MM-dd')

export const goalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required').max(80, 'Name must be under 80 characters'),
  type: z.enum(GOAL_TYPE_CODES, { errorMap: () => ({ message: 'Select a goal type' }) }),
  description: z.string().trim().max(280, 'Description must be under 280 characters').optional().or(z.literal('')),
  target_amount: positiveAmount,
  currency: z.enum(CURRENCY_CODES, { errorMap: () => ({ message: 'Select a currency' }) }),
  target_date: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || val >= todayDateString(), { message: 'Target date must be today or in the future' }),
  priority: z.coerce
    .number()
    .refine((val) => GOAL_PRIORITY_CODES.includes(val), { message: 'Select a priority' }),
})
