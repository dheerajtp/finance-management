import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as goalContributionService from '../../services/supabase/goalContribution.service'

export const goalContributionKeys = {
  list: (goalId) => ['goal-contributions', goalId],
  detail: (id) => ['goal-contribution', id],
}

export const useGoalContributionsQuery = (goalId) =>
  useQuery({
    queryKey: goalContributionKeys.list(goalId),
    queryFn: () => goalContributionService.getGoalContributions(goalId),
    enabled: Boolean(goalId),
  })

export const useGoalContributionQuery = (id) =>
  useQuery({
    queryKey: goalContributionKeys.detail(id),
    queryFn: () => goalContributionService.getGoalContribution(id),
    enabled: Boolean(id),
  })

// Every mutation changes the derived goals.current_amount (see the
// sync_goal_current_amount() trigger in 0010), so goals must invalidate
// alongside goal-contributions on every write.
const useInvalidateGoalContributions = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['goal-contributions'] })
    queryClient.invalidateQueries({ queryKey: ['goals'] })
    queryClient.invalidateQueries({ queryKey: ['goal'] })
  }
}

export const useCreateGoalContributionMutation = () => {
  const invalidate = useInvalidateGoalContributions()
  return useMutation({ mutationFn: goalContributionService.createGoalContribution, onSuccess: invalidate })
}

export const useUpdateGoalContributionMutation = () => {
  const invalidate = useInvalidateGoalContributions()
  return useMutation({
    mutationFn: ({ id, data }) => goalContributionService.updateGoalContribution(id, data),
    onSuccess: invalidate,
  })
}

export const useDeleteGoalContributionMutation = () => {
  const invalidate = useInvalidateGoalContributions()
  return useMutation({ mutationFn: goalContributionService.deleteGoalContribution, onSuccess: invalidate })
}
