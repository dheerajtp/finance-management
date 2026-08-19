import { z } from 'zod'
import { EMERGENCY_FUND_TARGET_MONTHS_CODES } from '../../constants/emergencyFund'

const nonNegativeAmount = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? 0 : Number(val)))
  .refine((val) => !Number.isNaN(val), { message: 'Enter a valid amount' })
  .refine((val) => val >= 0, { message: 'Amount cannot be negative' })

export const emergencyFundSchema = z.object({
  target_months: z.coerce
    .number()
    .refine((val) => EMERGENCY_FUND_TARGET_MONTHS_CODES.includes(val), { message: 'Select a valid target duration' }),
  monthly_contribution: nonNegativeAmount,
  emergency_account_id: z.string().min(1, 'Select an emergency fund account'),
})
