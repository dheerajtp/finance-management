import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as emergencyFundService from '../../services/supabase/emergencyFund.service'

export const emergencyFundKeys = {
  detail: (userId) => ['emergency-fund-settings', userId],
}

export const useEmergencyFundSettingsQuery = (userId) =>
  useQuery({
    queryKey: emergencyFundKeys.detail(userId),
    queryFn: emergencyFundService.getSettings,
    enabled: Boolean(userId),
  })

export const useCreateEmergencyFundSettingsMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: emergencyFundService.createSettings,
    onSuccess: (settings) => {
      if (settings) queryClient.setQueryData(emergencyFundKeys.detail(settings.user_id), settings)
    },
  })
}

export const useUpdateEmergencyFundSettingsMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: emergencyFundService.updateSettings,
    onSuccess: (settings) => {
      if (settings) queryClient.setQueryData(emergencyFundKeys.detail(settings.user_id), settings)
    },
  })
}
