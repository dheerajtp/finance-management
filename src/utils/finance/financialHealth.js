import { calculateExpectedContributionDate, calculateContributionStatus } from './investments'
import { summarizeGoals } from './goals'

// Pure interpretation layer only — every number here is already computed by
// an existing feature's own utilities (emergencyFund.js, investments.js,
// goals.js, budgets.js, financialFreedom.js, dashboardMetrics.js,
// spendingInsights.js). Nothing in this file recalculates a formula that
// already exists elsewhere; it only reads already-derived data and turns it
// into one of a small, fixed set of statuses + a plain-language observation.
// No Supabase, no React, no Date.now()/new Date() — `currentDate` is always
// passed in by the caller.

const ATTENTION_STATUSES = new Set(['needs_attention', 'pending'])
const PROGRESS_STATUSES = new Set(['in_progress', 'configured'])
const GOOD_STATUSES = new Set(['on_track', 'target_reached'])

const groupAmountByCurrency = (items, currencyOf, amountOf) => {
  const totals = new Map()
  items.forEach((item) => {
    const currency = currencyOf(item)
    totals.set(currency, (totals.get(currency) ?? 0) + amountOf(item))
  })
  return Array.from(totals.entries()).map(([currency, total]) => ({ currency, total }))
}

// emergencyFund: the `emergencyFund` shape returned by
// useActionDashboardPlanning (configured/status/current/target/progress/...).
// plannedMonthlyContribution/actualMonthlyContribution are plain numbers in
// the emergency fund account's own currency — never combined with anything
// else.
export const getEmergencyFundHealth = ({ emergencyFund, plannedMonthlyContribution, actualMonthlyContribution, currency, formatCurrency }) => {
  const base = { area: 'emergency_fund', title: 'Emergency Fund' }

  if (!emergencyFund.configured) {
    return { ...base, status: 'not_configured', message: "Emergency fund isn't configured yet.", progress: null }
  }
  if (emergencyFund.status === 'no_data' || emergencyFund.status === 'insufficient_history') {
    return {
      ...base,
      status: 'insufficient_data',
      message: 'More spending history is needed to calculate your emergency fund target.',
      progress: null,
    }
  }
  if (emergencyFund.progress !== null && emergencyFund.progress >= 100) {
    return { ...base, status: 'target_reached', message: 'Your emergency fund has reached its configured target.', progress: 100 }
  }
  if (plannedMonthlyContribution > 0 && actualMonthlyContribution !== null && actualMonthlyContribution < plannedMonthlyContribution) {
    return {
      ...base,
      status: 'needs_attention',
      message: `Your planned monthly contribution is ${formatCurrency(plannedMonthlyContribution, currency)}, but this month's contribution is ${formatCurrency(actualMonthlyContribution, currency)}.`,
      progress: emergencyFund.progress,
    }
  }
  return {
    ...base,
    status: 'in_progress',
    message: `Your emergency fund is ${Math.round(emergencyFund.progress ?? 0)}% funded.`,
    progress: emergencyFund.progress,
  }
}

// plans: ALL investment plans (active and inactive — inactive is needed to
// tell "no plan ever configured" apart from "currently paused").
// contributions: ALL investment contributions. Status per plan reuses
// calculateExpectedContributionDate/calculateContributionStatus from
// investments.js — never reimplemented here.
export const getInvestmentHealth = ({ plans, contributions, currentDate, formatCurrency }) => {
  const base = { area: 'investments', title: 'Investments' }

  if (plans.length === 0) {
    return { ...base, status: 'not_configured', message: 'No active SIP plans are configured.', monthlyPlannedByCurrency: [] }
  }

  const decorated = plans.map((plan) => {
    const planContributions = contributions.filter((contribution) => contribution.plan_id === plan.id)
    const status = calculateContributionStatus(plan, planContributions, currentDate)
    const expectedDate = calculateExpectedContributionDate(plan, currentDate)
    const matching = planContributions.find((contribution) => contribution.contribution_date === expectedDate)
    return { ...plan, status, expectedDate, matchingContributionStatus: matching?.status ?? null }
  })

  const activePlans = decorated.filter((plan) => plan.is_active)
  const monthlyPlannedByCurrency = groupAmountByCurrency(
    activePlans.filter((plan) => plan.frequency === 'monthly'),
    (plan) => plan.currency,
    (plan) => Number(plan.amount) || 0,
  )

  if (activePlans.length === 0) {
    return {
      ...base,
      status: 'paused',
      message: decorated.length === 1 ? `Your ${decorated[0].name} SIP is currently paused.` : 'Your SIP plans are currently paused.',
      monthlyPlannedByCurrency: [],
    }
  }

  const overdue = activePlans.find((plan) => plan.status === 'overdue')
  if (overdue) {
    return {
      ...base,
      status: 'needs_attention',
      message: `Your ${overdue.name} contribution hasn't been recorded yet.`,
      monthlyPlannedByCurrency,
    }
  }

  const due = activePlans.find((plan) => plan.status === 'due')
  if (due) {
    return {
      ...base,
      status: 'pending',
      message: `Your ${due.name} of ${formatCurrency(due.amount, due.currency)} is due today.`,
      monthlyPlannedByCurrency,
    }
  }

  const skipped = activePlans.find((plan) => plan.status === 'completed' && plan.matchingContributionStatus === 'skipped')
  if (skipped) {
    return {
      ...base,
      status: 'skipped',
      message: `Your ${skipped.name} contribution was marked as skipped.`,
      monthlyPlannedByCurrency,
    }
  }

  return {
    ...base,
    status: 'on_track',
    message: activePlans.length === 1 ? `Your ${activePlans[0].name} SIP is active and this month's contribution has been recorded.` : 'Your SIP plans are active and on track.',
    monthlyPlannedByCurrency,
  }
}

// target/actual/income are plain numbers in `currency` (the caller has
// already grouped to a single currency — see dashboardMetrics.js).
export const getSavingsHealth = ({ target, actual, income, currency, formatCurrency }) => {
  const base = { area: 'savings', title: 'Savings' }

  if (!income || income <= 0) {
    return { ...base, status: 'insufficient_data', message: 'Add income transactions to evaluate savings for this month.', delta: null }
  }
  if (!target || target <= 0) {
    return { ...base, status: 'not_configured', message: 'Monthly savings target not configured.', delta: null }
  }

  const delta = actual - target
  if (delta >= 0) {
    return {
      ...base,
      status: 'on_track',
      message: delta === 0 ? "You're meeting your monthly savings target." : `You're ${formatCurrency(delta, currency)} above your monthly savings target.`,
      delta,
    }
  }
  return {
    ...base,
    status: 'needs_attention',
    message: `You're ${formatCurrency(Math.abs(delta), currency)} below your monthly savings target.`,
    delta,
  }
}

// insights: the array already produced by detectSpendingSignals
// (spendingInsights.js) — this never recomputes a spending signal, it only
// picks the top one to surface.
export const getSpendingHealth = ({ hasTransactions, hasSufficientHistory, insights }) => {
  const base = { area: 'spending', title: 'Spending' }

  if (!hasTransactions || !hasSufficientHistory) {
    return { ...base, status: 'insufficient_data', message: 'More spending history is needed to identify patterns.' }
  }
  if (insights.length > 0) {
    return { ...base, status: 'needs_attention', message: insights[0].message }
  }
  return { ...base, status: 'on_track', message: 'Spending is within your recent patterns.' }
}

// budget: the `budget` shape from useActionDashboardPlanning
// (active/needingAttention/attentionList) — counts only, never a summed
// money amount, so this is safe to combine across currencies (same
// reasoning as recurringTransactions.js's own commitment counts).
export const getBudgetHealth = (budget) => {
  const base = { area: 'budgets', title: 'Budgets' }

  if (budget.active === 0) {
    return { ...base, status: 'not_configured', message: 'No active budgets configured.' }
  }
  if (budget.needingAttention === 0) {
    return { ...base, status: 'on_track', message: 'All active budgets are currently on track.' }
  }
  if (budget.needingAttention === 1) {
    const item = budget.attentionList[0]
    const verb = item.status === 'over_budget' ? 'is currently above its budget' : 'needs attention'
    return { ...base, status: 'needs_attention', message: `${item.categoryName} ${verb}.` }
  }
  return { ...base, status: 'needs_attention', message: `${budget.needingAttention} budgets need attention.` }
}

// decoratedGoals: goals already decorated with calculateGoalMetrics (the
// `all` array from useActionDashboardPlanning's `goals`) — reuses
// summarizeGoals rather than recounting statuses by hand.
export const getGoalHealth = (decoratedGoals) => {
  const base = { area: 'goals', title: 'Goals' }
  const summary = summarizeGoals(decoratedGoals)

  if (summary.active === 0) {
    return { ...base, status: 'not_configured', message: 'No active goals configured.' }
  }
  if (summary.behind > 0) {
    const behindGoal = decoratedGoals.find((goal) => goal.is_active && goal.status === 'behind')
    return {
      ...base,
      status: 'needs_attention',
      message: behindGoal
        ? `Your ${behindGoal.name} goal is currently behind its planned progress.`
        : `${summary.behind} of your goals are behind their planned progress.`,
    }
  }
  if (summary.reached === summary.active) {
    return { ...base, status: 'target_reached', message: summary.reached === 1 ? 'Your goal has reached its target.' : 'All your goals have reached their targets.' }
  }
  return { ...base, status: 'on_track', message: `${summary.onTrack} of ${summary.active} active goal${summary.active === 1 ? '' : 's'} on track.` }
}

// financialFreedom: the `financialFreedom` shape from
// useActionDashboardPlanning (configured/hasSpendingHistory/progress/...).
// Never states a target date or a guarantee — only the existing progress
// percentage, already framed as an estimate by financialFreedom.js.
export const getFinancialFreedomHealth = (financialFreedom) => {
  const base = { area: 'financial_freedom', title: 'Financial Freedom' }

  if (!financialFreedom.configured) {
    return { ...base, status: 'not_configured', message: "Financial Freedom assumptions haven't been configured." }
  }
  if (!financialFreedom.hasSpendingHistory) {
    return { ...base, status: 'insufficient_data', message: 'More spending history is needed to estimate your FI target.' }
  }
  if (financialFreedom.progress !== null && financialFreedom.progress >= 100) {
    return { ...base, status: 'target_reached', message: 'Your selected assets have reached your estimated FI target.' }
  }
  return {
    ...base,
    status: 'in_progress',
    message:
      financialFreedom.progress !== null
        ? `Your selected investment assets represent ${Math.round(financialFreedom.progress)}% of your estimated FI target.`
        : 'Your Financial Freedom estimate is being calculated.',
  }
}

// Reuses summarizeSafeToSpend's own output (safeToSpend.js) — this only
// turns it into one more observation row, it never recomputes income,
// commitments, or the safe-to-spend figure itself. Deliberately left out
// of getFinancialHealthPriorities: an over-committed Safe to Spend is a
// summary of the same underlying commitment issues (Emergency Fund/SIP/
// Goals/etc.) that already surface as their own priority items, so adding
// it there would restate what's already said.
export const getSafeToSpendHealth = ({ hasIncome, isOverCommitted, availableAmount, overCommittedAmount, currency, formatCurrency }) => {
  const base = { area: 'safe_to_spend', title: 'Safe to Spend' }

  if (!hasIncome) {
    return { ...base, status: 'insufficient_data', message: "Safe-to-spend amount isn't available because no income has been recorded for this month." }
  }
  if (isOverCommitted) {
    return {
      ...base,
      status: 'needs_attention',
      message: `Your planned commitments currently exceed recorded income by ${formatCurrency(overCommittedAmount, currency)}.`,
    }
  }
  return { ...base, status: 'on_track', message: `${formatCurrency(availableAmount, currency)} remains available for flexible spending this month.` }
}

// No score, no weighting — just "is anything worth reviewing right now."
// "not_configured" never overrides a real attention item elsewhere.
export const getFinancialHealthSummary = (areas) => {
  const hasAttention = areas.some((area) => ATTENTION_STATUSES.has(area.status))
  const hasProgress = areas.some((area) => PROGRESS_STATUSES.has(area.status))
  const hasGood = areas.some((area) => GOOD_STATUSES.has(area.status))

  let overallStatus = 'not_configured'
  if (hasAttention) overallStatus = 'needs_attention'
  else if (hasProgress) overallStatus = 'in_progress'
  else if (hasGood) overallStatus = 'on_track'

  return { overallStatus, areas }
}

const PRIORITY_AREA_ORDER = ['emergency_fund', 'investments', 'savings', 'budgets', 'spending', 'goals', 'financial_freedom']
const MAX_PRIORITIES = 3

// Deterministic, fixed order, max 3 — "worth reviewing," never "do this or
// else." Only areas that are actually flagged (needs_attention/pending) can
// appear; not_configured/insufficient_data/on_track/paused/skipped never do.
export const getFinancialHealthPriorities = (areas) => {
  const byArea = new Map(areas.map((area) => [area.area, area]))
  return PRIORITY_AREA_ORDER.map((area) => byArea.get(area))
    .filter((area) => area && ATTENTION_STATUSES.has(area.status))
    .slice(0, MAX_PRIORITIES)
    .map((area) => ({ area: area.area, title: area.title, message: area.message }))
}
