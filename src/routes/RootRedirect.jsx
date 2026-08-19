import { Navigate } from 'react-router-dom'
import useActionAuth from '../hooks/functionality/useActionAuth'
import PageLoader from '../components/ui/PageLoader'

const RootRedirect = () => {
  const { isAuthenticated, authLoading } = useActionAuth()

  if (authLoading) {
    return <PageLoader />
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

export default RootRedirect
