import { useMemo } from 'react'
import useActionAuth from './useActionAuth'
import { useAccountsQuery } from '../api/useAccountApi'
import { useCategoriesQuery } from '../api/useCategoryApi'
import { useTransactionsQuery } from '../api/useTransactionApi'
import { useGoalsQuery } from '../api/useGoalApi'
import { useGoalTransactionAllocationsQuery } from '../api/useGoalTransactionAllocationApi'
import { useBudgetsQuery } from '../api/useBudgetApi'
import { useEmergencyFundSettingsQuery } from '../api/useEmergencyFundApi'
import { useFinancialFreedomSettingsQuery } from '../api/useFinancialFreedomApi'
import { getCurrentMonthRange, getLastNMonthsRange } from '../../utils/finance/dateRange'
import {
  calculateEssentialMonthlyAverage,
  calculateEmergencyFundTarget,
  calculateEmergencyFundProgress,
  calculateEmergencyFundRemaining,
  getEmergencyFundStatus,
} from '../../utils/finance/emergencyFund'
import { calculateNextMilestone } from '../../utils/finance/emergencyFundMilestones'
import { calculateGoalMetrics, summarizeGoals, sortGoals } from '../../utils/finance/goals'
import { calculateGoalContributionTotal } from '../../utils/finance/goalContributions'
import { calculateBudgetSpent, calculateBudgetProgress, calculateBudgetRemaining, getBudgetStatus } from '../../utils/finance/budgets'
import {
  calculateAverageMonthlySpending,
  calculateEstimatedAnnualSpending,
  calculateFITarget,
  calculateFIProgress,
  calculateFIGap,
  calculateProjection,
} from '../../utils/finance/financialFreedom'
import {
  DEFAULT_EMERGENCY_FUND_TARGET_MONTHS,
  ESSENTIAL_EXPENSE_BASELINE_MONTHS,
} from '../../constants/emergencyFund'
import { DEFAULT_FI_MULTIPLIER, DEFAULT_FI_ANALYSIS_MONTHS } from '../../constants/financialFreedom'

const NEEDS_ATTENTION_STATUSES = new Set(['over_budget', 'near_limit', 'attention'])
const TOP_GOALS_COUNT = 3

// Feeds both the compact "Financial Planning" nav cards and the dashboard's
// richer Emergency Fund / Goal Progress / Budget Attention / Financial
// Freedom sections — kept as its own hook (rather than folded into
// useActionDashboard) so each stays focused and under the project's
// file-size guideline. Every number here reuses the same utilities each
// feature's own page already uses; nothing is recalculated differently for
// the dashboard, and goal progress specifically reuses the same
// contribution-combining approach as useActionGoal (goal_contributions +
// goal_transaction_allocations) rather than deriving its own total.
const useActionDashboardPlanning = () => {
  const { currentUser, profile } = useActionAuth()
  const currency = profile?.currency ?? null

  const accountsQuery = useAccountsQuery()
  const categoriesQuery = useCategoriesQuery({})
  const accounts = accountsQuery.data ?? []
  const categoriesById = useMemo(
    () => Object.fromEntries((categoriesQuery.data ?? []).map((category) => [category.id, category])),
    [categoriesQuery.data],
  )
  const accountsById = useMemo(
    () => Object.fromEntries((accountsQuery.data ?? []).map((account) => [account.id, account])),
    [accountsQuery.data],
  )

  // Emergency Fund — same window/formula as EmergencyFundPage.
  const efSettingsQuery = useEmergencyFundSettingsQuery(currentUser?.id)
  const efRange = getLastNMonthsRange(ESSENTIAL_EXPENSE_BASELINE_MONTHS + 1)
  const efTransactionsQuery = useTransactionsQuery({ type: 'expense', fromDate: efRange.start, toDate: efRange.end })

  const efSettings = efSettingsQuery.data ?? null
  const efTargetMonths = efSettings?.target_months ?? DEFAULT_EMERGENCY_FUND_TARGET_MONTHS
  const efBaseline = calculateEssentialMonthlyAverage(efTransactionsQuery.data ?? [], categoriesById, ESSENTIAL_EXPENSE_BASELINE_MONTHS)
  const efTarget = calculateEmergencyFundTarget(efBaseline.average, efTargetMonths)
  const efAccount = efSettings?.emergency_account_id ? accountsById[efSettings.emergency_account_id] : null
  const efCurrent = efAccount ? Number(efAccount.balance) || 0 : null
  const efProgress = efCurrent !== null ? calculateEmergencyFundProgress(efCurrent, efTarget) : null
  const efStatus = getEmergencyFundStatus({
    monthsUsed: efBaseline.monthsUsed,
    requiredMonths: ESSENTIAL_EXPENSE_BASELINE_MONTHS,
    hasCurrentBalance: efCurrent !== null,
    progress: efProgress,
  })

  // Goals — combine the DB-derived manual-contribution total
  // (goal.current_amount, 0010) with transaction-linked allocations
  // (0013), exactly like useActionGoal does for /goals.
  const goalsQuery = useGoalsQuery({ isActive: true })
  const allocationsQuery = useGoalTransactionAllocationsQuery({})
  const allocationTotalsByGoal = useMemo(() => {
    const byGoal = new Map()
    ;(allocationsQuery.data ?? []).forEach((allocation) => {
      byGoal.set(allocation.goal_id, [...(byGoal.get(allocation.goal_id) ?? []), allocation])
    })
    return byGoal
  }, [allocationsQuery.data])

  const today = new Date()
  const decoratedGoals = (goalsQuery.data ?? []).map((goal) => {
    const allocationTotal = calculateGoalContributionTotal(allocationTotalsByGoal.get(goal.id))
    const combinedGoal = { ...goal, current_amount: (Number(goal.current_amount) || 0) + allocationTotal }
    return { ...combinedGoal, ...calculateGoalMetrics(combinedGoal, today) }
  })
  const goalsSummary = summarizeGoals(decoratedGoals)
  const topGoals = sortGoals(decoratedGoals).slice(0, TOP_GOALS_COUNT)

  // Budget — current calendar month only, independent of the dashboard's
  // selected metrics period (a budget is always "this month").
  const budgetsQuery = useBudgetsQuery({ isActive: true })
  const budgetMonthRange = getCurrentMonthRange()
  const budgetTransactionsQuery = useTransactionsQuery({
    type: 'expense',
    fromDate: budgetMonthRange.start,
    toDate: budgetMonthRange.end,
  })
  const budgets = budgetsQuery.data ?? []
  const decoratedBudgets = budgets.map((budget) => {
    const spent = calculateBudgetSpent(budgetTransactionsQuery.data ?? [], budget, accountsById)
    const status = getBudgetStatus(budget.amount, spent)
    return {
      ...budget,
      categoryName: categoriesById[budget.category_id]?.name ?? 'Unknown category',
      spent,
      status,
      progress: calculateBudgetProgress(budget.amount, spent),
      ...calculateBudgetRemaining(budget.amount, spent),
    }
  })
  // Uncapped — callers slice for display (e.g. HomePage's compact card);
  // useNotificationSync needs every at-risk budget, not just the preview.
  const budgetsNeedingAttention = decoratedBudgets.filter((budget) => NEEDS_ATTENTION_STATUSES.has(budget.status))

  // Financial Freedom — same formula as FinancialFreedomPage, using only the
  // configured contribution (skips its "default to current savings" nuance,
  // which isn't essential for a compact status card).
  const fiSettingsQuery = useFinancialFreedomSettingsQuery(currentUser?.id)
  const fiSettings = fiSettingsQuery.data ?? null
  const fiAnalysisMonths = fiSettings?.analysis_months ?? DEFAULT_FI_ANALYSIS_MONTHS
  const fiMultiplier = fiSettings?.fi_multiplier ?? DEFAULT_FI_MULTIPLIER
  const fiRange = getLastNMonthsRange(fiAnalysisMonths + 1)
  const fiTransactionsQuery = useTransactionsQuery({ type: 'expense', fromDate: fiRange.start, toDate: fiRange.end })

  const fiSpending = calculateAverageMonthlySpending(fiTransactionsQuery.data ?? [], categoriesById, fiAnalysisMonths)
  const fiTarget = calculateFITarget(calculateEstimatedAnnualSpending(fiSpending.average), fiMultiplier)
  const selectedFIAccountIds = fiSettings?.selected_account_ids ?? []
  const fiCurrentAssets = accounts
    .filter((account) => selectedFIAccountIds.includes(account.id) && account.currency === currency)
    .reduce((sum, account) => sum + (Number(account.balance) || 0), 0)
  const fiProgress = fiSettings ? calculateFIProgress(fiCurrentAssets, fiTarget) : null
  // Estimated only — never shown unless the user has actually set a monthly
  // contribution, and always framed as an assumption-driven estimate.
  const fiProjection =
    fiSettings?.monthly_contribution && fiTarget
      ? calculateProjection(fiCurrentAssets, fiSettings.monthly_contribution, fiSettings.expected_annual_return, fiTarget)
      : null

  const isLoading =
    accountsQuery.isLoading ||
    categoriesQuery.isLoading ||
    efSettingsQuery.isLoading ||
    efTransactionsQuery.isLoading ||
    goalsQuery.isLoading ||
    allocationsQuery.isLoading ||
    budgetsQuery.isLoading ||
    budgetTransactionsQuery.isLoading ||
    fiSettingsQuery.isLoading ||
    fiTransactionsQuery.isLoading

  return {
    isLoading,
    currency,

    emergencyFund: {
      configured: Boolean(efSettings?.emergency_account_id),
      status: efStatus,
      current: efCurrent,
      target: efTarget,
      progress: efProgress,
      remaining: calculateEmergencyFundRemaining(efCurrent ?? 0, efTarget),
      nextMilestone: calculateNextMilestone(efProgress, efTarget),
      targetMonths: efTargetMonths,
    },

    goals: {
      active: goalsSummary.active,
      completed: goalsSummary.reached,
      top: topGoals,
      all: decoratedGoals,
    },

    budget: {
      active: budgets.length,
      needingAttention: budgetsNeedingAttention.length,
      attentionList: budgetsNeedingAttention,
    },

    financialFreedom: {
      configured: Boolean(fiSettings),
      hasSpendingHistory: fiSpending.monthsUsed > 0,
      target: fiTarget,
      currentAssets: fiCurrentAssets,
      progress: fiProgress,
      gap: calculateFIGap(fiTarget, fiCurrentAssets),
      multiplier: fiMultiplier,
      projection: fiProjection,
    },
  }
}

export default useActionDashboardPlanning
