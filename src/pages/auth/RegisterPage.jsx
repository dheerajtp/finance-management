import { Link } from 'react-router-dom'
import RegisterForm from '../../components/forms/auth/RegisterForm'
import useActionRegister from '../../hooks/functionality/useActionRegister'
import styles from './AuthPage.module.css'

const RegisterPage = () => {
  const { onSubmit, loading } = useActionRegister()

  return (
    <div>
      <h1 className="text-page-title">Create your account</h1>
      <p className={`text-page-subtitle ${styles.subtitle}`}>Start building your financial freedom plan.</p>
      <RegisterForm onSubmit={onSubmit} loading={loading} />
      <p className={`text-secondary ${styles.footer}`}>
        Already have an account?{' '}
        <Link to="/login" className={styles.link}>
          Log in
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
