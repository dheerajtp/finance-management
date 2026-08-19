import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import useActionAuth from './useActionAuth'
import useActionDashboardPlanning from './useActionDashboardPlanning'
import { useFinancialHealthData } from '../api/useFinancialHealthApi'
import { useDashboardCommitmentsData } from '../api/useDashboardApi'
import { useCategoriesQuery } from '../api/useCategoryApi'
import { useBudgetsQuery } from '../api/useBudgetApi'
import {
  useSpendingPlanSettingsQuery,
  useCreateSpendingPlanSettingsMutation,
  useUpdateSpendingPlanSettingsMutation,
} from '../api/useSpendingPlanApi'
import { allocationSchema } from '../../validations/spendingPlan/spendingPlan.validation'
import { groupTransactionsByCurrency } from '../../utils/finance/transactionSummary'
import { getCurrentMonthRange } from '../../utils/finance/dateRange'
import { summarizeSafeToSpend, calculateAccountInflowThisMonth, calculateAllocationTotalPercentage } from '../../utils/finance/safeToSpend'
import { FLEXIBLE_CATEGORY_KEYS, DEFAULT_ALLOCATION_PERCENTAGES, getFlexibleGroupForCategory } from '../../constants/flexibleSpending'

const CHECK_VIOLATION = '23514'

const toFriendlyMessage = (error) => {
  if (error?.code === CHECK_VIOLATION) return 'Your allocations exceed 100%. Please adjust them.'
  return 'Could not save your allocation settings. Please try again.'
}

// Row -> form-field shape (settings.food_percentage -> food_percentage,
// already matching), with DEFAULT_ALLOCATION_PERCENTAGES filling in when no
// row exists yet (mirrors emergency_fund_settings' own
// target_months/DEFAULT_EMERGENCY_FUND_TARGET_MONTHS fallback pattern).
const valuesFromSettings = (settings) =>
  Object.fromEntries(FLEXIBLE_CATEGORY_KEYS.map((key) => [`${key}_percentage`, settings?.[`${key}_percentage`] ?? DEFAULT_ALLOCATION_PERCENTAGES[key]]))

// "After income, essential expenses, and configured financial commitments,
// what's left for flexible spending?" — owns current-month calculation,
// allocation editing/validation, spending mapping, and over-commitment
// detection, but reuses every underlying number from the feature that
// already owns it (see safeToSpend.js and the composed hooks below). Never
// imports Supabase, never creates a transaction or touches another
// feature's data.
const useActionSpendingPlan = () => {
  const { currentUser, profile } = useActionAuth()
  const currency = profile?.currency ?? null

  // Emergency Fund/Goals status — same TanStack cache entries the dashboard
  // itself uses (see useActionDashboardPlanning's own comment), not a
  // duplicate query.
  const planning = useActionDashboardPlanning()
  // Current-month all-types transactions, EF settings, investment plans/
  // contributions — same composition Financial Health already uses.
  const health = useFinancialHealthData(currentUser?.id)
  // Active subscriptions + active recurring transactions — same query the
  // dashboard's "Upcoming" widget and notification sync already use.
  const commitmentsData = useDashboardCommitmentsData()
  const categoriesQuery = useCategoriesQuery({})
  const budgetsQuery = useBudgetsQuery({ isActive: true })

  const settingsQuery = useSpendingPlanSettingsQuery(currentUser?.id)
  const createMutation = useCreateSpendingPlanSettingsMutation()
  const updateMutation = useUpdateSpendingPlanSettingsMutation()

  const settings = settingsQuery.data ?? null

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(allocationSchema), defaultValues: valuesFromSettings(null) })

  useEffect(() => {
    reset(valuesFromSettings(settings))
  }, [settings, reset])

  const watchedTotalPercentage = calculateAllocationTotalPercentage(watch())

  const [showAllocationForm, setShowAllocationForm] = useState(false)

  const accountsById = useMemo(
    () => Object.fromEntries(health.accounts.map((account) => [account.id, account])),
    [health.accounts],
  )
  const categoriesById = useMemo(
    () => Object.fromEntries((categoriesQuery.data ?? []).map((category) => [category.id, category])),
    [categoriesQuery.data],
  )

  const monthRange = getCurrentMonthRange()
  const currentMonthByCurrency = groupTransactionsByCurrency(health.currentMonthTransactions, accountsById)

  const efAccountId = health.emergencyFundSettings?.emergency_account_id ?? null
  const efActualContribution = calculateAccountInflowThisMonth(health.currentMonthTransactions, efAccountId)

  const hasOtherCurrencyActivity =
    currentMonthByCurrency.size > 1 ||
    health.investmentPlans.some((plan) => plan.currency !== currency) ||
    commitmentsData.subscriptions.some((subscription) => subscription.currency !== currency) ||
    commitmentsData.recurringTransactions.some((item) => item.currency !== currency) ||
    planning.goals.all.some((goal) => goal.currency !== currency)

  const allocationPercentages = valuesFromSettings(settings)

  const summary = useMemo(
    () =>
      summarizeSafeToSpend({
        currentMonthTransactions: currency ? currentMonthByCurrency.get(currency) ?? [] : [],
        categoriesById,
        emergencyFund: planning.emergencyFund,
        emergencyFundPlanned: Number(health.emergencyFundSettings?.monthly_contribution) || 0,
        emergencyFundActual: efActualContribution,
        investmentPlans: health.investmentPlans,
        investmentContributions: health.investmentContributions,
        decoratedGoals: planning.goals.all,
        subscriptions: commitmentsData.subscriptions,
        recurringTransactions: commitmentsData.recurringTransactions,
        monthRange,
        allocationPercentages,
        currentDate: new Date(),
        currency,
        hasOtherCurrencyActivity,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentMonthByCurrency,
      categoriesById,
      planning.emergencyFund,
      health.emergencyFundSettings,
      efActualContribution,
      health.investmentPlans,
      health.investmentContributions,
      planning.goals.all,
      commitmentsData.subscriptions,
      commitmentsData.recurringTransactions,
      monthRange,
      allocationPercentages,
      currency,
      hasOtherCurrencyActivity,
    ],
  )

  // Existing budgets, summed into whichever flexible bucket their category
  // maps to (a category can only have one budget, but several categories
  // can share a bucket) — shown alongside the flexible allocation for the
  // same bucket, never overriding either system (see FlexibleAllocation).
  // Only same-currency budgets are comparable to the flexible allocation
  // figure for that currency.
  const budgetTotalByFlexibleGroup = useMemo(() => {
    const totals = new Map()
    ;(budgetsQuery.data ?? [])
      .filter((budget) => budget.currency === currency)
      .forEach((budget) => {
        const group = getFlexibleGroupForCategory(categoriesById[budget.category_id])
        totals.set(group, (totals.get(group) ?? 0) + (Number(budget.amount) || 0))
      })
    return totals
  }, [budgetsQuery.data, categoriesById, currency])

  const openAllocationForm = () => setShowAllocationForm(true)
  const closeAllocationForm = () => setShowAllocationForm(false)

  const onSubmit = async (values) => {
    try {
      if (settings) {
        await updateMutation.mutateAsync(values)
      } else {
        await createMutation.mutateAsync(values)
      }
      toast.success('Allocation saved')
      setShowAllocationForm(false)
    } catch (error) {
      toast.error(toFriendlyMessage(error))
    }
  }

  return {
    isLoading: planning.isLoading || health.isLoading || commitmentsData.isLoading || categoriesQuery.isLoading || settingsQuery.isLoading,
    isError: health.isError || commitmentsData.isError,
    refetch: () => {
      health.refetch()
      commitmentsData.refetch()
      settingsQuery.refetch()
    },

    currency,
    monthLabel: format(new Date(), 'MMMM yyyy'),
    ...summary,
    budgetTotalByFlexibleGroup,

    showAllocationForm,
    openAllocationForm,
    closeAllocationForm,
    register,
    errors,
    watchedTotalPercentage,
    onSubmit: handleSubmit(onSubmit),
    saving: createMutation.isPending || updateMutation.isPending,
  }
}

export default useActionSpendingPlan
