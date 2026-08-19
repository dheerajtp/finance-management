import { z } from 'zod'
import { TRANSACTION_TYPE_CODES } from '../../constants/transactionTypes'

const amount = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? NaN : Number(val)))
  .refine((val) => !Number.isNaN(val), { message: 'Enter a valid amount' })
  .refine((val) => val > 0, { message: 'Amount must be greater than zero' })

const optionalId = z.string().optional().or(z.literal(''))

export const transactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPE_CODES, { errorMap: () => ({ message: 'Select a transaction type' }) }),
    account_id: z.string().min(1, 'Select an account'),
    category_id: optionalId,
    destination_account_id: optionalId,
    amount,
    description: z.string().trim().max(280, 'Description must be under 280 characters').optional().or(z.literal('')),
    transaction_date: z.string().min(1, 'Date is required'),
  })
  .superRefine((values, ctx) => {
    if (values.type === 'income' || values.type === 'expense') {
      if (!values.category_id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['category_id'], message: 'Select a category' })
      }
    }

    if (values.type === 'transfer' || values.type === 'investment') {
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
  })
