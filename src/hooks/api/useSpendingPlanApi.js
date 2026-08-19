import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as spendingPlanService from '../../services/supabase/spendingPlan.service'

export const spendingPlanKeys = {
  detail: (userId) => ['spending-plan-settings', userId],
}

export const useSpendingPlanSettingsQuery = (userId) =>
  useQuery({
    queryKey: spendingPlanKeys.detail(userId),
    queryFn: spendingPlanService.getSettings,
    enabled: Boolean(userId),
  })

export const useCreateSpendingPlanSettingsMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: spendingPlanService.createSettings,
    onSuccess: (settings) => {
      if (settings) queryClient.setQueryData(spendingPlanKeys.detail(settings.user_id), settings)
    },
  })
}

export const useUpdateSpendingPlanSettingsMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: spendingPlanService.updateSettings,
    onSuccess: (settings) => {
      if (settings) queryClient.setQueryData(spendingPlanKeys.detail(settings.user_id), settings)
    },
  })
}
