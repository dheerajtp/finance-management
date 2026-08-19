import { Navigate, Outlet } from 'react-router-dom'
import useActionAuth from '../hooks/functionality/useActionAuth'
import PageLoader from '../components/ui/PageLoader'

const ProtectedRoute = () => {
  const { isAuthenticated, authLoading } = useActionAuth()

  if (authLoading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
