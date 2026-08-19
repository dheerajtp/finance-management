import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  useGoalsQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useDeactivateGoalMutation,
  useActivateGoalMutation,
} from '../api/useGoalApi'
import { useGoalTransactionAllocationsQuery } from '../api/useGoalTransactionAllocationApi'
import { goalSchema } from '../../validations/goals/goal.validation'
import { calculateGoalMetrics, getGoalInsightMessage, sortGoals, summarizeGoals } from '../../utils/finance/goals'
import { calculateGoalContributionTotal } from '../../utils/finance/goalContributions'
import { formatCurrency } from '../../utils/finance/currency'
import { DEFAULT_GOAL_PRIORITY } from '../../constants/goalPriority'
import { DEFAULT_CURRENCY } from '../../constants/currencies'

const CHECK_VIOLATION = '23514'

const toFriendlyMessage = (error) => {
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Could not save the goal. Please try again.'
}

const emptyValues = {
  name: '',
  type: 'other',
  description: '',
  target_amount: '',
  currency: DEFAULT_CURRENCY,
  target_date: '',
  priority: DEFAULT_GOAL_PRIORITY,
}

const useActionGoal = () => {
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(false)

  const goalsQuery = useGoalsQuery(showInactive ? {} : { isActive: true })
  // Unfiltered — one cheap query for every allocation the user has, grouped
  // by goal below. goal_transaction_allocations (0013) is a separate table
  // from goal_contributions and never writes to goals.current_amount, so
  // this is the only way the list picks up transaction-linked contributions
  // alongside the DB-derived manual-contribution total.
  const allocationsQuery = useGoalTransactionAllocationsQuery({})

  const createMutation = useCreateGoalMutation()
  const updateMutation = useUpdateGoalMutation()
  const deactivateMutation = useDeactivateGoalMutation()
  const activateMutation = useActivateGoalMutation()

  const [editingGoal, setEditingGoal] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingToggle, setPendingToggle] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(goalSchema), defaultValues: emptyValues })

  const openCreateForm = () => {
    setEditingGoal(null)
    reset(emptyValues)
    setIsFormOpen(true)
  }

  const openEditForm = (goal) => {
    setEditingGoal(goal)
    reset({
      name: goal.name,
      type: goal.type,
      description: goal.description ?? '',
      target_amount: goal.target_amount,
      currency: goal.currency,
      target_date: goal.target_date ?? '',
      priority: goal.priority,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => setIsFormOpen(false)

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      type: values.type,
      description: values.description || null,
      target_amount: values.target_amount,
      currency: values.currency,
      target_date: values.target_date || null,
      priority: values.priority,
    }

    try {
      if (editingGoal) {
        await updateMutation.mutateAsync({ id: editingGoal.id, data: payload })
        toast.success('Goal updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Goal added')
      }
      setIsFormOpen(false)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const requestToggleActive = (goal) => setPendingToggle(goal)
  const cancelToggleActive = () => setPendingToggle(null)

  const confirmToggleActive = async () => {
    if (!pendingToggle) return
    try {
      if (pendingToggle.is_active) {
        await deactivateMutation.mutateAsync(pendingToggle.id)
        toast.success('Goal deactivated')
      } else {
        await activateMutation.mutateAsync(pendingToggle.id)
        toast.success('Goal activated')
      }
      setPendingToggle(null)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const allocationTotalsByGoal = useMemo(() => {
    const byGoal = new Map()
    ;(allocationsQuery.data ?? []).forEach((allocation) => {
      byGoal.set(allocation.goal_id, [...(byGoal.get(allocation.goal_id) ?? []), allocation])
    })
    return byGoal
  }, [allocationsQuery.data])

  const today = new Date()
  const decoratedGoals = (goalsQuery.data ?? []).map((goal) => {
    // goal.current_amount is already the DB-derived sum of goal_contributions
    // (0010's sync trigger) — layer transaction-linked allocations on top so
    // every downstream calculation sees one combined "current amount".
    const allocationTotal = calculateGoalContributionTotal(allocationTotalsByGoal.get(goal.id))
    const combinedGoal = { ...goal, current_amount: (Number(goal.current_amount) || 0) + allocationTotal }
    const metrics = calculateGoalMetrics(combinedGoal, today)
    return {
      ...combinedGoal,
      ...metrics,
      insightMessage: getGoalInsightMessage(metrics.status, metrics.remaining, goal.currency, formatCurrency),
    }
  })

  const filteredGoals = decoratedGoals.filter((goal) => {
    if (statusFilter !== 'all' && goal.status !== statusFilter) return false
    if (priorityFilter !== 'all' && goal.priority !== Number(priorityFilter)) return false
    return true
  })

  const goalsById = useMemo(
    () => Object.fromEntries((goalsQuery.data ?? []).map((goal) => [goal.id, goal])),
    [goalsQuery.data],
  )
  // "Recent contributions" only ever reflects transaction-linked allocations
  // (0013) — the already-fetched, already-cheap query above. Task 14's
  // freely-entered contributions are per-goal only (see goalContribution.
  // service.js), so a cross-goal "recent" list for those would need a new
  // query shape; out of scope here, called out in the report.
  const recentContributions = [...(allocationsQuery.data ?? [])]
    .sort((a, b) => b.contribution_date.localeCompare(a.contribution_date))
    .slice(0, 5)
    .map((allocation) => ({ ...allocation, goalName: goalsById[allocation.goal_id]?.name ?? 'Unknown goal' }))

  return {
    goals: sortGoals(filteredGoals),
    summary: summarizeGoals(decoratedGoals),
    recentContributions,
    isLoading: goalsQuery.isLoading || allocationsQuery.isLoading,
    isError: goalsQuery.isError || allocationsQuery.isError,
    refetch: () => {
      goalsQuery.refetch()
      allocationsQuery.refetch()
    },

    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    showInactive,
    setShowInactive,

    isFormOpen,
    isEditing: Boolean(editingGoal),
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

export default useActionGoal
