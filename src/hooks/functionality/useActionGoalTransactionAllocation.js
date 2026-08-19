import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  useGoalTransactionAllocationsQuery,
  useCreateGoalTransactionAllocationMutation,
  useUpdateGoalTransactionAllocationMutation,
  useDeleteGoalTransactionAllocationMutation,
} from '../api/useGoalTransactionAllocationApi'
import { useTransactionsQuery } from '../api/useTransactionApi'
import { useAccountsQuery } from '../api/useAccountApi'
import { goalTransactionAllocationSchema } from '../../validations/goals/goalTransactionAllocation.validation'
import { calculateTransactionUnallocatedAmount, calculateContributionSummary } from '../../utils/finance/goalContributions'
import { getLastNMonthsRange } from '../../utils/finance/dateRange'
import { formatCurrency } from '../../utils/finance/currency'

const CHECK_VIOLATION = '23514'
const HISTORY_MONTHS = 6

// Messages validate_goal_transaction_allocation() (0013 migration) is known
// to raise — safe to show verbatim.
const KNOWN_MESSAGES = [
  'Goal not found',
  'Cannot add a contribution to an inactive goal',
  'Transaction not found',
  'Transfers cannot be allocated to a goal',
  'Contribution currency must match the goal currency',
  'Transaction currency must match the goal currency',
  'Contribution date must match the transaction date',
  'Contribution amount cannot exceed the transaction amount',
  'This transaction does not have enough unallocated amount for this contribution',
]

const toFriendlyMessage = (error) => {
  if (KNOWN_MESSAGES.some((message) => error?.message?.includes(message))) return error.message
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Could not save this contribution. Please try again.'
}

const emptyValues = { transaction_id: '', amount: '', contribution_date: '', note: '' }

// Owns the "allocate part of an existing transaction to this goal" flow —
// a distinct feature from useActionGoalContribution's freely-entered
// contributions (0010/Task 14), which this hook never touches. Takes the
// already-decorated `goal` from useActionGoalContribution so it doesn't
// re-fetch or re-derive the goal itself.
const useActionGoalTransactionAllocation = (goal) => {
  const goalId = goal?.id

  const allocationsQuery = useGoalTransactionAllocationsQuery({ goalId }, { enabled: Boolean(goalId) })
  const accountsQuery = useAccountsQuery()

  const recentRange = getLastNMonthsRange(HISTORY_MONTHS)
  const recentTransactionsQuery = useTransactionsQuery({ fromDate: recentRange.start, toDate: recentRange.end })

  const referencedTransactionIds = useMemo(
    () => Array.from(new Set((allocationsQuery.data ?? []).map((allocation) => allocation.transaction_id))),
    [allocationsQuery.data],
  )
  // Allocations can reference a transaction older than the 6-month
  // selection window — fetched by exact id only (never "every
  // transaction") purely to show its description/type alongside each
  // existing allocation. An empty id list correctly returns zero rows.
  const referencedTransactionsQuery = useTransactionsQuery({ ids: referencedTransactionIds })

  const createMutation = useCreateGoalTransactionAllocationMutation()
  const updateMutation = useUpdateGoalTransactionAllocationMutation()
  const deleteMutation = useDeleteGoalTransactionAllocationMutation()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAllocation, setEditingAllocation] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [overTargetWarning, setOverTargetWarning] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(goalTransactionAllocationSchema), defaultValues: { ...emptyValues, goal_id: goalId } })

  const watchedTransactionId = watch('transaction_id')

  const accountsById = useMemo(
    () => Object.fromEntries((accountsQuery.data ?? []).map((account) => [account.id, account])),
    [accountsQuery.data],
  )
  const transactionsById = useMemo(
    () => Object.fromEntries((referencedTransactionsQuery.data ?? []).map((transaction) => [transaction.id, transaction])),
    [referencedTransactionsQuery.data],
  )

  const allocatedByTransaction = useMemo(() => {
    const totals = new Map()
    ;(allocationsQuery.data ?? []).forEach((allocation) => {
      totals.set(allocation.transaction_id, (totals.get(allocation.transaction_id) ?? 0) + Number(allocation.amount))
    })
    return totals
  }, [allocationsQuery.data])

  // Recommended-only: income and other positive cash-flow (non-transfer)
  // transactions, in the goal's currency, that still have unallocated
  // amount left. Nothing is auto-selected.
  const eligibleTransactions = (recentTransactionsQuery.data ?? [])
    .filter((transaction) => transaction.type !== 'transfer')
    .map((transaction) => {
      const account = accountsById[transaction.account_id]
      const allocated = allocatedByTransaction.get(transaction.id) ?? 0
      return {
        ...transaction,
        currency: account?.currency,
        accountName: account?.name ?? 'Unknown account',
        allocated,
        unallocated: calculateTransactionUnallocatedAmount(transaction.amount, allocated),
      }
    })
    .filter((transaction) => goal && transaction.currency === goal.currency && transaction.unallocated > 0)

  const transactionOptions = eligibleTransactions.map((transaction) => ({
    value: transaction.id,
    label: `${transaction.transaction_date} · ${transaction.description || transaction.type} · available ${formatCurrency(transaction.unallocated, transaction.currency)}`,
  }))

  const selectedTransaction = eligibleTransactions.find((transaction) => transaction.id === watchedTransactionId)

  // Contribution date always follows the selected transaction's date — the
  // DB trigger enforces this regardless, this just keeps the form honest.
  useEffect(() => {
    if (selectedTransaction) setValue('contribution_date', selectedTransaction.transaction_date)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedTransactionId])

  const openAddForm = () => {
    setEditingAllocation(null)
    setOverTargetWarning(false)
    reset({ ...emptyValues, goal_id: goalId })
    setIsFormOpen(true)
  }

  const openEditForm = (allocation) => {
    setEditingAllocation(allocation)
    setOverTargetWarning(false)
    reset({
      goal_id: allocation.goal_id,
      transaction_id: allocation.transaction_id,
      amount: allocation.amount,
      contribution_date: allocation.contribution_date,
      note: allocation.note ?? '',
    })
    setIsFormOpen(true)
  }

  const closeForm = () => setIsFormOpen(false)

  const onSubmit = async (values) => {
    if (!editingAllocation && !values.transaction_id) {
      setError('transaction_id', { message: 'Select a transaction' })
      return
    }

    // Soft-block over-target contributions (never a hard DB rule — see
    // 0013 migration notes): the first submit attempt past the target
    // shows a warning instead of saving; submitting again proceeds.
    if (!editingAllocation && !overTargetWarning) {
      const projected = (Number(goal?.current_amount) || 0) + Number(values.amount)
      if (goal && Number(goal.target_amount) > 0 && projected > Number(goal.target_amount)) {
        setError('amount', {
          message: `This goal's target is ${formatCurrency(goal.target_amount, goal.currency)} — this would go over it. Submit again to contribute anyway.`,
        })
        setOverTargetWarning(true)
        return
      }
    }

    const payload = {
      goal_id: goalId,
      transaction_id: values.transaction_id,
      amount: values.amount,
      currency: goal.currency,
      contribution_date: values.contribution_date,
      note: values.note || null,
    }

    try {
      if (editingAllocation) {
        await updateMutation.mutateAsync({ id: editingAllocation.id, data: { amount: values.amount, note: values.note || null } })
        toast.success('Contribution updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Contribution added')
      }
      setIsFormOpen(false)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const requestDelete = (allocation) => setPendingDelete(allocation)
  const cancelDelete = () => setPendingDelete(null)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success('Contribution deleted')
      setPendingDelete(null)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const decoratedAllocations = (allocationsQuery.data ?? []).map((allocation) => {
    const transaction = transactionsById[allocation.transaction_id]
    return {
      ...allocation,
      transactionDescription: transaction?.description ?? null,
      transactionType: transaction?.type ?? null,
    }
  })

  return {
    allocations: decoratedAllocations,
    allocationsLoading: allocationsQuery.isLoading || accountsQuery.isLoading || referencedTransactionsQuery.isLoading,
    allocationsError: allocationsQuery.isError || accountsQuery.isError || referencedTransactionsQuery.isError,
    summary: calculateContributionSummary(decoratedAllocations, goal?.target_amount, goal?.currency),

    isFormOpen,
    isEditing: Boolean(editingAllocation),
    openAddForm,
    openEditForm,
    closeForm,
    register,
    errors,
    transactionOptions,
    selectedTransaction,
    onSubmit: handleSubmit(onSubmit),
    saving: createMutation.isPending || updateMutation.isPending,

    pendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleting: deleteMutation.isPending,
  }
}

export default useActionGoalTransactionAllocation
