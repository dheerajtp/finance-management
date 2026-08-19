import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as recurringTransactionService from '../../services/supabase/recurringTransaction.service'

export const recurringTransactionKeys = {
  list: (filters = {}) => ['recurring-transactions', filters],
  detail: (id) => ['recurring-transaction', id],
}

export const useRecurringTransactionsQuery = (filters = {}) =>
  useQuery({
    queryKey: recurringTransactionKeys.list(filters),
    queryFn: () => recurringTransactionService.getRecurringTransactions(filters),
  })

export const useRecurringTransactionQuery = (id) =>
  useQuery({
    queryKey: recurringTransactionKeys.detail(id),
    queryFn: () => recurringTransactionService.getRecurringTransaction(id),
    enabled: Boolean(id),
  })

const useInvalidateRecurringTransactions = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
}

export const useCreateRecurringTransactionMutation = () => {
  const invalidate = useInvalidateRecurringTransactions()
  return useMutation({ mutationFn: recurringTransactionService.createRecurringTransaction, onSuccess: invalidate })
}

export const useUpdateRecurringTransactionMutation = () => {
  const invalidate = useInvalidateRecurringTransactions()
  return useMutation({
    mutationFn: ({ id, data }) => recurringTransactionService.updateRecurringTransaction(id, data),
    onSuccess: invalidate,
  })
}

export const useDeactivateRecurringTransactionMutation = () => {
  const invalidate = useInvalidateRecurringTransactions()
  return useMutation({ mutationFn: recurringTransactionService.deactivateRecurringTransaction, onSuccess: invalidate })
}

export const useActivateRecurringTransactionMutation = () => {
  const invalidate = useInvalidateRecurringTransactions()
  return useMutation({ mutationFn: recurringTransactionService.activateRecurringTransaction, onSuccess: invalidate })
}

// Confirming an occurrence changes both this recurring definition (its
// schedule advances) and the transactions ledger (a new row exists) — never
// accounts, since this task deliberately never touches accounts.balance.
export const useMarkRecurringTransactionProcessedMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, transactionId, nextOccurrenceDate }) =>
      recurringTransactionService.markRecurringTransactionProcessed(id, { transactionId, nextOccurrenceDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
