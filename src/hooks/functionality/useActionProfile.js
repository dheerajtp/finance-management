import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSetAtom } from 'jotai'
import toast from 'react-hot-toast'
import useActionAuth from './useActionAuth'
import { useProfileQuery, useCreateProfileMutation, useUpdateProfileMutation } from '../api/useProfileApi'
import { profileAtom } from '../../store/auth.store'
import { profileSchema } from '../../validations/profile/profile.validation'
import { DEFAULT_CURRENCY } from '../../constants/currencies'

const CHECK_VIOLATION = '23514'

const toFriendlyMessage = (error) => {
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Could not save your profile. Please try again.'
}

const useActionProfile = () => {
  const { currentUser } = useActionAuth()
  const setProfile = useSetAtom(profileAtom)
  const profileQuery = useProfileQuery(currentUser?.id)
  const createProfileMutation = useCreateProfileMutation()
  const updateProfileMutation = useUpdateProfileMutation()
  const profile = profileQuery.data ?? null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', currency: DEFAULT_CURRENCY, monthlyIncome: '', monthlySavingsTarget: '' },
  })

  useEffect(() => {
    if (!profile) return
    reset({
      name: profile.name ?? '',
      currency: profile.currency ?? DEFAULT_CURRENCY,
      monthlyIncome: profile.monthly_income ?? '',
      monthlySavingsTarget: profile.monthly_savings_target ?? '',
    })
  }, [profile, reset])

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      currency: values.currency,
      monthly_income: values.monthlyIncome,
      monthly_savings_target: values.monthlySavingsTarget,
    }

    try {
      const saved = profile
        ? await updateProfileMutation.mutateAsync(payload)
        : await createProfileMutation.mutateAsync(payload)
      setProfile(saved)
      toast.success('Profile saved')
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  return {
    register,
    onSubmit: handleSubmit(onSubmit),
    errors,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    refetch: profileQuery.refetch,
    saving: createProfileMutation.isPending || updateProfileMutation.isPending,
  }
}

export default useActionProfile
