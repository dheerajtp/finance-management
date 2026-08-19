import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as financialFreedomService from '../../services/supabase/financialFreedom.service'

export const financialFreedomKeys = {
  detail: (userId) => ['financial-freedom-settings', userId],
}

export const useFinancialFreedomSettingsQuery = (userId) =>
  useQuery({
    queryKey: financialFreedomKeys.detail(userId),
    queryFn: financialFreedomService.getSettings,
    enabled: Boolean(userId),
  })

export const useCreateFinancialFreedomSettingsMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: financialFreedomService.createSettings,
    onSuccess: (settings) => {
      if (settings) queryClient.setQueryData(financialFreedomKeys.detail(settings.user_id), settings)
    },
  })
}

export const useUpdateFinancialFreedomSettingsMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: financialFreedomService.updateSettings,
    onSuccess: (settings) => {
      if (settings) queryClient.setQueryData(financialFreedomKeys.detail(settings.user_id), settings)
    },
  })
}
