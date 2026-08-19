import { addMonths, format } from 'date-fns'
import { getMonthBuckets } from './dateRange'
import { calculateMonthlySpendingTrend } from './spendingTrends'
import { FI_MAX_PROJECTION_MONTHS } from '../../constants/financialFreedom'

// Average monthly total/essential/discretionary spending across up to
// `completedMonths` completed months (current month always excluded).
// Reuses calculateMonthlySpendingTrend — same approach as
// emergencyFund.js's calculateEssentialMonthlyAverage — rather than
// re-deriving per-month totals.
export const calculateAverageMonthlySpending = (transactions, categoriesById, completedMonths) => {
  const buckets = getMonthBuckets(completedMonths + 1)
  const trend = calculateMonthlySpendingTrend(transactions, categoriesById, buckets)
  const completed = trend.filter((month) => !month.isCurrentMonth).slice(-completedMonths)

  if (completed.length === 0) {
    return { average: null, essentialAverage: null, discretionaryAverage: null, monthsUsed: 0 }
  }

  const monthsUsed = completed.length
  return {
    average: completed.reduce((sum, month) => sum + month.total, 0) / monthsUsed,
    essentialAverage: completed.reduce((sum, month) => sum + month.essential, 0) / monthsUsed,
    discretionaryAverage: completed.reduce((sum, month) => sum + month.discretionary, 0) / monthsUsed,
    monthsUsed,
  }
}

export const calculateEstimatedAnnualSpending = (averageMonthlySpending) => {
  if (averageMonthlySpending === null || averageMonthlySpending === undefined) return null
  return averageMonthlySpending * 12
}

export const calculateFITarget = (estimatedAnnualSpending, fiMultiplier) => {
  if (estimatedAnnualSpending === null || estimatedAnnualSpending === undefined) return null
  return estimatedAnnualSpending * fiMultiplier
}

// null (not a fake percentage) when there's no target yet.
export const calculateFIProgress = (currentAssets, fiTarget) => {
  if (fiTarget === null || fiTarget === undefined || fiTarget <= 0) return null
  return Math.min(100, Math.max(0, (currentAssets / fiTarget) * 100))
}

// Floored at 0 — "target reached" is a separate signal, never negative.
export const calculateFIGap = (fiTarget, currentAssets) => {
  if (fiTarget === null || fiTarget === undefined) return null
  return Math.max(0, fiTarget - currentAssets)
}

export const calculateEstimatedTargetDate = (months) => {
  if (months === null || months === undefined) return null
  return format(addMonths(new Date(), months), 'MMMM yyyy')
}

// Monthly-compounding projection: assets = assets*(1+monthlyRate) + contribution,
// repeated until assets >= target or the 100-year horizon is exhausted.
// Returns null when the target is already unreachable under these
// assumptions (zero contribution AND zero return, target not yet met) or
// isn't reached within the horizon. Never loops unbounded.
export const calculateProjection = (currentAssets, monthlyContribution, annualReturnPercent, fiTarget) => {
  const target = Number(fiTarget)
  const assetsStart = Number(currentAssets)

  if (!Number.isFinite(target) || target <= 0) return null
  if (!Number.isFinite(assetsStart)) return null

  if (assetsStart >= target) {
    return { months: 0, years: 0, estimatedTargetDate: calculateEstimatedTargetDate(0) }
  }

  const contribution = Math.max(0, Number(monthlyContribution) || 0)
  const monthlyRate = Math.max(0, Number(annualReturnPercent) || 0) / 100 / 12

  if (contribution <= 0 && monthlyRate <= 0) return null

  let assets = assetsStart
  for (let month = 1; month <= FI_MAX_PROJECTION_MONTHS; month += 1) {
    assets = assets * (1 + monthlyRate) + contribution
    if (assets >= target) {
      return { months: month, years: month / 12, estimatedTargetDate: calculateEstimatedTargetDate(month) }
    }
  }

  return null
}

// Scales the base contribution by a multiplier (e.g. 1.2 for "+20%") and
// reuses calculateProjection — no duplicated compounding loop.
export const calculateScenarioProjection = (currentAssets, baseMonthlyContribution, multiplier, annualReturnPercent, fiTarget) => {
  const scenarioContribution = Math.max(0, Number(baseMonthlyContribution) || 0) * multiplier
  return calculateProjection(currentAssets, scenarioContribution, annualReturnPercent, fiTarget)
}

// "What if I reduce discretionary spending by X%?" — the freed-up amount is
// added to the base contribution for this scenario only. Never touches
// actual transaction/category data.
export const calculateDiscretionaryReductionScenario = (discretionaryAverage, reductionPercent, baseMonthlyContribution) => {
  const discretionary = Number(discretionaryAverage) || 0
  const savingsImprovement = discretionary * (reductionPercent / 100)
  const scenarioContribution = Math.max(0, Number(baseMonthlyContribution) || 0) + savingsImprovement
  return { savingsImprovement, scenarioContribution }
}

// Deterministic, non-promissory observations — formatCurrency is injected
// (not imported) to keep this function pure/testable, same pattern as
// actionCenter.js and goals.js.
export const getFinancialFreedomInsights = ({ savingsRate, discretionaryAverage, fiProgress, currency }, formatCurrency) => {
  const insights = []

  if (savingsRate !== null && savingsRate !== undefined) {
    insights.push(`Your current savings rate is ${savingsRate.toFixed(0)}%.`)
  }

  if (discretionaryAverage > 0) {
    const improvement = discretionaryAverage * 0.2
    insights.push(
      `Reducing discretionary spending by 20% could increase your monthly savings by ${formatCurrency(improvement, currency)} in this scenario.`,
    )
  }

  if (fiProgress !== null && fiProgress !== undefined) {
    insights.push(`Your current FI assets represent ${fiProgress.toFixed(0)}% of your estimated target.`)
  }

  if (insights.length > 0) {
    insights.push('Your FI target is mainly driven by your average monthly spending.')
  }

  return insights.slice(0, 4)
}
