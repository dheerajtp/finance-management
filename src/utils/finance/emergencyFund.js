import { addMonths, format } from 'date-fns'
import { getMonthBuckets } from './dateRange'
import { calculateMonthlySpendingTrend } from './spendingTrends'

// Average essential-expense spend across up to `completedMonths` completed
// months immediately preceding the current month. The current month is
// always excluded (still in progress) — one extra bucket is fetched so
// filtering it out still leaves the full completed-months window. Reuses
// calculateMonthlySpendingTrend (which itself reuses calculateSpendingBreakdown)
// instead of re-deriving essential-expense totals per month.
export const calculateEssentialMonthlyAverage = (transactions, categoriesById, completedMonths) => {
  const buckets = getMonthBuckets(completedMonths + 1)
  const trend = calculateMonthlySpendingTrend(transactions, categoriesById, buckets)
  const completed = trend.filter((month) => !month.isCurrentMonth).slice(-completedMonths)

  if (completed.length === 0) {
    return { average: null, monthsUsed: 0, monthlyValues: [] }
  }

  return {
    average: completed.reduce((sum, month) => sum + month.essential, 0) / completed.length,
    monthsUsed: completed.length,
    monthlyValues: completed.map((month) => ({ month: month.month, label: month.label, essential: month.essential })),
  }
}

export const calculateEmergencyFundTarget = (essentialMonthlyAverage, targetMonths) => {
  if (essentialMonthlyAverage === null || essentialMonthlyAverage === undefined) return null
  return essentialMonthlyAverage * targetMonths
}

// null (not a misleading 0%/100%) when there's no target yet.
export const calculateEmergencyFundProgress = (current, target) => {
  if (target === null || target === undefined || target <= 0) return null
  return Math.min(100, Math.max(0, (current / target) * 100))
}

// Never negative — once current >= target, remaining is 0 ("target reached"
// is a separate signal, not a negative remaining amount).
export const calculateEmergencyFundRemaining = (current, target) => {
  if (target === null || target === undefined) return null
  return Math.max(0, target - current)
}

// null = "no contribution set, can't estimate"; 0 = "already there".
export const calculateContributionMonths = (remaining, monthlyContribution) => {
  if (remaining === null || remaining === undefined || remaining <= 0) return 0
  if (!monthlyContribution || monthlyContribution <= 0) return null
  return Math.ceil(remaining / monthlyContribution)
}

// "Estimated" — never framed as guaranteed.
export const calculateEstimatedCompletionDate = (contributionMonths) => {
  if (contributionMonths === null || contributionMonths === undefined || contributionMonths <= 0) return null
  return format(addMonths(new Date(), contributionMonths), 'MMMM yyyy')
}

export const getEmergencyFundStatus = ({ monthsUsed, requiredMonths, hasCurrentBalance, progress }) => {
  if (monthsUsed === 0) return 'no_data'
  if (monthsUsed < requiredMonths || !hasCurrentBalance) return 'insufficient_history'
  if (progress >= 100) return 'target_reached'
  if (progress >= 75) return 'strong'
  if (progress >= 50) return 'halfway'
  if (progress >= 25) return 'building'
  return 'getting_started'
}
