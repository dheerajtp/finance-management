import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as budgetService from '../../services/supabase/budget.service'

export const budgetKeys = {
  list: (filters = {}) => ['budgets', filters],
  detail: (id) => ['budget', id],
}

export const useBudgetsQuery = (filters = {}) =>
  useQuery({
    queryKey: budgetKeys.list(filters),
    queryFn: () => budgetService.getBudgets(filters),
  })

export const useBudgetQuery = (id) =>
  useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: () => budgetService.getBudget(id),
    enabled: Boolean(id),
  })

const useInvalidateBudgets = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['budgets'] })
}

export const useCreateBudgetMutation = () => {
  const invalidate = useInvalidateBudgets()
  return useMutation({ mutationFn: budgetService.createBudget, onSuccess: invalidate })
}

export const useUpdateBudgetMutation = () => {
  const invalidate = useInvalidateBudgets()
  return useMutation({
    mutationFn: ({ id, data }) => budgetService.updateBudget(id, data),
    onSuccess: invalidate,
  })
}

export const useDeactivateBudgetMutation = () => {
  const invalidate = useInvalidateBudgets()
  return useMutation({ mutationFn: budgetService.deactivateBudget, onSuccess: invalidate })
}

export const useActivateBudgetMutation = () => {
  const invalidate = useInvalidateBudgets()
  return useMutation({ mutationFn: budgetService.activateBudget, onSuccess: invalidate })
}
