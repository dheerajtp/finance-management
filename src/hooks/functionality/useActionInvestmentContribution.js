import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import {
  useInvestmentContributionsQuery,
  useCreateInvestmentContributionMutation,
  useUpdateInvestmentContributionMutation,
  useDeleteInvestmentContributionMutation,
} from '../api/useInvestmentContributionApi'
import { useInvestmentPlansQuery } from '../api/useInvestmentPlanApi'
import { useInvestmentHoldingsQuery } from '../api/useInvestmentHoldingApi'
import { investmentContributionSchema } from '../../validations/investments/investmentContribution.validation'
import { DEFAULT_CURRENCY } from '../../constants/currencies'

const CHECK_VIOLATION = '23514'

// Messages validate_investment_contribution() (0018 migration) is known to raise — safe to show verbatim.
const KNOWN_MESSAGES = [
  'Investment holding not found',
  'Contribution currency must match the investment holding currency',
  'Investment plan not found',
  'Investment plan does not belong to this holding',
]

const toFriendlyMessage = (error) => {
  if (KNOWN_MESSAGES.some((message) => error?.message?.includes(message))) return error.message
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Unable to save contribution. Please try again.'
}

const buildEmptyValues = () => ({
  plan_id: '',
  amount: '',
  contribution_date: format(new Date(), 'yyyy-MM-dd'),
  status: 'completed',
  notes: '',
})

// Owns recording/editing/deleting investment contributions for one holding
// — mirrors Task 17's useActionGoalTransactionAllocation(goal) shape.
// Recording a contribution NEVER touches accounts.balance or the holding's
// invested_amount/current_value (see task notes) — those stay
// user-maintained on the holding itself, edited separately.
const useActionInvestmentContribution = (holding) => {
  const contributionsQuery = useInvestmentContributionsQuery(holding ? { holdingId: holding.id } : {})
  const plansQuery = useInvestmentPlansQuery(holding ? { holdingId: holding.id, isActive: true } : { isActive: true })
  // For each row's holding name — same cached query useActionInvestments
  // already runs, not a second fetch (TanStack Query dedupes by key).
  const holdingsQuery = useInvestmentHoldingsQuery({})

  const createMutation = useCreateInvestmentContributionMutation()
  const updateMutation = useUpdateInvestmentContributionMutation()
  const deleteMutation = useDeleteInvestmentContributionMutation()

  const [editingContribution, setEditingContribution] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(investmentContributionSchema), defaultValues: buildEmptyValues() })

  const planOptions = (plansQuery.data ?? []).map((plan) => ({ value: plan.id, label: plan.name }))
  const plansById = Object.fromEntries((plansQuery.data ?? []).map((plan) => [plan.id, plan]))

  // Pre-fills amount from the plan's configured contribution — the user
  // can still adjust it before saving.
  const applyPlan = (planId) => {
    const plan = plansById[planId]
    if (plan) setValue('amount', plan.amount)
  }

  const openAddForm = (plan) => {
    setEditingContribution(null)
    reset({ ...buildEmptyValues(), plan_id: plan?.id ?? '' })
    if (plan) setValue('amount', plan.amount)
    setIsFormOpen(true)
  }

  const openSkipForm = (plan) => {
    setEditingContribution(null)
    reset({ ...buildEmptyValues(), plan_id: plan?.id ?? '', status: 'skipped', amount: plan?.amount ?? '' })
    setIsFormOpen(true)
  }

  const openEditForm = (contribution) => {
    setEditingContribution(contribution)
    reset({
      plan_id: contribution.plan_id ?? '',
      amount: contribution.amount,
      contribution_date: contribution.contribution_date,
      status: contribution.status,
      notes: contribution.notes ?? '',
    })
    setIsFormOpen(true)
  }

  const closeForm = () => setIsFormOpen(false)

  const onSubmit = async (values) => {
    const payload = {
      holding_id: holding?.id,
      plan_id: values.plan_id || null,
      amount: values.amount,
      currency: holding?.currency ?? DEFAULT_CURRENCY,
      contribution_date: values.contribution_date,
      status: values.status,
      notes: values.notes || null,
    }

    try {
      if (editingContribution) {
        await updateMutation.mutateAsync({
          id: editingContribution.id,
          data: { amount: values.amount, notes: values.notes || null, status: values.status },
        })
        toast.success('Contribution updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success(values.status === 'skipped' ? 'Marked as skipped' : 'Contribution recorded')
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

  const holdingsById = Object.fromEntries((holdingsQuery.data ?? []).map((item) => [item.id, item]))

  const contributions = (contributionsQuery.data ?? []).map((contribution) => ({
    ...contribution,
    planName: contribution.plan_id ? (plansById[contribution.plan_id]?.name ?? 'Unknown plan') : null,
    holdingName: holding?.name ?? holdingsById[contribution.holding_id]?.name ?? 'Unknown investment',
  }))

  return {
    contributions,
    isLoading: contributionsQuery.isLoading || plansQuery.isLoading || holdingsQuery.isLoading,
    isError: contributionsQuery.isError || plansQuery.isError,
    refetch: () => {
      contributionsQuery.refetch()
      plansQuery.refetch()
    },

    isFormOpen,
    isEditing: Boolean(editingContribution),
    openAddForm,
    openSkipForm,
    openEditForm,
    closeForm,
    register,
    errors,
    planOptions,
    applyPlan,
    onSubmit: handleSubmit(onSubmit),
    saving: createMutation.isPending || updateMutation.isPending,

    pendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleting: deleteMutation.isPending,
  }
}

export default useActionInvestmentContribution
