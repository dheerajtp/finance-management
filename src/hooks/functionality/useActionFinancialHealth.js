import { useMemo } from 'react'
import useActionAuth from './useActionAuth'
import useActionDashboardPlanning from './useActionDashboardPlanning'
import useActionSpendingAnalysis from './useActionSpendingAnalysis'
import { useFinancialHealthData } from '../api/useFinancialHealthApi'
import { groupTransactionsByCurrency } from '../../utils/finance/transactionSummary'
import { calculateMonthlyMetrics } from '../../utils/finance/dashboardMetrics'
import {
  getEmergencyFundHealth,
  getInvestmentHealth,
  getSavingsHealth,
  getSpendingHealth,
  getBudgetHealth,
  getGoalHealth,
  getFinancialFreedomHealth,
  getSafeToSpendHealth,
  getFinancialHealthSummary,
  getFinancialHealthPriorities,
} from '../../utils/finance/financialHealth'
import { calculateAccountInflowThisMonth } from '../../utils/finance/safeToSpend'
import { formatCurrency } from '../../utils/finance/currency'

// "Am I following the plans I configured?" — every status here interprets
// data another feature's hooks/utilities already compute; this hook adds no
// new financial formula, only composition + the pure getXHealth functions
// in utils/finance/financialHealth.js. useActionDashboardPlanning is reused
// wholesale for Emergency Fund/Goals/Budget/Financial Freedom (same pattern
// useActionDashboard already uses to call it a second time — same TanStack
// Query cache entries, no duplicate network requests), and
// useActionSpendingAnalysis is reused wholesale for the spending signal
// engine rather than a second one being built here.
//
// `spendingPlan` (optional) is the result of useActionSpendingPlan(),
// passed in rather than called here — HomePage already needs that hook for
// its own Safe-to-Spend dashboard card, and useActionSpendingPlan is itself
// a heavy composition (6+ underlying queries); calling it a second time
// here would double that cost for a purely optional observation row. Omit
// it and the Safe to Spend row simply reports "not enough data".
const useActionFinancialHealth = (spendingPlan = {}) => {
  const { currentUser, profile } = useActionAuth()
  const currency = profile?.currency ?? null

  const planning = useActionDashboardPlanning()
  const spending = useActionSpendingAnalysis()
  const health = useFinancialHealthData(currentUser?.id)

  const accountsById = useMemo(
    () => Object.fromEntries(health.accounts.map((account) => [account.id, account])),
    [health.accounts],
  )

  // This month's income/expenses/savings/invested, in the profile's own
  // currency only — reuses calculateMonthlyMetrics exactly as the dashboard
  // itself does, just scoped to "this month" rather than the dashboard's
  // selectable period (plan adherence is always a monthly question).
  const currentMonthByCurrency = groupTransactionsByCurrency(health.currentMonthTransactions, accountsById)
  const currentMonthPrimary = currency ? (currentMonthByCurrency.get(currency) ?? []) : []
  const monthMetrics = calculateMonthlyMetrics(currentMonthPrimary)

  // Money actually moved into the configured emergency fund account this
  // month — shared with the Safe-to-Spend feature's own commitment check
  // (see safeToSpend.js's calculateAccountInflowThisMonth), so both agree
  // on what "already contributed" means. Read directly off the raw
  // (ungrouped) list since it's scoped to one specific destination account,
  // so it's inherently already single-currency.
  const efAccountId = health.emergencyFundSettings?.emergency_account_id ?? null
  const efActualContribution = calculateAccountInflowThisMonth(health.currentMonthTransactions, efAccountId)
  const efCurrency = efAccountId ? accountsById[efAccountId]?.currency ?? currency : currency

  const areas = useMemo(
    () => [
      getEmergencyFundHealth({
        emergencyFund: planning.emergencyFund,
        plannedMonthlyContribution: Number(health.emergencyFundSettings?.monthly_contribution) || 0,
        actualMonthlyContribution: efActualContribution,
        currency: efCurrency,
        formatCurrency,
      }),
      getInvestmentHealth({
        plans: health.investmentPlans,
        contributions: health.investmentContributions,
        currentDate: new Date(),
        formatCurrency,
      }),
      getSavingsHealth({
        target: Number(profile?.monthly_savings_target) || 0,
        actual: monthMetrics.savings,
        income: monthMetrics.income,
        currency,
        formatCurrency,
      }),
      getSpendingHealth({
        hasTransactions: spending.hasTransactions,
        hasSufficientHistory: spending.hasSufficientHistory,
        insights: spending.insights,
      }),
      getBudgetHealth(planning.budget),
      getGoalHealth(planning.goals.all),
      getFinancialFreedomHealth(planning.financialFreedom),
      getSafeToSpendHealth({
        hasIncome: spendingPlan.hasIncome,
        isOverCommitted: spendingPlan.isOverCommitted,
        availableAmount: spendingPlan.availableAmount,
        overCommittedAmount: spendingPlan.overCommittedAmount,
        currency: spendingPlan.currency,
        formatCurrency,
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      planning.emergencyFund,
      planning.budget,
      planning.goals.all,
      planning.financialFreedom,
      health.emergencyFundSettings,
      health.investmentPlans,
      health.investmentContributions,
      efActualContribution,
      efCurrency,
      monthMetrics.savings,
      monthMetrics.income,
      profile?.monthly_savings_target,
      currency,
      spending.hasTransactions,
      spending.hasSufficientHistory,
      spending.insights,
      spendingPlan.hasIncome,
      spendingPlan.isOverCommitted,
      spendingPlan.availableAmount,
      spendingPlan.overCommittedAmount,
      spendingPlan.currency,
    ],
  )

  const summary = getFinancialHealthSummary(areas)
  const priorities = getFinancialHealthPriorities(areas)

  const isConfigured = areas.some((area) => area.status !== 'not_configured' && area.status !== 'insufficient_data')

  return {
    isLoading: planning.isLoading || spending.isLoading || health.isLoading || Boolean(spendingPlan.isLoading),
    isError: health.isError,
    refetch: () => {
      health.refetch()
      spending.refetch()
    },

    currency,
    overallStatus: summary.overallStatus,
    areas,
    priorities,
    isConfigured,
  }
}

export default useActionFinancialHealth
