import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as transactionService from '../../services/supabase/transaction.service'

export const transactionKeys = {
  list: (filters = {}) => ['transactions', filters],
  detail: (id) => ['transaction', id],
}

export const useTransactionsQuery = (filters = {}) =>
  useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => transactionService.getTransactions(filters),
  })

export const useTransactionQuery = (id) =>
  useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionService.getTransaction(id),
    enabled: Boolean(id),
  })

// Account balances are manually maintained (see 0005 migration) — creating,
// editing, or deleting a transaction never changes accounts.balance, so
// there is nothing to invalidate on the account queries here.
const useInvalidateTransactions = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
}

export const useCreateTransactionMutation = () => {
  const invalidate = useInvalidateTransactions()
  return useMutation({ mutationFn: transactionService.createTransaction, onSuccess: invalidate })
}

export const useUpdateTransactionMutation = () => {
  const invalidate = useInvalidateTransactions()
  return useMutation({
    mutationFn: ({ id, data }) => transactionService.updateTransaction(id, data),
    onSuccess: invalidate,
  })
}

export const useDeleteTransactionMutation = () => {
  const invalidate = useInvalidateTransactions()
  return useMutation({ mutationFn: transactionService.deleteTransaction, onSuccess: invalidate })
}
