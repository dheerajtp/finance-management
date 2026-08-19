import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as goalTransactionAllocationService from '../../services/supabase/goalTransactionAllocation.service'

export const goalTransactionAllocationKeys = {
  list: (filters = {}) => ['goal-transaction-allocations', filters],
  detail: (id) => ['goal-transaction-allocation', id],
  goalTotal: (goalId) => ['goal-allocation-total', goalId],
  transactionAllocated: (transactionId) => ['transaction-allocated-amount', transactionId],
}

// `options` lets a caller pass `{ enabled: ... }` when the filters
// themselves aren't ready yet (e.g. a goalId that hasn't loaded) — without
// it, an unfiltered `{}` fetch would run prematurely and cache the wrong
// (unfiltered) result under that call site's expected key.
export const useGoalTransactionAllocationsQuery = (filters = {}, options = {}) =>
  useQuery({
    queryKey: goalTransactionAllocationKeys.list(filters),
    queryFn: () => goalTransactionAllocationService.getGoalTransactionAllocations(filters),
    ...options,
  })

export const useGoalTransactionAllocationQuery = (id) =>
  useQuery({
    queryKey: goalTransactionAllocationKeys.detail(id),
    queryFn: () => goalTransactionAllocationService.getGoalTransactionAllocation(id),
    enabled: Boolean(id),
  })

export const useGoalAllocationTotalQuery = (goalId) =>
  useQuery({
    queryKey: goalTransactionAllocationKeys.goalTotal(goalId),
    queryFn: () => goalTransactionAllocationService.getGoalAllocationTotal(goalId),
    enabled: Boolean(goalId),
  })

export const useTransactionAllocatedAmountQuery = (transactionId) =>
  useQuery({
    queryKey: goalTransactionAllocationKeys.transactionAllocated(transactionId),
    queryFn: () => goalTransactionAllocationService.getTransactionAllocatedAmount(transactionId),
    enabled: Boolean(transactionId),
  })

// A contribution mutation changes: the allocation list, both totals it
// affects, and (per task) the goals/transactions lists it's shown
// alongside — never accounts, since no allocation ever touches
// accounts.balance.
const useInvalidateGoalTransactionAllocations = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['goal-transaction-allocations'] })
    queryClient.invalidateQueries({ queryKey: ['goal-allocation-total'] })
    queryClient.invalidateQueries({ queryKey: ['transaction-allocated-amount'] })
    queryClient.invalidateQueries({ queryKey: ['goals'] })
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
  }
}

export const useCreateGoalTransactionAllocationMutation = () => {
  const invalidate = useInvalidateGoalTransactionAllocations()
  return useMutation({
    mutationFn: goalTransactionAllocationService.createGoalTransactionAllocation,
    onSuccess: invalidate,
  })
}

export const useUpdateGoalTransactionAllocationMutation = () => {
  const invalidate = useInvalidateGoalTransactionAllocations()
  return useMutation({
    mutationFn: ({ id, data }) => goalTransactionAllocationService.updateGoalTransactionAllocation(id, data),
    onSuccess: invalidate,
  })
}

export const useDeleteGoalTransactionAllocationMutation = () => {
  const invalidate = useInvalidateGoalTransactionAllocations()
  return useMutation({
    mutationFn: goalTransactionAllocationService.deleteGoalTransactionAllocation,
    onSuccess: invalidate,
  })
}
