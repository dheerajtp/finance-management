import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  useCreateRecurringTransactionMutation,
  useUpdateRecurringTransactionMutation,
} from '../api/useRecurringTransactionApi'
import { useAccountsQuery } from '../api/useAccountApi'
import { useCategoriesQuery } from '../api/useCategoryApi'
import { useSubscriptionsQuery } from '../api/useSubscriptionApi'
import { recurringTransactionSchema } from '../../validations/recurringTransactions/recurringTransaction.validation'
import { DEFAULT_CURRENCY } from '../../constants/currencies'

const CHECK_VIOLATION = '23514'

// Messages validate_recurring_transaction() (0012 migration) is known to
// raise — safe to show verbatim.
const KNOWN_MESSAGES = [
  'Account not found',
  'Cannot create a recurring transaction on an inactive account',
  'Recurring transaction currency must match the account currency',
  'Destination account not found',
  'Cannot create a recurring transfer to an inactive account',
  'Cannot transfer between accounts with different currencies',
  'Category not found',
  'Category type does not match recurring transaction type',
]

const toFriendlyMessage = (error) => {
  if (KNOWN_MESSAGES.some((message) => error?.message?.includes(message))) return error.message
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Could not save the recurring transaction. Please try again.'
}

const buildEmptyValues = () => ({
  type: 'expense',
  account_id: '',
  category_id: '',
  destination_account_id: '',
  amount: '',
  currency: DEFAULT_CURRENCY,
  description: '',
  frequency: 'monthly',
  start_date: format(new Date(), 'yyyy-MM-dd'),
  next_occurrence_date: format(new Date(), 'yyyy-MM-dd'),
  end_date: '',
})

// Owns the add/edit form: field state, conditional category/destination-
// account behavior by type, currency-follows-account, and the optional
// "related subscription" autofill. See useActionRecurringTransaction for
// the list/filter/summary side.
const useActionRecurringTransactionForm = () => {
  const accountsQuery = useAccountsQuery()
  const subscriptionsQuery = useSubscriptionsQuery({ isActive: true })

  const createMutation = useCreateRecurringTransactionMutation()
  const updateMutation = useUpdateRecurringTransactionMutation()

  const [editingItem, setEditingItem] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(recurringTransactionSchema), defaultValues: buildEmptyValues() })

  const watchedType = watch('type')
  const watchedAccountId = watch('account_id')

  const formCategoriesQuery = useCategoriesQuery({ type: watchedType, isActive: true })

  const accounts = accountsQuery.data ?? []
  const activeAccounts = accounts.filter((account) => account.is_active)
  const subscriptions = subscriptionsQuery.data ?? []

  const accountsById = useMemo(
    () => Object.fromEntries((accountsQuery.data ?? []).map((account) => [account.id, account])),
    [accountsQuery.data],
  )

  // Currency always follows the chosen account — the field is read-only in
  // the form, so a mismatch can't be entered from the UI (the DB trigger
  // still backstops this regardless).
  useEffect(() => {
    const account = accountsById[watchedAccountId]
    if (account) setValue('currency', account.currency)
  }, [watchedAccountId, accountsById, setValue])

  useEffect(() => {
    setValue('category_id', '')
    setValue('destination_account_id', '')
  }, [watchedType, setValue])

  const accountOptions = activeAccounts.map((account) => ({
    value: account.id,
    label: `${account.name} (${account.currency})`,
  }))
  const destinationAccountOptions = accountOptions.filter((option) => option.value !== watchedAccountId)
  const categoryOptions = (formCategoriesQuery.data ?? []).map((category) => ({ value: category.id, label: category.name }))
  const subscriptionOptions = subscriptions.map((subscription) => ({ value: subscription.id, label: subscription.name }))

  const openCreateForm = () => {
    setEditingItem(null)
    reset(buildEmptyValues())
    setIsFormOpen(true)
  }

  const openEditForm = (item) => {
    setEditingItem(item)
    reset({
      type: item.type,
      account_id: item.account_id,
      category_id: item.category_id ?? '',
      destination_account_id: item.destination_account_id ?? '',
      amount: item.amount,
      currency: item.currency,
      description: item.description ?? '',
      frequency: item.frequency,
      start_date: item.start_date,
      next_occurrence_date: item.next_occurrence_date,
      end_date: item.end_date ?? '',
    })
    setIsFormOpen(true)
  }

  const closeForm = () => setIsFormOpen(false)

  // Pure convenience autofill — nothing is persisted or linked. The user
  // still has to review and explicitly save the recurring transaction.
  const applySubscription = (subscriptionId) => {
    const subscription = subscriptions.find((item) => item.id === subscriptionId)
    if (!subscription) return
    setValue('type', 'expense')
    setValue('description', subscription.name)
    setValue('amount', subscription.amount)
    setValue('frequency', subscription.billing_frequency)
    setValue('start_date', subscription.next_billing_date)
    setValue('next_occurrence_date', subscription.next_billing_date)
    if (subscription.account_id) setValue('account_id', subscription.account_id)
    if (subscription.category_id) setValue('category_id', subscription.category_id)
  }

  const onSubmit = async (values) => {
    if (values.type === 'transfer') {
      const source = accountsById[values.account_id]
      const destination = accountsById[values.destination_account_id]
      if (source && destination && source.currency !== destination.currency) {
        setError('destination_account_id', { message: 'Both accounts must use the same currency' })
        return
      }
    }

    const payload = {
      type: values.type,
      account_id: values.account_id,
      amount: values.amount,
      currency: values.currency,
      description: values.description || null,
      category_id: values.type === 'transfer' ? null : values.category_id,
      destination_account_id: values.type === 'transfer' ? values.destination_account_id : null,
      frequency: values.frequency,
      start_date: values.start_date,
      next_occurrence_date: values.next_occurrence_date,
      end_date: values.end_date || null,
    }

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, data: payload })
        toast.success('Recurring transaction updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Recurring transaction added')
      }
      setIsFormOpen(false)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  return {
    isFormOpen,
    isEditing: Boolean(editingItem),
    openCreateForm,
    openEditForm,
    closeForm,
    register,
    errors,
    watchedType,
    accountOptions,
    destinationAccountOptions,
    categoryOptions,
    subscriptionOptions,
    applySubscription,
    onSubmit: handleSubmit(onSubmit),
    saving: createMutation.isPending || updateMutation.isPending,
  }
}

export default useActionRecurringTransactionForm
