import { z } from 'zod'
import { TRANSACTION_TYPE_CODES } from '../../constants/transactionTypes'
import { CURRENCY_CODES } from '../../constants/currencies'
import { RECURRING_FREQUENCY_CODES } from '../../constants/recurringFrequency'

const amount = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? NaN : Number(val)))
  .refine((val) => Number.isFinite(val), { message: 'Enter a valid amount' })
  .refine((val) => val > 0, { message: 'Amount must be greater than zero' })

const optionalId = z.string().optional().or(z.literal(''))

export const recurringTransactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPE_CODES, { errorMap: () => ({ message: 'Select a transaction type' }) }),
    account_id: z.string().min(1, 'Select an account'),
    category_id: optionalId,
    destination_account_id: optionalId,
    amount,
    currency: z.enum(CURRENCY_CODES, { errorMap: () => ({ message: 'Select a currency' }) }),
    description: z.string().trim().max(280, 'Description must be under 280 characters').optional().or(z.literal('')),
    frequency: z.enum(RECURRING_FREQUENCY_CODES, { errorMap: () => ({ message: 'Select a frequency' }) }),
    start_date: z.string().min(1, 'Start date is required'),
    next_occurrence_date: z.string().min(1, 'Next occurrence date is required'),
    end_date: z.string().optional().or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    if (values.type === 'income' || values.type === 'expense') {
      if (!values.category_id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['category_id'], message: 'Select a category' })
      }
    }

    if (values.type === 'transfer') {
      if (!values.destination_account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['destination_account_id'],
          message: 'Select a destination account',
        })
      } else if (values.destination_account_id === values.account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['destination_account_id'],
          message: 'Destination account must be different from the source account',
        })
      }
    }

    if (values.next_occurrence_date && values.start_date && values.next_occurrence_date < values.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['next_occurrence_date'],
        message: 'Next occurrence date must be on or after the start date',
      })
    }

    if (values.end_date && values.start_date && values.end_date < values.start_date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end_date'], message: 'End date must be on or after the start date' })
    }
  })
