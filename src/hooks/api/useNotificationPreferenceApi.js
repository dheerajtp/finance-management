import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as notificationPreferenceService from '../../services/supabase/notificationPreference.service'

export const notificationPreferenceKeys = {
  detail: (userId) => ['notification-preferences', userId],
}

export const useNotificationPreferencesQuery = (userId) =>
  useQuery({
    queryKey: notificationPreferenceKeys.detail(userId),
    queryFn: notificationPreferenceService.getPreferences,
    enabled: Boolean(userId),
  })

export const useCreateNotificationPreferencesMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationPreferenceService.createPreferences,
    onSuccess: (preferences) => {
      if (preferences) queryClient.setQueryData(notificationPreferenceKeys.detail(preferences.user_id), preferences)
    },
  })
}

export const useUpdateNotificationPreferencesMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: notificationPreferenceService.updatePreferences,
    onSuccess: (preferences) => {
      if (preferences) queryClient.setQueryData(notificationPreferenceKeys.detail(preferences.user_id), preferences)
    },
  })
}
