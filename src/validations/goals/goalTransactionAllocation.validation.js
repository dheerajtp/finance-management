import { z } from 'zod'

const positiveAmount = z
  .union([z.string(), z.number()])
  .transform((val) => (val === '' || val === null || val === undefined ? NaN : Number(val)))
  .refine((val) => Number.isFinite(val), { message: 'Enter a valid amount' })
  .refine((val) => val > 0, { message: 'Contribution amount must be greater than zero' })

// goal_id/transaction_id are deliberately NOT required here: depending on
// entry point, exactly one of them is fixed by context (the goal detail
// page fixes goal_id, the transaction "Allocate to goal" flow fixes
// transaction_id) rather than picked from this form — each functionality
// hook validates presence of whichever one it expects the user to select.
// Currency and cross-currency checks aren't expressible here without live
// goal/transaction data either — the hooks validate those against the
// currently-loaded goal and transaction before submitting (the DB trigger
// is the final backstop regardless).
export const goalTransactionAllocationSchema = z.object({
  goal_id: z.string().optional().or(z.literal('')),
  transaction_id: z.string().optional().or(z.literal('')),
  amount: positiveAmount,
  contribution_date: z.string().optional().or(z.literal('')),
  note: z.string().trim().max(280, 'Note must be under 280 characters').optional().or(z.literal('')),
})
