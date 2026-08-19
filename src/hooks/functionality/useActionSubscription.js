import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  useSubscriptionsQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeactivateSubscriptionMutation,
  useActivateSubscriptionMutation,
} from '../api/useSubscriptionApi'
import { useAccountsQuery } from '../api/useAccountApi'
import { useCategoriesQuery } from '../api/useCategoryApi'
import { subscriptionSchema } from '../../validations/subscriptions/subscription.validation'
import {
  calculateMonthlyEquivalent,
  calculateAnnualCost,
  calculateDaysUntilRenewal,
  getSubscriptionStatus,
  summarizeSubscriptions,
  sortSubscriptions,
} from '../../utils/finance/subscriptions'
import { DEFAULT_CURRENCY } from '../../constants/currencies'

const CHECK_VIOLATION = '23514'
const DEFAULT_CATEGORY_NAME = 'Subscriptions'

// Messages validate_subscription() (0011 migration) is known to raise — safe to show verbatim.
const KNOWN_MESSAGES = [
  'Account not found',
  'Category not found',
  'Subscriptions can only use expense categories',
  "Subscription currency must match the selected account's currency",
]

const toFriendlyMessage = (error) => {
  if (KNOWN_MESSAGES.some((message) => error?.message?.includes(message))) return error.message
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Could not save the subscription. Please try again.'
}

const emptyValues = {
  name: '',
  description: '',
  amount: '',
  currency: DEFAULT_CURRENCY,
  billing_frequency: 'monthly',
  next_billing_date: format(new Date(), 'yyyy-MM-dd'),
  account_id: '',
  category_id: '',
}

const useActionSubscription = () => {
  const [frequencyFilter, setFrequencyFilter] = useState('all')
  const [currencyFilter, setCurrencyFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(false)

  const subscriptionsQuery = useSubscriptionsQuery(showInactive ? {} : { isActive: true })
  const accountsQuery = useAccountsQuery()
  const categoriesQuery = useCategoriesQuery({ type: 'expense', isActive: true })

  const createMutation = useCreateSubscriptionMutation()
  const updateMutation = useUpdateSubscriptionMutation()
  const deactivateMutation = useDeactivateSubscriptionMutation()
  const activateMutation = useActivateSubscriptionMutation()

  const [editingSubscription, setEditingSubscription] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingToggle, setPendingToggle] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(subscriptionSchema), defaultValues: emptyValues })

  const accounts = accountsQuery.data ?? []
  const categories = categoriesQuery.data ?? []

  const accountsById = useMemo(
    () => Object.fromEntries((accountsQuery.data ?? []).map((account) => [account.id, account])),
    [accountsQuery.data],
  )
  const categoriesById = useMemo(
    () => Object.fromEntries((categoriesQuery.data ?? []).map((category) => [category.id, category])),
    [categoriesQuery.data],
  )

  const accountOptions = [
    { value: '', label: 'No account' },
    ...accounts
      .filter((account) => account.is_active)
      .map((account) => ({ value: account.id, label: `${account.name} (${account.currency})` })),
  ]
  const categoryOptions = [
    { value: '', label: 'No category' },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ]
  const defaultCategoryId = categories.find((category) => category.name === DEFAULT_CATEGORY_NAME)?.id ?? ''

  const openCreateForm = () => {
    setEditingSubscription(null)
    reset({ ...emptyValues, category_id: defaultCategoryId })
    setIsFormOpen(true)
  }

  const openEditForm = (subscription) => {
    setEditingSubscription(subscription)
    reset({
      name: subscription.name,
      description: subscription.description ?? '',
      amount: subscription.amount,
      currency: subscription.currency,
      billing_frequency: subscription.billing_frequency,
      next_billing_date: subscription.next_billing_date,
      account_id: subscription.account_id ?? '',
      category_id: subscription.category_id ?? '',
    })
    setIsFormOpen(true)
  }

  const closeForm = () => setIsFormOpen(false)

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      description: values.description || null,
      amount: values.amount,
      currency: values.currency,
      billing_frequency: values.billing_frequency,
      next_billing_date: values.next_billing_date,
      account_id: values.account_id || null,
      category_id: values.category_id || null,
    }

    try {
      if (editingSubscription) {
        await updateMutation.mutateAsync({ id: editingSubscription.id, data: payload })
        toast.success('Subscription updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Subscription added')
      }
      setIsFormOpen(false)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const requestToggleActive = (subscription) => setPendingToggle(subscription)
  const cancelToggleActive = () => setPendingToggle(null)

  const confirmToggleActive = async () => {
    if (!pendingToggle) return
    try {
      if (pendingToggle.is_active) {
        await deactivateMutation.mutateAsync(pendingToggle.id)
        toast.success('Subscription deactivated')
      } else {
        await activateMutation.mutateAsync(pendingToggle.id)
        toast.success('Subscription activated')
      }
      setPendingToggle(null)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const today = new Date()
  const decoratedSubscriptions = (subscriptionsQuery.data ?? []).map((subscription) => ({
    ...subscription,
    accountName: subscription.account_id ? accountsById[subscription.account_id]?.name ?? 'Unknown account' : null,
    categoryName: subscription.category_id ? categoriesById[subscription.category_id]?.name ?? 'Unknown category' : null,
    monthlyEquivalent: calculateMonthlyEquivalent(subscription.amount, subscription.billing_frequency),
    annualCost: calculateAnnualCost(subscription.amount, subscription.billing_frequency),
    daysUntilRenewal: calculateDaysUntilRenewal(subscription.next_billing_date, today),
    status: getSubscriptionStatus(subscription, today),
  }))

  const currencyOptions = Array.from(new Set(decoratedSubscriptions.map((subscription) => subscription.currency))).map(
    (currency) => ({ value: currency, label: currency }),
  )

  const filteredSubscriptions = decoratedSubscriptions.filter((subscription) => {
    if (frequencyFilter !== 'all' && subscription.billing_frequency !== frequencyFilter) return false
    if (currencyFilter !== 'all' && subscription.currency !== currencyFilter) return false
    return true
  })

  const sortedSubscriptions = sortSubscriptions(filteredSubscriptions)
  const upcomingRenewals = sortSubscriptions(
    decoratedSubscriptions.filter((subscription) => subscription.is_active && subscription.status !== 'active'),
  )

  return {
    subscriptions: sortedSubscriptions,
    allSubscriptions: decoratedSubscriptions,
    upcomingRenewals,
    summary: summarizeSubscriptions(decoratedSubscriptions),
    isLoading: subscriptionsQuery.isLoading || accountsQuery.isLoading || categoriesQuery.isLoading,
    isError: subscriptionsQuery.isError || accountsQuery.isError || categoriesQuery.isError,
    refetch: () => {
      subscriptionsQuery.refetch()
      accountsQuery.refetch()
      categoriesQuery.refetch()
    },

    frequencyFilter,
    setFrequencyFilter,
    currencyFilter,
    setCurrencyFilter,
    currencyOptions,
    showInactive,
    setShowInactive,

    isFormOpen,
    isEditing: Boolean(editingSubscription),
    openCreateForm,
    openEditForm,
    closeForm,
    register,
    errors,
    onSubmit: handleSubmit(onSubmit),
    saving: createMutation.isPending || updateMutation.isPending,
    accountOptions,
    categoryOptions,

    pendingToggle,
    requestToggleActive,
    cancelToggleActive,
    confirmToggleActive,
    togglingActive: deactivateMutation.isPending || activateMutation.isPending,
  }
}

export default useActionSubscription
