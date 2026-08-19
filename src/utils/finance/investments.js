import { parseISO, format, addMonths, addQuarters, addYears, getDaysInMonth, getDate, setDate, isAfter } from 'date-fns'

// All pure — no Supabase, no Date.now()/new Date() defaults (today is
// always passed in by the caller). current_value is never derived here:
// this app has no market-price feed, so a holding's value is exactly what
// the user last entered (see 0016 migration notes) and these functions
// only ever do arithmetic on numbers already given to them.

const DATE_FORMAT = 'yyyy-MM-dd'
const MAX_OCCURRENCE_ITERATIONS = 1200 // ~100 years of monthly steps — a hard ceiling, not an expected case.

const ADD_BY_FREQUENCY = { monthly: addMonths, quarterly: addQuarters, yearly: addYears }

const toAmount = (value) => Number(value) || 0

export const calculateInvestmentGain = (investedAmount, currentValue) => toAmount(currentValue) - toAmount(investedAmount)

// null (not 0%) when there's nothing invested yet — a gain percentage on
// zero invested is meaningless, not zero.
export const calculateInvestmentGainPercentage = (investedAmount, gain) => {
  const invested = toAmount(investedAmount)
  if (invested <= 0) return null
  return (Number(gain) || 0) / invested * 100
}

// Every calculateTotal*/allocation function below expects an
// already-single-currency slice (the caller groups by currency first —
// same convention as accountSummary.js/netWorth.js) so nothing here ever
// sums across currencies.
export const calculateTotalInvested = (holdings) => holdings.reduce((sum, holding) => sum + toAmount(holding.invested_amount), 0)

export const calculateTotalCurrentValue = (holdings) => holdings.reduce((sum, holding) => sum + toAmount(holding.current_value), 0)

export const calculateTotalGain = (holdings) =>
  holdings.reduce((sum, holding) => sum + calculateInvestmentGain(holding.invested_amount, holding.current_value), 0)

// Current-value share per investment type — e.g. "60% mutual funds, 25%
// stocks, 15% gold". Types with nothing in this currency are simply absent
// rather than shown at 0%.
export const calculateInvestmentAllocation = (holdings) => {
  const totalValue = calculateTotalCurrentValue(holdings)
  const byType = new Map()

  holdings.forEach((holding) => {
    const value = toAmount(holding.current_value)
    byType.set(holding.type, (byType.get(holding.type) ?? 0) + value)
  })

  return Array.from(byType.entries()).map(([type, value]) => ({
    type,
    value,
    percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
  }))
}

// Only 'completed' contributions represent money that actually moved —
// a 'skipped' row is a record that a period was deliberately NOT funded,
// so it must never inflate a contribution total.
export const calculateContributionTotal = (contributions) =>
  contributions
    .filter((contribution) => contribution.status === 'completed')
    .reduce((sum, contribution) => sum + toAmount(contribution.amount), 0)

// null (not 0%) when there's no income to compare against — never a
// divide-by-zero.
export const calculateInvestmentRate = (investedAmount, income) => {
  const incomeAmount = toAmount(income)
  if (incomeAmount <= 0) return null
  return (toAmount(investedAmount) / incomeAmount) * 100
}

// Clamps a target day-of-month to the last valid day of that month (e.g.
// day 31 in February becomes 28/29) — date-fns' plain setDate would
// otherwise roll over into the next month instead of stopping at month-end.
const clampToMonth = (monthDate, day) => setDate(monthDate, Math.min(day, getDaysInMonth(monthDate)))

const stepOccurrence = (occurrenceDate, frequency, contributionDay) => {
  const addFn = ADD_BY_FREQUENCY[frequency]
  const stepped = addFn(occurrenceDate, 1)
  return contributionDay ? clampToMonth(stepped, contributionDay) : stepped
}

// The most recent scheduled occurrence that is on or before `today` (or the
// very first occurrence, if the plan hasn't started producing occurrences
// yet). Considers only start_date/frequency/contribution_day — this is
// pure calendar math, independent of which contributions actually exist;
// see calculateContributionStatus for the "was it actually recorded" check.
export const calculateExpectedContributionDate = (plan, today) => {
  const addFn = ADD_BY_FREQUENCY[plan.frequency]
  if (!addFn) return null

  const startDate = parseISO(plan.start_date)
  let occurrence = plan.contribution_day ? clampToMonth(startDate, plan.contribution_day) : startDate

  if (isAfter(occurrence, today)) return format(occurrence, DATE_FORMAT)

  let iterations = 0
  let next = stepOccurrence(occurrence, plan.frequency, plan.contribution_day)
  while (!isAfter(next, today) && iterations < MAX_OCCURRENCE_ITERATIONS) {
    occurrence = next
    next = stepOccurrence(occurrence, plan.frequency, plan.contribution_day)
    iterations += 1
  }

  return format(occurrence, DATE_FORMAT)
}

// One period forward from a given (already-ISO-string) occurrence date —
// used both to preview "what's next" and, once a contribution against the
// current occurrence is recorded, as the basis for the next one.
export const calculateNextContributionDate = (occurrenceDate, frequency, contributionDay) => {
  const parsed = parseISO(occurrenceDate)
  const day = contributionDay ?? getDate(parsed)
  return format(stepOccurrence(parsed, frequency, day), DATE_FORMAT)
}

// `contributions` should already be filtered to this one plan (same
// pre-filtered-input convention as calculateBudgetSpent etc.). Returns one
// of: paused | ended | completed | overdue | due | active — "completed"
// here means "the current occurrence has a recorded contribution or was
// explicitly skipped," not "this plan has finished forever."
// Display-only decoration (account name, gain/gain%, monthly SIP total) —
// kept here rather than inline in useActionInvestments, same
// calculations-live-in-utils/finance convention as accountSummary.js.
// `plans` should already be pre-filtered to what the caller wants counted
// (e.g. active only).
export const decorateHoldings = (holdings, accountsById, plans) =>
  holdings.map((holding) => {
    const gain = calculateInvestmentGain(holding.invested_amount, holding.current_value)
    return {
      ...holding,
      accountName: accountsById[holding.account_id]?.name ?? 'Unknown account',
      gain,
      gainPercentage: calculateInvestmentGainPercentage(holding.invested_amount, gain),
      monthlySip: plans
        .filter((plan) => plan.holding_id === holding.id && plan.frequency === 'monthly')
        .reduce((sum, plan) => sum + toAmount(plan.amount), 0),
    }
  })

// One overview group per currency — never combined, same no-cross-currency-
// mixing rule as accountSummary.js/netWorth.js. `holdings` is expected
// pre-filtered to active-only by the caller.
export const buildInvestmentOverviewByCurrency = ({ holdings, plans, contributions, monthlyIncomeTransactions, accountsById, monthRange }) => {
  const groups = new Map()
  holdings.forEach((holding) => {
    if (!groups.has(holding.currency)) groups.set(holding.currency, [])
    groups.get(holding.currency).push(holding)
  })

  return Array.from(groups.entries()).map(([currency, currencyHoldings]) => {
    const invested = calculateTotalInvested(currencyHoldings)
    const currentValue = calculateTotalCurrentValue(currencyHoldings)
    const gain = calculateTotalGain(currencyHoldings)
    const monthlySip = plans
      .filter((plan) => plan.frequency === 'monthly' && currencyHoldings.some((holding) => holding.id === plan.holding_id))
      .reduce((sum, plan) => sum + toAmount(plan.amount), 0)

    const monthlyIncome = monthlyIncomeTransactions
      .filter((transaction) => accountsById[transaction.account_id]?.currency === currency)
      .reduce((sum, transaction) => sum + toAmount(transaction.amount), 0)
    const monthlyContributions = contributions
      .filter((contribution) => contribution.currency === currency)
      .filter((contribution) => contribution.contribution_date >= monthRange.start && contribution.contribution_date <= monthRange.end)

    return {
      currency,
      invested,
      currentValue,
      gain,
      gainPercentage: calculateInvestmentGainPercentage(invested, gain),
      allocation: calculateInvestmentAllocation(currencyHoldings),
      monthlySip,
      investmentRate: calculateInvestmentRate(calculateContributionTotal(monthlyContributions), monthlyIncome),
    }
  })
}

export const calculateContributionStatus = (plan, contributions, today) => {
  if (!plan.is_active) return 'paused'

  const expectedDate = calculateExpectedContributionDate(plan, today)
  if (plan.end_date && expectedDate > plan.end_date) return 'ended'

  const nextDate = calculateNextContributionDate(expectedDate, plan.frequency, plan.contribution_day)
  const fulfilled = contributions.some(
    (contribution) => contribution.contribution_date >= expectedDate && contribution.contribution_date < nextDate,
  )
  if (fulfilled) return 'completed'

  if (expectedDate < format(today, DATE_FORMAT)) return 'overdue'
  if (expectedDate === format(today, DATE_FORMAT)) return 'due'
  return 'active'
}
