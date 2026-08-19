import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAtomValue } from 'jotai'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import toast from 'react-hot-toast'
import {
  useTransactionsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} from '../api/useTransactionApi'
import { useAccountsQuery } from '../api/useAccountApi'
import { useCategoriesQuery } from '../api/useCategoryApi'
import { transactionSchema } from '../../validations/transactions/transaction.validation'
import { transactionDatePreferenceAtom, confirmDeleteTransactionAtom } from '../../store/preferences.store'

const CHECK_VIOLATION = '23514'
const FOREIGN_KEY_VIOLATION = '23503'

// Messages validate_transaction() (0005 migration) is known to raise — safe to show verbatim.
const KNOWN_MESSAGES = [
  'Account not found',
  'Destination account not found',
  'Category not found',
  'Category type does not match transaction type',
  'Cannot transfer between accounts with different currencies',
  'Destination account must be an investment account',
]

const toFriendlyMessage = (error) => {
  if (KNOWN_MESSAGES.some((message) => error?.message?.includes(message))) return error.message
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  // Also covers deletes blocked by a goal allocation referencing this
  // transaction (goal_transaction_allocations.transaction_id is ON DELETE
  // RESTRICT — see 0013 migration) as well as the account/category case.
  if (error?.code === FOREIGN_KEY_VIOLATION) {
    return 'This transaction is referenced elsewhere (e.g. a goal allocation) and cannot be changed right now.'
  }
  return 'Could not save the transaction. Please try again.'
}

const dateRangeBounds = (rangeKey) => {
  const now = new Date()
  if (rangeKey === 'this_month') {
    return { fromDate: format(startOfMonth(now), 'yyyy-MM-dd'), toDate: format(endOfMonth(now), 'yyyy-MM-dd') }
  }
  if (rangeKey === 'last_month') {
    const lastMonth = subMonths(now, 1)
    return {
      fromDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
      toDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
    }
  }
  return {}
}

const buildEmptyValues = (defaultTransactionDate) => ({
  type: 'expense',
  account_id: '',
  category_id: '',
  destination_account_id: '',
  amount: '',
  description: '',
  transaction_date: defaultTransactionDate === 'manual' ? '' : format(new Date(), 'yyyy-MM-dd'),
})

const useActionTransaction = () => {
  const defaultTransactionDate = useAtomValue(transactionDatePreferenceAtom)
  const confirmBeforeDelete = useAtomValue(confirmDeleteTransactionAtom)
  const emptyValues = useMemo(() => buildEmptyValues(defaultTransactionDate), [defaultTransactionDate])

  const [typeFilter, setTypeFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState('this_month')
  const [search, setSearch] = useState('')

  const queryFilters = {
    ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
    ...(accountFilter !== 'all' ? { accountId: accountFilter } : {}),
    ...(categoryFilter !== 'all' ? { categoryId: categoryFilter } : {}),
    ...dateRangeBounds(dateRangeFilter),
    ...(search.trim() ? { search: search.trim() } : {}),
  }

  const transactionsQuery = useTransactionsQuery(queryFilters)
  const accountsQuery = useAccountsQuery()
  // Unfiltered — feeds the display lookup (incl. archived) and the filter dropdown (filtered client-side below).
  const allCategoriesQuery = useCategoriesQuery({})

  const createMutation = useCreateTransactionMutation()
  const updateMutation = useUpdateTransactionMutation()
  const deleteMutation = useDeleteTransactionMutation()

  const [editingTransaction, setEditingTransaction] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [allocatingTransactionId, setAllocatingTransactionId] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(transactionSchema), defaultValues: emptyValues })

  const watchedType = watch('type')
  const watchedAccountId = watch('account_id')

  // Reuse the filtered category query (matches selected type) instead of
  // fetching everything and hiding options client-side.
  const formCategoriesQuery = useCategoriesQuery({ type: watchedType, isActive: true })

  useEffect(() => {
    setValue('category_id', '')
    setValue('destination_account_id', '')
  }, [watchedType, setValue])

  const accounts = accountsQuery.data ?? []
  const activeAccounts = accounts.filter((account) => account.is_active)
  const allCategories = allCategoriesQuery.data ?? []

  const accountsById = useMemo(
    () => Object.fromEntries((accountsQuery.data ?? []).map((account) => [account.id, account])),
    [accountsQuery.data],
  )
  const categoriesById = useMemo(
    () => Object.fromEntries((allCategoriesQuery.data ?? []).map((category) => [category.id, category])),
    [allCategoriesQuery.data],
  )

  const accountOptions = activeAccounts.map((account) => ({
    value: account.id,
    label: `${account.name} (${account.currency})`,
  }))
  const destinationAccountOptions = accountOptions
    .filter((option) => option.value !== watchedAccountId)
    .filter((option) => watchedType !== 'investment' || accountsById[option.value]?.type === 'investment')
  const formCategoryOptions = (formCategoriesQuery.data ?? []).map((category) => ({
    value: category.id,
    label: category.name,
  }))

  const accountFilterOptions = [
    { value: 'all', label: 'All accounts' },
    ...accounts.map((account) => ({ value: account.id, label: account.name })),
  ]
  const categoryFilterOptions = [
    { value: 'all', label: 'All categories' },
    ...allCategories.filter((category) => category.is_active).map((category) => ({ value: category.id, label: category.name })),
  ]

  const openCreateForm = () => {
    setEditingTransaction(null)
    reset(emptyValues)
    setIsFormOpen(true)
  }

  const openEditForm = (transaction) => {
    setEditingTransaction(transaction)
    reset({
      type: transaction.type,
      account_id: transaction.account_id,
      category_id: transaction.category_id ?? '',
      destination_account_id: transaction.destination_account_id ?? '',
      amount: transaction.amount,
      description: transaction.description ?? '',
      transaction_date: transaction.transaction_date,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => setIsFormOpen(false)

  const onSubmit = async (values) => {
    const isTransferLike = values.type === 'transfer' || values.type === 'investment'

    if (isTransferLike) {
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
      description: values.description || null,
      transaction_date: values.transaction_date,
      category_id: isTransferLike ? null : values.category_id,
      destination_account_id: isTransferLike ? values.destination_account_id : null,
    }

    try {
      if (editingTransaction) {
        await updateMutation.mutateAsync({ id: editingTransaction.id, data: payload })
        toast.success('Transaction updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Transaction added')
      }
      setIsFormOpen(false)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const performDelete = async (transaction) => {
    try {
      await deleteMutation.mutateAsync(transaction.id)
      toast.success('Transaction deleted')
      setPendingDelete(null)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  // "Confirmation before deleting transactions" (Settings > Preferences) —
  // when off, delete immediately instead of opening the confirm modal.
  const requestDelete = (transaction) => (confirmBeforeDelete ? setPendingDelete(transaction) : performDelete(transaction))
  const cancelDelete = () => setPendingDelete(null)
  const confirmDelete = () => pendingDelete && performDelete(pendingDelete)

  // Goal allocation is a fully separate feature (goal_transaction_
  // allocations, 0013) — this hook only tracks which transaction the
  // "Allocate to goal" modal is open for; TransactionAllocationModal owns
  // everything else about that flow.
  const requestAllocate = (transaction) => setAllocatingTransactionId(transaction.id)
  const cancelAllocate = () => setAllocatingTransactionId(null)

  return {
    transactions: transactionsQuery.data ?? [],
    accountsById,
    categoriesById,
    isLoading: transactionsQuery.isLoading || accountsQuery.isLoading,
    isError: transactionsQuery.isError,
    refetch: transactionsQuery.refetch,

    typeFilter,
    setTypeFilter,
    accountFilter,
    setAccountFilter,
    accountFilterOptions,
    categoryFilter,
    setCategoryFilter,
    categoryFilterOptions,
    dateRangeFilter,
    setDateRangeFilter,
    search,
    setSearch,

    isFormOpen,
    isEditing: Boolean(editingTransaction),
    openCreateForm,
    openEditForm,
    closeForm,
    register,
    errors,
    watchedType,
    accountOptions,
    destinationAccountOptions,
    formCategoryOptions,
    onSubmit: handleSubmit(onSubmit),
    saving: createMutation.isPending || updateMutation.isPending,

    pendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleting: deleteMutation.isPending,

    allocatingTransactionId,
    requestAllocate,
    cancelAllocate,
  }
}

export default useActionTransaction
