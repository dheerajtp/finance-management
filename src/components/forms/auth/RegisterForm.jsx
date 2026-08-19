import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema } from '../../../validations/auth/register.validation'
import { registerInputs } from '../../../inputs/auth/register.inputs'
import Input from '../../ui/Input'
import Button from '../../ui/Button'
import styles from './AuthForm.module.css'

const RegisterForm = ({ onSubmit, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {registerInputs.map((field) => (
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
        Create account
      </Button>
    </form>
  )
}

export default RegisterForm
