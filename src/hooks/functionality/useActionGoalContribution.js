import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useGoalQuery } from '../api/useGoalApi'
import {
  useGoalContributionsQuery,
  useCreateGoalContributionMutation,
  useUpdateGoalContributionMutation,
  useDeleteGoalContributionMutation,
} from '../api/useGoalContributionApi'
import { useGoalAllocationTotalQuery } from '../api/useGoalTransactionAllocationApi'
import { goalContributionSchema } from '../../validations/goals/goalContribution.validation'
import { calculateGoalMetrics, getGoalInsightMessage } from '../../utils/finance/goals'
import { formatCurrency } from '../../utils/finance/currency'

const CHECK_VIOLATION = '23514'

// Messages validate_goal_contribution() (0010 migration) is known to raise — safe to show verbatim.
const KNOWN_MESSAGES = ['Goal not found', 'Cannot add a contribution to an inactive goal']

const toFriendlyMessage = (error) => {
  if (KNOWN_MESSAGES.some((message) => error?.message?.includes(message))) return error.message
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Could not save the contribution. Please try again.'
}

const emptyValues = {
  amount: '',
  contribution_date: format(new Date(), 'yyyy-MM-dd'),
  description: '',
}

const useActionGoalContribution = (goalId) => {
  const location = useLocation()

  const goalQuery = useGoalQuery(goalId)
  const contributionsQuery = useGoalContributionsQuery(goalId)
  // 0013's goal_transaction_allocations is a separate table that never
  // writes to goals.current_amount (see useActionGoal) — layered in here
  // too so this page's "current contributed" always matches the list page.
  const allocationTotalQuery = useGoalAllocationTotalQuery(goalId)

  const createMutation = useCreateGoalContributionMutation()
  const updateMutation = useUpdateGoalContributionMutation()
  const deleteMutation = useDeleteGoalContributionMutation()

  const [editingContribution, setEditingContribution] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(goalContributionSchema), defaultValues: emptyValues })

  const openAddForm = () => {
    setEditingContribution(null)
    reset(emptyValues)
    setIsFormOpen(true)
  }

  const openEditForm = (contribution) => {
    setEditingContribution(contribution)
    reset({
      amount: contribution.amount,
      contribution_date: contribution.contribution_date,
      description: contribution.description ?? '',
    })
    setIsFormOpen(true)
  }

  const closeForm = () => setIsFormOpen(false)

  // GoalCard's "Add contribution" button navigates here with this flag set,
  // so the modal opens immediately instead of requiring a second click.
  useEffect(() => {
    if (location.state?.openAdd) openAddForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  const onSubmit = async (values) => {
    const payload = {
      amount: values.amount,
      contribution_date: values.contribution_date,
      description: values.description || null,
    }

    try {
      if (editingContribution) {
        await updateMutation.mutateAsync({ id: editingContribution.id, data: payload })
        toast.success('Contribution updated')
      } else {
        await createMutation.mutateAsync({ ...payload, goal_id: goalId })
        toast.success('Contribution added')
      }
      setIsFormOpen(false)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const requestDelete = (contribution) => setPendingDelete(contribution)
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

  const today = new Date()
  const rawGoal = goalQuery.data
  const allocationTotal = allocationTotalQuery.data ?? 0
  const combinedGoal = rawGoal && { ...rawGoal, current_amount: (Number(rawGoal.current_amount) || 0) + allocationTotal }
  const metrics = combinedGoal ? calculateGoalMetrics(combinedGoal, today) : null
  const goal = combinedGoal && {
    ...combinedGoal,
    ...metrics,
    insightMessage: getGoalInsightMessage(metrics.status, metrics.remaining, combinedGoal.currency, formatCurrency),
  }

  const contributions = contributionsQuery.data ?? []

  return {
    goal,
    goalLoading: goalQuery.isLoading || allocationTotalQuery.isLoading,
    goalError: goalQuery.isError || allocationTotalQuery.isError,
    refetchGoal: () => {
      goalQuery.refetch()
      allocationTotalQuery.refetch()
    },

    contributions,
    contributionsLoading: contributionsQuery.isLoading,
    contributionsError: contributionsQuery.isError,
    refetchContributions: contributionsQuery.refetch,

    isFormOpen,
    isEditing: Boolean(editingContribution),
    openAddForm,
    openEditForm,
    closeForm,
    register,
    errors,
    onSubmit: handleSubmit(onSubmit),
    saving: createMutation.isPending || updateMutation.isPending,

    pendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleting: deleteMutation.isPending,
  }
}

export default useActionGoalContribution
