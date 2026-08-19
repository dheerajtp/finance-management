import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  useAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeactivateAccountMutation,
  useActivateAccountMutation,
} from '../api/useAccountApi'
import { accountSchema } from '../../validations/accounts/account.validation'
import { DEFAULT_CURRENCY } from '../../constants/currencies'

const CHECK_VIOLATION = '23514'

const toFriendlyMessage = (error) => {
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Could not save the account. Please try again.'
}

const emptyValues = { name: '', type: 'bank', balance: '', currency: DEFAULT_CURRENCY }

const useActionAccount = () => {
  const accountsQuery = useAccountsQuery()
  const createMutation = useCreateAccountMutation()
  const updateMutation = useUpdateAccountMutation()
  const deactivateMutation = useDeactivateAccountMutation()
  const activateMutation = useActivateAccountMutation()

  const [editingAccount, setEditingAccount] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingToggle, setPendingToggle] = useState(null)
  const [showInactive, setShowInactive] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(accountSchema), defaultValues: emptyValues })

  const openCreateForm = () => {
    setEditingAccount(null)
    reset(emptyValues)
    setIsFormOpen(true)
  }

  const openEditForm = (account) => {
    setEditingAccount(account)
    reset({ name: account.name, type: account.type, balance: account.balance, currency: account.currency })
    setIsFormOpen(true)
  }

  const closeForm = () => setIsFormOpen(false)

  const onSubmit = async (values) => {
    try {
      if (editingAccount) {
        await updateMutation.mutateAsync({ id: editingAccount.id, data: values })
        toast.success('Account updated')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Account added')
      }
      setIsFormOpen(false)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const requestToggleActive = (account) => setPendingToggle(account)
  const cancelToggleActive = () => setPendingToggle(null)

  const confirmToggleActive = async () => {
    if (!pendingToggle) return
    try {
      if (pendingToggle.is_active) {
        await deactivateMutation.mutateAsync(pendingToggle.id)
        toast.success('Account deactivated')
      } else {
        await activateMutation.mutateAsync(pendingToggle.id)
        toast.success('Account activated')
      }
      setPendingToggle(null)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const allAccounts = accountsQuery.data ?? []
  const visibleAccounts = showInactive ? allAccounts : allAccounts.filter((account) => account.is_active)

  return {
    accounts: visibleAccounts,
    allAccounts,
    isLoading: accountsQuery.isLoading,
    isError: accountsQuery.isError,
    refetch: accountsQuery.refetch,
    showInactive,
    setShowInactive,

    isFormOpen,
    isEditing: Boolean(editingAccount),
    openCreateForm,
    openEditForm,
    closeForm,
    register,
    errors,
    onSubmit: handleSubmit(onSubmit),
    saving: createMutation.isPending || updateMutation.isPending,

    pendingToggle,
    requestToggleActive,
    cancelToggleActive,
    confirmToggleActive,
    togglingActive: deactivateMutation.isPending || activateMutation.isPending,
  }
}

export default useActionAccount
