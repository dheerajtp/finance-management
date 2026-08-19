import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as authService from '../../services/supabase/auth.service'

export const authKeys = {
  user: ['auth', 'user'],
}

export const useCurrentUserQuery = () =>
  useQuery({
    queryKey: authKeys.user,
    queryFn: authService.restoreSession,
    retry: false,
    staleTime: Infinity,
  })

export const useRegisterMutation = () =>
  useMutation({
    mutationFn: ({ email, password }) => authService.register(email, password),
  })

export const useLoginMutation = () =>
  useMutation({
    mutationFn: ({ email, password }) => authService.login(email, password),
  })

export const useChangePasswordMutation = () => useMutation({ mutationFn: authService.changePassword })

export const useLogoutMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => queryClient.removeQueries({ queryKey: authKeys.user }),
  })
}

// Keeps the query cache in sync with SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED / USER_UPDATED.
export const useAuthStateListener = (onChange) => {
  useEffect(() => {
    const {
      data: { subscription },
    } = authService.onAuthStateChange(onChange)
    return () => subscription.unsubscribe()
  }, [onChange])
}
