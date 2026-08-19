import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import AuthLayout from '../components/layout/AuthLayout'
import ProtectedRoute from './ProtectedRoute'
import RootRedirect from './RootRedirect'
import NotFoundPage from '../pages/NotFoundPage'
import { publicRoutes, protectedRoutes } from './routes'

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<AuthLayout />}>
          {publicRoutes.map(({ path, element: Element }) => (
            <Route key={path} path={path} element={<Element />} />
          ))}
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {protectedRoutes.map(({ path, element: Element }) => (
              <Route key={path} path={path} element={<Element />} />
            ))}
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
