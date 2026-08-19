import { Link } from 'react-router-dom'
import LoginForm from '../../components/forms/auth/LoginForm'
import useActionLogin from '../../hooks/functionality/useActionLogin'
import styles from './AuthPage.module.css'

const LoginPage = () => {
  const { onSubmit, loading } = useActionLogin()

  return (
    <div>
      <h1 className="text-page-title">Welcome back</h1>
      <p className={`text-page-subtitle ${styles.subtitle}`}>Log in to continue to your financial overview.</p>
      <LoginForm onSubmit={onSubmit} loading={loading} />
      <p className={`text-secondary ${styles.footer}`}>
        No account?{' '}
        <Link to="/register" className={styles.link}>
          Create one
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
