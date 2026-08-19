import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '../../../validations/auth/login.validation'
import { loginInputs } from '../../../inputs/auth/login.inputs'
import Input from '../../ui/Input'
import Button from '../../ui/Button'
import styles from './AuthForm.module.css'

const LoginForm = ({ onSubmit, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {loginInputs.map((field) => (
        <Input
          key={field.name}
          id={field.name}
          label={field.label}
          type={field.type}
          autoComplete={field.autoComplete}
          error={errors[field.name]?.message}
          {...register(field.name)}
        />
      ))}
      <Button type="submit" loading={loading} className={styles.submit}>
        Log in
      </Button>
    </form>
  )
}

export default LoginForm
