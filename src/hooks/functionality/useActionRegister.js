import { useNavigate } from 'react-router-dom'
import { useSetAtom } from 'jotai'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authKeys, useRegisterMutation } from '../api/useAuthApi'
import { useCreateProfileMutation } from '../api/useProfileApi'
import { currentUserAtom, profileAtom, authLoadingAtom } from '../../store/auth.store'
import { getAuthErrorMessage } from '../../utils/authErrors'
import { DEFAULT_CURRENCY } from '../../constants/currencies'

const useActionRegister = () => {
  const navigate = useNavigate()
  const setCurrentUser = useSetAtom(currentUserAtom)
  const setProfile = useSetAtom(profileAtom)
  const setAuthLoading = useSetAtom(authLoadingAtom)
  const queryClient = useQueryClient()
  const registerMutation = useRegisterMutation()
  const createProfileMutation = useCreateProfileMutation()

  const onSubmit = async ({ name, email, password }) => {
    try {
      const { session } = await registerMutation.mutateAsync({ email, password })

      // Email confirmation is required: signUp succeeds but no session is issued yet.
      if (!session) {
        toast.success('Check your email to confirm your account, then log in.')
        navigate('/login', { replace: true })
        return
      }

      setCurrentUser(session.user)
      setAuthLoading(false)
      queryClient.setQueryData(authKeys.user, session.user)

      const profile = await createProfileMutation.mutateAsync({ name, currency: DEFAULT_CURRENCY })
      setProfile(profile)

      toast.success('Account created')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
    }
  }

  const loading = registerMutation.isPending || createProfileMutation.isPending

  return { onSubmit, loading }
}

export default useActionRegister
