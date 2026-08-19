import { useNavigate } from 'react-router-dom'
import { useSetAtom } from 'jotai'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authKeys, useLoginMutation } from '../api/useAuthApi'
import { currentUserAtom, authLoadingAtom } from '../../store/auth.store'
import { getAuthErrorMessage } from '../../utils/authErrors'

const useActionLogin = () => {
  const navigate = useNavigate()
  const setCurrentUser = useSetAtom(currentUserAtom)
  const setAuthLoading = useSetAtom(authLoadingAtom)
  const queryClient = useQueryClient()
  const loginMutation = useLoginMutation()

  const onSubmit = async (values) => {
    try {
      const { session } = await loginMutation.mutateAsync(values)
      setCurrentUser(session.user)
      setAuthLoading(false)
      queryClient.setQueryData(authKeys.user, session.user)
      toast.success('Welcome back')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
    }
  }

  return { onSubmit, loading: loginMutation.isPending }
}

export default useActionLogin
