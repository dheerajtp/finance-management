import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  useRecurringTransactionsQuery,
  useDeactivateRecurringTransactionMutation,
  useActivateRecurringTransactionMutation,
} from '../api/useRecurringTransactionApi'
import { useAccountsQuery } from '../api/useAccountApi'
import { useCategoriesQuery } from '../api/useCategoryApi'
import {
  calculateMonthlyEquivalent,
  calculateAnnualEquivalent,
  calculateDaysUntilOccurrence,
  getRecurringTransactionStatus,
  sortRecurringTransactions,
  summarizeRecurringTransactions,
} from '../../utils/finance/recurringTransactions'

const UPCOMING_PREVIEW_SIZE = 8

const TOGGLE_ERROR_MESSAGE = 'Could not update this recurring transaction. Please try again.'

// Owns the list side: filters, active/inactive state, due/upcoming
// classification, sorting, summary, and deactivate/activate. The add/edit
// form lives in useActionRecurringTransactionForm and the confirm-and-
// record flow in useActionRecurringTransactionRecord — three focused hooks
// instead of one file holding all of it, per the project's file-size rule.
const useActionRecurringTransaction = () => {
  const [typeFilter, setTypeFilter] = useState('all')
  const [frequencyFilter, setFrequencyFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(false)

  const recurringTransactionsQuery = useRecurringTransactionsQuery(showInactive ? {} : { isActive: true })
  const accountsQuery = useAccountsQuery()
  const categoriesQuery = useCategoriesQuery({})

  const deactivateMutation = useDeactivateRecurringTransactionMutation()
  const activateMutation = useActivateRecurringTransactionMutation()

  const [pendingToggle, setPendingToggle] = useState(null)

  const accountsById = useMemo(
    () => Object.fromEntries((accountsQuery.data ?? []).map((account) => [account.id, account])),
    [accountsQuery.data],
  )
  const categoriesById = useMemo(
    () => Object.fromEntries((categoriesQuery.data ?? []).map((category) => [category.id, category])),
    [categoriesQuery.data],
  )

  const requestToggleActive = (item) => setPendingToggle(item)
  const cancelToggleActive = () => setPendingToggle(null)

  const confirmToggleActive = async () => {
    if (!pendingToggle) return
    try {
      if (pendingToggle.is_active) {
        await deactivateMutation.mutateAsync(pendingToggle.id)
        toast.success('Recurring transaction deactivated')
      } else {
        await activateMutation.mutateAsync(pendingToggle.id)
        toast.success('Recurring transaction activated')
      }
      setPendingToggle(null)
    } catch {
      toast.error(TOGGLE_ERROR_MESSAGE)
    }
  }

  const today = new Date()
  const decoratedItems = (recurringTransactionsQuery.data ?? []).map((item) => {
    const account = accountsById[item.account_id]
    const destinationAccount = item.destination_account_id ? accountsById[item.destination_account_id] : null
    const category = item.category_id ? categoriesById[item.category_id] : null

    return {
      ...item,
      accountName: account?.name ?? 'Unknown account',
      accountInactive: account ? !account.is_active : false,
      destinationAccountName: destinationAccount?.name ?? null,
      categoryName: category?.name ?? null,
      categoryInactive: item.category_id ? (category ? !category.is_active : true) : false,
      monthlyEquivalent: calculateMonthlyEquivalent(item.amount, item.frequency),
      annualEquivalent: calculateAnnualEquivalent(item.amount, item.frequency),
      daysUntilOccurrence: calculateDaysUntilOccurrence(item.next_occurrence_date, today),
      status: getRecurringTransactionStatus(item, today),
    }
  })

  const filteredItems = decoratedItems.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    if (frequencyFilter !== 'all' && item.frequency !== frequencyFilter) return false
    return true
  })

  const sortedItems = sortRecurringTransactions(filteredItems)
  const upcomingItems = sortRecurringTransactions(
    decoratedItems.filter((item) => item.is_active && item.status !== 'ended'),
  ).slice(0, UPCOMING_PREVIEW_SIZE)

  return {
    recurringTransactions: sortedItems,
    allRecurringTransactions: decoratedItems,
    upcomingRecurringTransactions: upcomingItems,
    summary: summarizeRecurringTransactions(decoratedItems),
    isLoading: recurringTransactionsQuery.isLoading || accountsQuery.isLoading || categoriesQuery.isLoading,
    isError: recurringTransactionsQuery.isError || accountsQuery.isError || categoriesQuery.isError,
    refetch: () => {
      recurringTransactionsQuery.refetch()
      accountsQuery.refetch()
      categoriesQuery.refetch()
    },

    typeFilter,
    setTypeFilter,
    frequencyFilter,
    setFrequencyFilter,
    showInactive,
    setShowInactive,

    pendingToggle,
    requestToggleActive,
    cancelToggleActive,
    confirmToggleActive,
    togglingActive: deactivateMutation.isPending || activateMutation.isPending,
  }
}

export default useActionRecurringTransaction
