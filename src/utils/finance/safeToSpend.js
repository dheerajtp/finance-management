import { calculateSpendingBreakdown } from './spendingBreakdown'
import { calculateContributionStatus } from './investments'
import { FLEXIBLE_CATEGORY_KEYS, getFlexibleGroupForCategory } from '../../constants/flexibleSpending'

// Pure, deterministic, no Supabase/React/Date.now() — every input here is
// already-fetched data or an already-computed result from another
// feature's own utilities (spendingBreakdown.js, investments.js). Nothing
// in this file recalculates income/expenses/SIP-status/goal-requirement
// formulas that already exist elsewhere.

const toAmount = (value) => Number(value) || 0
const inCurrentMonth = (date, monthRange) => date >= monthRange.start && date <= monthRange.end

export const calculateCurrentMonthIncome = (transactions) =>
  transactions.filter((transaction) => transaction.type === 'income').reduce((sum, transaction) => sum + toAmount(transaction.amount), 0)

// Reuses calculateSpendingBreakdown (spendingBreakdown.js) rather than a
// second essential/discretionary split — `.essential` is the authoritative
// number Spending Analysis itself uses.
export const calculateEssentialExpenses = (transactions, categoriesById) => calculateSpendingBreakdown(transactions, categoriesById).essential

// Non-essential expense transactions (discretionary + uncategorized) —
// uncategorized is deliberately included here, never silently promoted to
// essential (same rule calculateSpendingBreakdown already enforces).
export const calculateFlexibleTransactions = (transactions, categoriesById) =>
  transactions.filter((transaction) => transaction.type === 'expense').filter((transaction) => {
    const category = transaction.category_id ? categoriesById[transaction.category_id] : null
    return !category || !category.is_essential
  })

// The double-counting rule for the Emergency Fund: `actualContribution` is
// however much has already moved into the EF account this month (a
// transfer, computed by the caller — see useActionSpendingPlan). Only the
// remaining GAP between the plan and what's already happened counts as a
// still-pending commitment, so a partial contribution is handled correctly
// too, not just a binary "already recorded" flag.
export const calculateEmergencyFundCommitment = ({ emergencyFund, plannedMonthlyContribution, actualMonthlyContribution }) => {
  if (!emergencyFund.configured) return { amount: 0, note: 'not_configured' }
  if (emergencyFund.progress !== null && emergencyFund.progress >= 100) return { amount: 0, note: 'target_reached' }
  if (!plannedMonthlyContribution || plannedMonthlyContribution <= 0) return { amount: 0, note: 'no_contribution_configured' }

  const remaining = Math.max(0, plannedMonthlyContribution - toAmount(actualMonthlyContribution))
  return { amount: remaining, note: remaining === 0 ? 'already_recorded' : 'pending' }
}

// `plans` = ALL investment plans (active + inactive, so paused/ended are
// visibly excluded rather than silently absent). Status per plan reuses
// calculateExpectedContributionDate/calculateContributionStatus from
// investments.js — never reimplemented. A plan only contributes to the
// commitment total when this month's occurrence is still pending
// ('due'/'overdue'); 'completed' (recorded OR skipped), 'paused', and
// 'ended' never do — skipped is respected, not treated as still owed.
export const calculateInvestmentCommitment = ({ plans, contributions, currentDate }) => {
  const items = plans
    .filter((plan) => plan.is_active)
    .map((plan) => {
      const planContributions = contributions.filter((contribution) => contribution.plan_id === plan.id)
      const status = calculateContributionStatus(plan, planContributions, currentDate)
      return { id: plan.id, name: plan.name, amount: toAmount(plan.amount), currency: plan.currency, status }
    })
    .filter((plan) => plan.status === 'due' || plan.status === 'overdue')

  return { amount: items.reduce((sum, item) => sum + item.amount, 0), items }
}

// `decoratedGoals` already carries `.requiredMonthlyContribution` from
// calculateGoalMetrics (goals.js) — null/0 there already means "no
// contribution applicable" (no target date, or target already reached), so
// this only filters and sums, it never re-derives the amount.
export const calculateGoalCommitment = (decoratedGoals) => {
  const items = decoratedGoals
    .filter((goal) => goal.is_active && typeof goal.requiredMonthlyContribution === 'number' && goal.requiredMonthlyContribution > 0)
    .map((goal) => ({ id: goal.id, name: goal.name, amount: toAmount(goal.requiredMonthlyContribution), currency: goal.currency }))

  return { amount: items.reduce((sum, item) => sum + item.amount, 0), items }
}

// A subscription only counts once its `next_billing_date` falls within the
// current calendar month — the same field the Subscriptions feature itself
// uses to mean "not yet paid". Once the user updates it after paying (or it
// was never due this month), it naturally falls out of this window, which
// is what prevents double-counting: there is no other link between
// subscriptions and transactions in this app (see subscriptions.js notes),
// so `next_billing_date` is the one honest signal available.
export const calculateSubscriptionCommitment = (subscriptions, monthRange, currency) => {
  const items = subscriptions
    .filter((subscription) => subscription.is_active && subscription.currency === currency)
    .filter((subscription) => inCurrentMonth(subscription.next_billing_date, monthRange))
    .map((subscription) => ({ id: subscription.id, name: subscription.name, amount: toAmount(subscription.amount), currency: subscription.currency }))

  return { amount: items.reduce((sum, item) => sum + item.amount, 0), items }
}

// Same reasoning as subscriptions, but recurring transactions DO have a
// real "recording creates a transaction and advances next_occurrence_date"
// flow (see recurringTransactions.js) — so this window is an even more
// direct signal: once recorded, next_occurrence_date moves past the
// current month (or later within it), which is exactly what stops a
// second subtraction from happening.
export const calculateRecurringCommitment = (recurringTransactions, monthRange, currency) => {
  const items = recurringTransactions
    .filter((item) => item.is_active && item.type === 'expense' && item.currency === currency)
    .filter((item) => inCurrentMonth(item.next_occurrence_date, monthRange))
    .map((item) => ({ id: item.id, name: item.description || 'Recurring expense', amount: toAmount(item.amount), currency: item.currency }))

  return { amount: items.reduce((sum, item) => sum + item.amount, 0), items }
}

// The amount actually transferred into a specific account this month —
// shared by the Emergency Fund commitment check above and Financial
// Health's own contribution-alignment check (useActionFinancialHealth),
// so both features agree on what "already contributed" means.
export const calculateAccountInflowThisMonth = (transactions, accountId) => {
  if (!accountId) return null
  return transactions
    .filter((transaction) => transaction.type === 'transfer' && transaction.destination_account_id === accountId)
    .reduce((sum, transaction) => sum + toAmount(transaction.amount), 0)
}

export const calculateCommittedAmount = (commitments) => commitments.reduce((sum, commitment) => sum + commitment.amount, 0)

export const calculateSafeToSpend = ({ income, essentialExpenses, committedAmount }) => income - essentialExpenses - committedAmount

// Never negative — a shortfall is reported separately (see overCommittedAmount).
export const calculateOverCommittedAmount = (safeToSpendRaw) => Math.max(0, -safeToSpendRaw)

// `percentages` is the settings row shape directly (food_percentage,
// travel_percentage, ...) — same field names as the spending_plan_settings
// table/form, no separate transformation needed.
export const calculateAllocationTotalPercentage = (percentages) =>
  FLEXIBLE_CATEGORY_KEYS.reduce((sum, key) => sum + toAmount(percentages[`${key}_percentage`]), 0)

export const calculateFlexibleAllocation = (capacity, percentages) =>
  Object.fromEntries(FLEXIBLE_CATEGORY_KEYS.map((key) => [key, (capacity * toAmount(percentages[`${key}_percentage`])) / 100]))

// Sums already-mapped flexible transactions per bucket — every transaction
// lands in exactly one of the 6 buckets (see getFlexibleGroupForCategory),
// never silently discarded.
export const calculateFlexibleSpending = (flexibleTransactions, categoriesById) => {
  const byGroup = Object.fromEntries(FLEXIBLE_CATEGORY_KEYS.map((key) => [key, 0]))
  flexibleTransactions.forEach((transaction) => {
    const category = transaction.category_id ? categoriesById[transaction.category_id] : null
    const group = getFlexibleGroupForCategory(category)
    byGroup[group] += toAmount(transaction.amount)
  })
  return byGroup
}

export const calculateAllocationRemaining = (allocated, spent) => allocated - spent

export const calculateAllocationStatus = (allocated, spent) => {
  if (allocated <= 0) return spent > 0 ? 'needs_attention' : 'not_configured'
  if (spent > allocated) return 'needs_attention'
  return 'on_track'
}

// The single top-level entry point — composes every function above into
// the full shape the page/dashboard/Financial-Health integrations consume.
// Every argument is already-fetched data or an already-decorated result
// from another feature (see useActionSpendingPlan for what gathers them).
export const summarizeSafeToSpend = ({
  currentMonthTransactions,
  categoriesById,
  emergencyFund,
  emergencyFundPlanned,
  emergencyFundActual,
  investmentPlans,
  investmentContributions,
  decoratedGoals,
  subscriptions,
  recurringTransactions,
  monthRange,
  allocationPercentages,
  currentDate,
  currency,
  hasOtherCurrencyActivity,
}) => {
  const income = calculateCurrentMonthIncome(currentMonthTransactions)
  const essentialExpenses = calculateEssentialExpenses(currentMonthTransactions, categoriesById)
  const flexibleTransactions = calculateFlexibleTransactions(currentMonthTransactions, categoriesById)

  const emergencyFundCommitment = calculateEmergencyFundCommitment({
    emergencyFund,
    plannedMonthlyContribution: emergencyFundPlanned,
    actualMonthlyContribution: emergencyFundActual,
  })
  const investmentCommitment = calculateInvestmentCommitment({ plans: investmentPlans, contributions: investmentContributions, currentDate })
  const goalCommitment = calculateGoalCommitment(decoratedGoals)
  const subscriptionCommitment = calculateSubscriptionCommitment(subscriptions, monthRange, currency)
  const recurringCommitment = calculateRecurringCommitment(recurringTransactions, monthRange, currency)

  const commitments = [
    { key: 'emergency_fund', title: 'Emergency Fund', route: '/emergency-fund', ...emergencyFundCommitment },
    { key: 'investments', title: 'Investments / SIP', route: '/investments', ...investmentCommitment },
    { key: 'goals', title: 'Goals', route: '/goals', ...goalCommitment },
    { key: 'subscriptions', title: 'Subscriptions', route: '/subscriptions', ...subscriptionCommitment },
    { key: 'recurring', title: 'Recurring commitments', route: '/recurring-transactions', ...recurringCommitment },
  ]

  const committedAmount = calculateCommittedAmount(commitments)
  const safeToSpendRaw = calculateSafeToSpend({ income, essentialExpenses, committedAmount })
  const availableAmount = Math.max(0, safeToSpendRaw)
  const overCommittedAmount = calculateOverCommittedAmount(safeToSpendRaw)

  const allocationTotalPercentage = calculateAllocationTotalPercentage(allocationPercentages)
  const flexibleAllocation = calculateFlexibleAllocation(availableAmount, allocationPercentages)
  const flexibleSpentByGroup = calculateFlexibleSpending(flexibleTransactions, categoriesById)

  const categories = FLEXIBLE_CATEGORY_KEYS.map((key) => {
    const allocated = flexibleAllocation[key] ?? 0
    const spent = flexibleSpentByGroup[key] ?? 0
    return {
      key,
      allocated,
      spent,
      remaining: calculateAllocationRemaining(allocated, spent),
      status: calculateAllocationStatus(allocated, spent),
    }
  })

  // Spending that landed in a bucket the user chose not to fund (0%
  // allocated) — surfaced separately rather than silently folded into a
  // category's "over allocation" figure.
  const unallocatedSpending = categories.filter((category) => category.allocated <= 0).reduce((sum, category) => sum + category.spent, 0)
  const unallocatedPercentage = Math.max(0, 100 - allocationTotalPercentage)
  const unallocatedAmount = (availableAmount * unallocatedPercentage) / 100

  return {
    currency,
    hasIncome: income > 0,
    income,
    essentialExpenses,
    commitments,
    committedAmount,
    hasCommitments: commitments.some((commitment) => commitment.amount > 0),
    safeToSpendRaw,
    availableAmount,
    overCommittedAmount,
    isOverCommitted: overCommittedAmount > 0,
    allocationTotalPercentage,
    allocationExceeds100: allocationTotalPercentage > 100,
    unallocatedPercentage,
    unallocatedAmount,
    categories,
    unallocatedSpending,
    hasFlexibleSpending: flexibleTransactions.length > 0,
    hasOtherCurrencyActivity,
  }
}
