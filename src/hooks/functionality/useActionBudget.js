import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import useActionAuth from './useActionAuth'
import { useAccountsQuery } from '../api/useAccountApi'
import { useCategoriesQuery } from '../api/useCategoryApi'
import { useTransactionsQuery } from '../api/useTransactionApi'
import {
  useBudgetsQuery,
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
  useDeactivateBudgetMutation,
  useActivateBudgetMutation,
} from '../api/useBudgetApi'
import { budgetSchema } from '../../validations/budgets/budget.validation'
import { getCurrentMonthRange, getLastNMonthsRange } from '../../utils/finance/dateRange'
import { groupTransactionsByCurrency } from '../../utils/finance/transactionSummary'
import {
  calculateBudgetSpent,
  calculateBudgetRemaining,
  calculateBudgetProgress,
  getBudgetStatus,
  getBudgetMessage,
  calculateBudgetSummary,
  calculateCategoryAverage,
  sortBudgets,
} from '../../utils/finance/budgets'
import { formatCurrency } from '../../utils/finance/currency'
import { DEFAULT_CURRENCY } from '../../constants/currencies'

const HISTORY_MONTHS = 3
const UNIQUE_VIOLATION = '23505'
const CHECK_VIOLATION = '23514'
const KNOWN_MESSAGES = [
  'Category not found',
  'Budgets can only be created for expense categories',
  'Cannot create a budget for an inactive category',
]

const toFriendlyMessage = (error) => {
  if (KNOWN_MESSAGES.some((message) => error?.message?.includes(message))) return error.message
  if (error?.code === UNIQUE_VIOLATION) return 'You already have an active budget for this category and currency.'
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Could not save the budget. Please try again.'
}

const useActionBudget = () => {
  const { profile } = useActionAuth()

  const [statusFilter, setStatusFilter] = useState('all')
  const [classificationFilter, setClassificationFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(false)

  const budgetsQuery = useBudgetsQuery(showInactive ? {} : { isActive: true })
  const accountsQuery = useAccountsQuery()
  const categoriesQuery = useCategoriesQuery({})

  // Covers the current month + HISTORY_MONTHS completed months in one fetch
  // — both "spent this month" and "recent average" are derived from it.
  const range = getLastNMonthsRange(HISTORY_MONTHS + 1)
  const transactionsQuery = useTransactionsQuery({ type: 'expense', fromDate: range.start, toDate: range.end })

  const createMutation = useCreateBudgetMutation()
  const updateMutation = useUpdateBudgetMutation()
  const deactivateMutation = useDeactivateBudgetMutation()
  const activateMutation = useActivateBudgetMutation()

  const [editingBudget, setEditingBudget] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingToggle, setPendingToggle] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: { category_id: '', amount: '', currency: DEFAULT_CURRENCY },
  })

  const watchedCategoryId = watch('category_id')
  const watchedCurrency = watch('currency')

  const categories = categoriesQuery.data ?? []
  const transactions = transactionsQuery.data ?? []

  const accountsById = useMemo(
    () => Object.fromEntries((accountsQuery.data ?? []).map((account) => [account.id, account])),
    [accountsQuery.data],
  )
  const categoriesById = useMemo(
    () => Object.fromEntries((categoriesQuery.data ?? []).map((category) => [category.id, category])),
    [categoriesQuery.data],
  )

  const currentMonthRange = getCurrentMonthRange()
  const currentMonthTransactions = transactions.filter(
    (transaction) =>
      transaction.transaction_date >= currentMonthRange.start && transaction.transaction_date <= currentMonthRange.end,
  )

  const categoryOptions = categories
    .filter((category) => category.type === 'expense' && category.is_active)
    .map((category) => ({ value: category.id, label: category.name }))

  const suggestion =
    watchedCategoryId && watchedCurrency
      ? calculateCategoryAverage(transactions, watchedCategoryId, watchedCurrency, accountsById, HISTORY_MONTHS)
      : null

  const openCreateForm = () => {
    setEditingBudget(null)
    reset({ category_id: '', amount: '', currency: profile?.currency ?? DEFAULT_CURRENCY })
    setIsFormOpen(true)
  }

  const openEditForm = (budget) => {
    setEditingBudget(budget)
    reset({ category_id: budget.category_id, amount: budget.amount, currency: budget.currency })
    setIsFormOpen(true)
  }

  const closeForm = () => setIsFormOpen(false)

  // Populates the amount field only on click — never saved automatically.
  const useSuggestion = () => {
    if (suggestion?.average !== null && suggestion?.average !== undefined) {
      setValue('amount', Math.round(suggestion.average))
    }
  }

  const onSubmit = async (values) => {
    try {
      if (editingBudget) {
        await updateMutation.mutateAsync({ id: editingBudget.id, data: values })
        toast.success('Budget updated')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Budget added')
      }
      setIsFormOpen(false)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const requestToggleActive = (budget) => setPendingToggle(budget)
  const cancelToggleActive = () => setPendingToggle(null)

  const confirmToggleActive = async () => {
    if (!pendingToggle) return
    try {
      if (pendingToggle.is_active) {
        await deactivateMutation.mutateAsync(pendingToggle.id)
        toast.success('Budget deactivated')
      } else {
        await activateMutation.mutateAsync(pendingToggle.id)
        toast.success('Budget activated')
      }
      setPendingToggle(null)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const decoratedBudgets = (budgetsQuery.data ?? []).map((budget) => {
    const category = categoriesById[budget.category_id]
    const spent = calculateBudgetSpent(currentMonthTransactions, budget, accountsById)
    const { remaining, overBy } = calculateBudgetRemaining(budget.amount, spent)
    const status = getBudgetStatus(budget.amount, spent)

    return {
      ...budget,
      categoryName: category?.name ?? 'Unknown category',
      categoryIsEssential: category?.is_essential ?? null,
      categoryInactive: category ? !category.is_active : true,
      spent,
      remaining,
      overBy,
      progress: calculateBudgetProgress(budget.amount, spent),
      status,
      message: getBudgetMessage(status, budget.amount, spent, budget.currency, formatCurrency),
      historicalAverage: calculateCategoryAverage(transactions, budget.category_id, budget.currency, accountsById, HISTORY_MONTHS),
    }
  })

  const filteredBudgets = decoratedBudgets.filter((budget) => {
    if (statusFilter !== 'all' && budget.status !== statusFilter) return false
    if (classificationFilter === 'essential' && budget.categoryIsEssential !== true) return false
    if (classificationFilter === 'discretionary' && budget.categoryIsEssential !== false) return false
    return true
  })

  const uncategorizedTransactions = currentMonthTransactions.filter((transaction) => !transaction.category_id)
  const uncategorizedByCurrency = groupTransactionsByCurrency(uncategorizedTransactions, accountsById)
  const uncategorizedSummary = Array.from(uncategorizedByCurrency.entries()).map(([currency, txns]) => ({
    currency,
    amount: txns.reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0),
  }))

  const isLoading =
    budgetsQuery.isLoading || accountsQuery.isLoading || categoriesQuery.isLoading || transactionsQuery.isLoading
  const isError = budgetsQuery.isError || accountsQuery.isError || categoriesQuery.isError || transactionsQuery.isError

  return {
    budgets: sortBudgets(filteredBudgets),
    allBudgets: decoratedBudgets,
    summary: calculateBudgetSummary(decoratedBudgets),
    uncategorizedSummary,
    isLoading,
    isError,
    refetch: () => {
      budgetsQuery.refetch()
      accountsQuery.refetch()
      categoriesQuery.refetch()
      transactionsQuery.refetch()
    },

    statusFilter,
    setStatusFilter,
    classificationFilter,
    setClassificationFilter,
    showInactive,
    setShowInactive,

    isFormOpen,
    isEditing: Boolean(editingBudget),
    openCreateForm,
    openEditForm,
    closeForm,
    register,
    errors,
    onSubmit: handleSubmit(onSubmit),
    saving: createMutation.isPending || updateMutation.isPending,
    categoryOptions,
    suggestion,
    suggestionCurrency: watchedCurrency,
    useSuggestion,

    pendingToggle,
    requestToggleActive,
    cancelToggleActive,
    confirmToggleActive,
    togglingActive: deactivateMutation.isPending || activateMutation.isPending,
  }
}

export default useActionBudget
