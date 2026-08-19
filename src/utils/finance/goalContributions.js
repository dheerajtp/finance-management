import { parseISO, format } from 'date-fns'

// Every total in this file is built from a plain sum, never a running
// balance — so there's nothing here that can produce NaN/Infinity as long
// as callers pass finite numbers in (guarded below with `Number(...) || 0`
// at every read). All percentages are clamped to 0–100 for display; the
// underlying amounts are never clamped, so an over-target contribution is
// never hidden (see calculateGoalContributionSummary's `remaining`/`status`).

const toFiniteAmount = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const sumAmounts = (items) => (Array.isArray(items) ? items : []).reduce((sum, item) => sum + toFiniteAmount(item?.amount), 0)

export const calculateGoalContributionTotal = (contributions) => sumAmounts(contributions)

export const calculateGoalRemainingAfterContributions = (targetAmount, totalContributed) =>
  Math.max(0, toFiniteAmount(targetAmount) - toFiniteAmount(totalContributed))

export const calculateGoalProgressFromContributions = (targetAmount, totalContributed) => {
  const target = toFiniteAmount(targetAmount)
  if (target <= 0) return 0
  return Math.min(100, Math.max(0, (toFiniteAmount(totalContributed) / target) * 100))
}

// Share of the goal's total that one contribution represents — purely
// informational (e.g. "this was 15% of what you've put in so far").
export const calculateGoalContributionPercentage = (contributionAmount, totalContributed) => {
  const total = toFiniteAmount(totalContributed)
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, (toFiniteAmount(contributionAmount) / total) * 100))
}

export const calculateTransactionAllocatedAmount = (allocations) => sumAmounts(allocations)

export const calculateTransactionUnallocatedAmount = (transactionAmount, allocatedAmount) =>
  Math.max(0, toFiniteAmount(transactionAmount) - toFiniteAmount(allocatedAmount))

// Count of distinct calendar months touched by a contribution list —
// the denominator for the monthly average, not a running total.
export const calculateContributionMonths = (contributions) => {
  if (!Array.isArray(contributions) || contributions.length === 0) return 0
  const months = new Set(
    contributions.filter((item) => item?.contribution_date).map((item) => format(parseISO(item.contribution_date), 'yyyy-MM')),
  )
  return months.size
}

export const calculateAverageMonthlyContribution = (contributions) => {
  const months = calculateContributionMonths(contributions)
  if (months === 0) return 0
  return calculateGoalContributionTotal(contributions) / months
}

// Guards against accidentally mixing currencies at the calculation layer
// (a goal only ever has one currency, but a caller could still pass a mixed
// list by mistake) — only entries matching `currency` are summed/counted;
// mismatched entries are silently excluded here, never combined.
export const calculateContributionSummary = (contributions, targetAmount, currency) => {
  const items = (Array.isArray(contributions) ? contributions : []).filter(
    (item) => !currency || item?.currency === currency,
  )

  const total = calculateGoalContributionTotal(items)
  const sorted = [...items].sort((a, b) => (b.contribution_date ?? '').localeCompare(a.contribution_date ?? ''))

  return {
    total,
    remaining: calculateGoalRemainingAfterContributions(targetAmount, total),
    progress: calculateGoalProgressFromContributions(targetAmount, total),
    count: items.length,
    lastContributionDate: sorted[0]?.contribution_date ?? null,
    averageMonthly: calculateAverageMonthlyContribution(items),
    status: toFiniteAmount(targetAmount) > 0 && total >= toFiniteAmount(targetAmount) ? 'target_reached' : 'in_progress',
  }
}
