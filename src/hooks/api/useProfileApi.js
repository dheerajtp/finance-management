import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as profileService from '../../services/supabase/profile.service'

export const profileKeys = {
  detail: (userId) => ['profile', userId],
}

export const useProfileQuery = (userId) =>
  useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: profileService.getProfile,
    enabled: Boolean(userId),
  })

export const useCreateProfileMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileService.createProfile,
    onSuccess: (profile) => {
      if (profile) queryClient.setQueryData(profileKeys.detail(profile.id), profile)
    },
  })
}

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: (profile) => {
      if (profile) queryClient.setQueryData(profileKeys.detail(profile.id), profile)
    },
  })
}
