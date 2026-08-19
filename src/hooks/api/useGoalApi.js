import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as goalService from '../../services/supabase/goal.service'

export const goalKeys = {
  list: (filters = {}) => ['goals', filters],
  detail: (id) => ['goal', id],
}

export const useGoalsQuery = (filters = {}) =>
  useQuery({
    queryKey: goalKeys.list(filters),
    queryFn: () => goalService.getGoals(filters),
  })

export const useGoalQuery = (id) =>
  useQuery({
    queryKey: goalKeys.detail(id),
    queryFn: () => goalService.getGoal(id),
    enabled: Boolean(id),
  })

const useInvalidateGoals = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['goals'] })
}

export const useCreateGoalMutation = () => {
  const invalidate = useInvalidateGoals()
  return useMutation({ mutationFn: goalService.createGoal, onSuccess: invalidate })
}

export const useUpdateGoalMutation = () => {
  const invalidate = useInvalidateGoals()
  return useMutation({
    mutationFn: ({ id, data }) => goalService.updateGoal(id, data),
    onSuccess: invalidate,
  })
}

export const useDeactivateGoalMutation = () => {
  const invalidate = useInvalidateGoals()
  return useMutation({ mutationFn: goalService.deactivateGoal, onSuccess: invalidate })
}

export const useActivateGoalMutation = () => {
  const invalidate = useInvalidateGoals()
  return useMutation({ mutationFn: goalService.activateGoal, onSuccess: invalidate })
}
