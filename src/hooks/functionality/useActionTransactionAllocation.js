import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  useGoalTransactionAllocationsQuery,
  useCreateGoalTransactionAllocationMutation,
  useDeleteGoalTransactionAllocationMutation,
} from '../api/useGoalTransactionAllocationApi'
import { useTransactionQuery } from '../api/useTransactionApi'
import { useAccountsQuery } from '../api/useAccountApi'
import { useGoalsQuery } from '../api/useGoalApi'
import { goalTransactionAllocationSchema } from '../../validations/goals/goalTransactionAllocation.validation'
import { calculateTransactionUnallocatedAmount, calculateTransactionAllocatedAmount } from '../../utils/finance/goalContributions'
import { formatCurrency } from '../../utils/finance/currency'

const CHECK_VIOLATION = '23514'

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

const emptyValues = { goal_id: '', amount: '', note: '' }

// The transaction-side counterpart to useActionGoalTransactionAllocation:
// here the TRANSACTION is fixed (opened from a specific row on
// /transactions) and the GOAL is picked. Never creates a second
// transaction and never touches accounts.balance — only ever writes to
// goal_transaction_allocations.
const useActionTransactionAllocation = (transactionId) => {
  const transactionQuery = useTransactionQuery(transactionId)
  const accountsQuery = useAccountsQuery()
  const goalsQuery = useGoalsQuery({})
  const allocationsQuery = useGoalTransactionAllocationsQuery(
    { transactionId },
    { enabled: Boolean(transactionId) },
  )

  const createMutation = useCreateGoalTransactionAllocationMutation()
  const deleteMutation = useDeleteGoalTransactionAllocationMutation()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [overTargetWarning, setOverTargetWarning] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(goalTransactionAllocationSchema), defaultValues: emptyValues })

  const watchedGoalId = watch('goal_id')

  const accountsById = useMemo(
    () => Object.fromEntries((accountsQuery.data ?? []).map((account) => [account.id, account])),
    [accountsQuery.data],
  )
  const goalsById = useMemo(
    () => Object.fromEntries((goalsQuery.data ?? []).map((goal) => [goal.id, goal])),
    [goalsQuery.data],
  )

  const transaction = transactionQuery.data
  const account = transaction ? accountsById[transaction.account_id] : null
  const currency = account?.currency

  const allocated = calculateTransactionAllocatedAmount(allocationsQuery.data)
  const unallocated = calculateTransactionUnallocatedAmount(transaction?.amount, allocated)

  const goalOptions = (goalsQuery.data ?? [])
    .filter((goal) => goal.is_active && goal.currency === currency)
    .map((goal) => ({ value: goal.id, label: goal.name }))

  useEffect(() => {
    if (isFormOpen) reset(emptyValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormOpen])

  useEffect(() => {
    setOverTargetWarning(false)
  }, [watchedGoalId])

  const openForm = () => setIsFormOpen(true)
  const closeForm = () => setIsFormOpen(false)

  const onSubmit = async (values) => {
    if (!values.goal_id) {
      setError('goal_id', { message: 'Select a goal' })
      return
    }

    // Soft-block over-target contributions, same as the goal detail page —
    // approximated from the goal's own current_amount (0010's DB-derived
    // manual-contribution total) since checking every other transaction
    // already allocated to this goal would need an extra query for what's
    // only ever a best-effort warning, never a hard rule.
    if (!overTargetWarning) {
      const goal = goalsById[values.goal_id]
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
      goal_id: values.goal_id,
      transaction_id: transactionId,
      amount: values.amount,
      currency,
      contribution_date: transaction?.transaction_date,
      note: values.note || null,
    }

    try {
      await createMutation.mutateAsync(payload)
      toast.success('Allocated to goal')
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
      toast.success('Allocation removed')
      setPendingDelete(null)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const decoratedAllocations = (allocationsQuery.data ?? []).map((allocation) => ({
    ...allocation,
    goalName: goalsById[allocation.goal_id]?.name ?? 'Unknown goal',
  }))

  return {
    transaction,
    currency,
    allocations: decoratedAllocations,
    allocated,
    unallocated,
    isLoading: transactionQuery.isLoading || accountsQuery.isLoading || goalsQuery.isLoading || allocationsQuery.isLoading,
    isError: transactionQuery.isError || accountsQuery.isError || goalsQuery.isError || allocationsQuery.isError,

    isFormOpen,
    openForm,
    closeForm,
    register,
    errors,
    goalOptions,
    onSubmit: handleSubmit(onSubmit),
    saving: createMutation.isPending,

    pendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleting: deleteMutation.isPending,
  }
}

export default useActionTransactionAllocation
