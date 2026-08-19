import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { format, differenceInCalendarDays, parseISO } from 'date-fns'
import {
  useInvestmentPlansQuery,
  useCreateInvestmentPlanMutation,
  useUpdateInvestmentPlanMutation,
  usePauseInvestmentPlanMutation,
  useResumeInvestmentPlanMutation,
  useEndInvestmentPlanMutation,
} from '../api/useInvestmentPlanApi'
import { useInvestmentContributionsQuery } from '../api/useInvestmentContributionApi'
import { investmentPlanSchema } from '../../validations/investments/investmentPlan.validation'
import { calculateExpectedContributionDate, calculateContributionStatus } from '../../utils/finance/investments'
import { DEFAULT_CURRENCY } from '../../constants/currencies'

const CHECK_VIOLATION = '23514'

// Messages validate_investment_plan() (0017 migration) is known to raise — safe to show verbatim.
const KNOWN_MESSAGES = ['Investment holding not found', 'Plan currency must match the investment holding currency']

const toFriendlyMessage = (error) => {
  if (KNOWN_MESSAGES.some((message) => error?.message?.includes(message))) return error.message
  if (error?.code === CHECK_VIOLATION) return 'Please check the values you entered.'
  return 'Unable to save SIP. Please try again.'
}

const buildEmptyValues = (holding) => ({
  name: holding ? `${holding.name} SIP` : '',
  amount: '',
  currency: holding?.currency ?? DEFAULT_CURRENCY,
  frequency: 'monthly',
  contribution_day: '',
  start_date: format(new Date(), 'yyyy-MM-dd'),
  end_date: '',
})

// Owns every SIP/plan concern: the full decorated plan list (for the
// Investments page's "Active SIPs"/"Upcoming contributions" sections) and,
// when a `holding` is supplied, the add/edit form + pause/resume/end
// actions scoped to that holding — mirrors Task 17's
// useActionGoalTransactionAllocation(goal) shape.
const useActionInvestmentPlan = (holding) => {
  const plansQuery = useInvestmentPlansQuery({})
  const contributionsQuery = useInvestmentContributionsQuery({})

  const createMutation = useCreateInvestmentPlanMutation()
  const updateMutation = useUpdateInvestmentPlanMutation()
  const pauseMutation = usePauseInvestmentPlanMutation()
  const resumeMutation = useResumeInvestmentPlanMutation()
  const endMutation = useEndInvestmentPlanMutation()

  const [editingPlan, setEditingPlan] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(investmentPlanSchema), defaultValues: buildEmptyValues(holding) })

  const watchedFrequency = watch('frequency')

  const today = new Date()
  const decoratedPlans = (plansQuery.data ?? []).map((plan) => {
    const planContributions = (contributionsQuery.data ?? []).filter((contribution) => contribution.plan_id === plan.id)
    const expectedDate = calculateExpectedContributionDate(plan, today)
    return {
      ...plan,
      expectedDate,
      status: calculateContributionStatus(plan, planContributions, today),
      daysUntil: differenceInCalendarDays(parseISO(expectedDate), today),
    }
  })

  const holdingPlans = holding ? decoratedPlans.filter((plan) => plan.holding_id === holding.id) : []

  const openCreateForm = () => {
    setEditingPlan(null)
    reset(buildEmptyValues(holding))
    setIsFormOpen(true)
  }

  const openEditForm = (plan) => {
    setEditingPlan(plan)
    reset({
      name: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      frequency: plan.frequency,
      contribution_day: plan.contribution_day ?? '',
      start_date: plan.start_date,
      end_date: plan.end_date ?? '',
    })
    setIsFormOpen(true)
  }

  const closeForm = () => setIsFormOpen(false)

  const onSubmit = async (values) => {
    const payload = {
      holding_id: holding?.id,
      name: values.name,
      amount: values.amount,
      currency: values.currency,
      frequency: values.frequency,
      contribution_day: values.contribution_day ? Number(values.contribution_day) : null,
      start_date: values.start_date,
      end_date: values.end_date || null,
    }

    try {
      if (editingPlan) {
        await updateMutation.mutateAsync({ id: editingPlan.id, data: payload })
        toast.success('SIP updated')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('SIP added')
      }
      setIsFormOpen(false)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const pausePlan = async (plan) => {
    try {
      await pauseMutation.mutateAsync(plan.id)
      toast.success('SIP paused')
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const resumePlan = async (plan) => {
    try {
      await resumeMutation.mutateAsync(plan.id)
      toast.success('SIP resumed')
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  const endPlan = async (plan) => {
    try {
      await endMutation.mutateAsync(plan.id)
      toast.success('SIP ended')
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  return {
    plans: decoratedPlans,
    holdingPlans,
    isLoading: plansQuery.isLoading || contributionsQuery.isLoading,
    isError: plansQuery.isError || contributionsQuery.isError,
    refetch: () => {
      plansQuery.refetch()
      contributionsQuery.refetch()
    },

    isFormOpen,
    isEditing: Boolean(editingPlan),
    openCreateForm,
    openEditForm,
    closeForm,
    register,
    errors,
    watchedFrequency,
    onSubmit: handleSubmit(onSubmit),
    saving: createMutation.isPending || updateMutation.isPending,

    pausePlan,
    resumePlan,
    endPlan,
    updatingStatus: pauseMutation.isPending || resumeMutation.isPending || endMutation.isPending,
  }
}

export default useActionInvestmentPlan
