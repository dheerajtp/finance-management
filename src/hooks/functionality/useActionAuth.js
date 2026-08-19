import { useCallback, useEffect, useState } from 'react'
import { useAtom, useSetAtom } from 'jotai'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { currentUserAtom, profileAtom, authLoadingAtom } from '../../store/auth.store'
import { authKeys, useCurrentUserQuery, useLogoutMutation, useAuthStateListener } from '../api/useAuthApi'
import { useProfileQuery } from '../api/useProfileApi'
import { getAuthErrorMessage } from '../../utils/authErrors'

const useActionAuth = () => {
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom)
  const setProfile = useSetAtom(profileAtom)
  const [authLoading, setAuthLoading] = useAtom(authLoadingAtom)
  const queryClient = useQueryClient()

  const userQuery = useCurrentUserQuery()
  const profileQuery = useProfileQuery(userQuery.data?.id)
  const logoutMutation = useLogoutMutation()

  useEffect(() => {
    if (!userQuery.isFetched) return
    setCurrentUser(userQuery.data ?? null)
    setAuthLoading(false)
  }, [userQuery.isFetched, userQuery.data, setCurrentUser, setAuthLoading])

  useEffect(() => {
    setProfile(profileQuery.data ?? null)
  }, [profileQuery.data, setProfile])

  const handleAuthStateChange = useCallback(
    (_event, session) => {
      const user = session?.user ?? null
      setCurrentUser(user)
      setAuthLoading(false)
      queryClient.setQueryData(authKeys.user, user)
    },
    [queryClient, setCurrentUser, setAuthLoading],
  )

  useAuthStateListener(handleAuthStateChange)

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)

  // Every logout entry point (Header, Settings) routes through this same
  // confirm → mutate flow rather than calling the mutation directly.
  const requestLogout = () => setIsLogoutConfirmOpen(true)
  const cancelLogout = () => setIsLogoutConfirmOpen(false)

  const confirmLogout = async () => {
    if (logoutMutation.isPending) return
    try {
      await logoutMutation.mutateAsync()
      queryClient.clear()
      setCurrentUser(null)
      setProfile(null)
      setIsLogoutConfirmOpen(false)
      toast.success('Logged out')
    } catch (error) {
      // Stay authenticated and keep the modal open so the user can retry or cancel.
      toast.error(getAuthErrorMessage(error))
    }
  }

  return {
    currentUser,
    profile: profileQuery.data ?? null,
    isAuthenticated: Boolean(currentUser),
    authLoading,
    isLogoutConfirmOpen,
    requestLogout,
    cancelLogout,
    confirmLogout,
    loggingOut: logoutMutation.isPending,
  }
}

export default useActionAuth
