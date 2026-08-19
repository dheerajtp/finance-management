import { useMemo, useState } from 'react'
import { useAtomValue } from 'jotai'
import useActionAuth from './useActionAuth'
import useActionDashboardPlanning from './useActionDashboardPlanning'
import useActionDashboardCommitments from './useActionDashboardCommitments'
import { useDashboardData } from '../api/useDashboardApi'
import { dashboardPeriodPreferenceAtom } from '../../store/preferences.store'
import { getPeriodRange } from '../../utils/finance/dateRange'
import { groupTransactionsByCurrency } from '../../utils/finance/transactionSummary'
import { calculateMonthlyMetrics } from '../../utils/finance/dashboardMetrics'
import { calculateSpendingBreakdown } from '../../utils/finance/spendingBreakdown'
import { calculateTopCategories } from '../../utils/finance/topCategories'
import { calculateSavingsTargetStatus } from '../../utils/finance/savingsTarget'
import { getFinancialActions } from '../../utils/finance/actionCenter'
import { formatCurrency } from '../../utils/finance/currency'

// Top-level dashboard orchestrator. Calls useActionDashboardPlanning and
// useActionDashboardCommitments itself purely to gather the cross-domain
// signals the Action Center needs (recurring due/overdue, emergency fund
// configured, budget attention, goals behind) — HomePage also calls those
// two hooks directly for their own dedicated sections. This looks like two
// call sites per hook, but every underlying query is the same TanStack
// Query cache entry (same query key), so there is no duplicate network
// request either way — only the (cheap, pure) derived-data computation
// runs twice.
const useActionDashboard = () => {
  const { profile } = useActionAuth()
  const defaultPeriod = useAtomValue(dashboardPeriodPreferenceAtom)
  const [period, setPeriod] = useState(defaultPeriod)

  const dateRange = getPeriodRange(period)
  const { accounts, categories, transactions, recentTransactions, hasEverHadTransactions, isLoading, isError, refetch } =
    useDashboardData(dateRange)

  const planning = useActionDashboardPlanning()
  const commitments = useActionDashboardCommitments()

  const accountsById = useMemo(() => Object.fromEntries(accounts.map((account) => [account.id, account])), [accounts])
  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category])),
    [categories],
  )

  const dashboard = useMemo(() => {
    const groups = groupTransactionsByCurrency(transactions, accountsById)
    const currencies = Array.from(groups.keys())
    const primaryCurrency = currencies.includes(profile?.currency) ? profile.currency : currencies[0]
    const primaryTransactions = primaryCurrency ? groups.get(primaryCurrency) : []
    const hasTransactions = primaryTransactions.length > 0

    const metrics = calculateMonthlyMetrics(primaryTransactions)
    const breakdown = calculateSpendingBreakdown(primaryTransactions, categoriesById)
    const topCategories = calculateTopCategories(primaryTransactions, categoriesById, breakdown.total)

    // Only compare against the target if it's denominated in the same
    // currency we're actually reporting — otherwise the numbers aren't
    // comparable, so treat it as if no target were set.
    const targetInPrimaryCurrency = profile?.currency === primaryCurrency ? profile?.monthly_savings_target : null
    const savingsTarget = calculateSavingsTargetStatus(metrics.savings, targetInPrimaryCurrency)

    const actions = getFinancialActions(
      {
        hasTransactions,
        income: metrics.income,
        savings: metrics.savings,
        savingsRate: metrics.savingsRate,
        savingsTarget,
        breakdown,
        currency: primaryCurrency,
      },
      {
        recurringDueCount: commitments.dueCount,
        recurringOverdueCount: commitments.overdueCount,
        emergencyFundConfigured: planning.emergencyFund.configured,
        budgetAttentionCount: planning.budget.needingAttention,
        goalsBehindCount: planning.goals.top.filter((goal) => goal.status === 'behind').length,
      },
      formatCurrency,
    )

    // "Brand new" must reflect overall setup, not just this period's
    // transaction count — a returning user can legitimately have a quiet
    // month. Zero accounts is the reliable signal: every transaction
    // requires a valid account_id (DB constraint) and accounts are never
    // hard-deleted (only deactivated), so zero accounts also guarantees
    // zero transactions, ever.
    const isBrandNew = accounts.length === 0
    const profileComplete = Boolean(profile) && profile.monthly_income !== null && profile.monthly_income !== undefined

    const setupSteps = [
      { key: 'profile', label: 'Profile', done: profileComplete },
      { key: 'accounts', label: 'Accounts', done: accounts.length > 0 },
      { key: 'transaction', label: 'First transaction', done: hasEverHadTransactions },
      { key: 'savingsTarget', label: 'Savings target', done: savingsTarget.hasTarget },
    ]

    return {
      currency: primaryCurrency,
      metrics,
      breakdown,
      topCategories,
      savingsTarget,
      actions,
      hasTransactions,
      hasOtherCurrencies: currencies.length > 1,
      isBrandNew,
      isProfileIncomplete: !profileComplete,
      setupSteps,
      setupCompletedCount: setupSteps.filter((step) => step.done).length,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    transactions,
    accountsById,
    categoriesById,
    profile,
    accounts,
    hasEverHadTransactions,
    commitments.dueCount,
    commitments.overdueCount,
    planning.emergencyFund.configured,
    planning.budget.needingAttention,
    planning.goals.top,
  ])

  return {
    profile,
    period,
    setPeriod,
    accounts,
    accountsById,
    categoriesById,
    hasEverHadTransactions,
    isLoading,
    isError,
    refetch,
    // Recent activity is deliberately NOT period-filtered — "recent" always
    // means the true most-recent transactions, in their own currencies.
    recentTransactions,
    ...dashboard,
  }
}

export default useActionDashboard
