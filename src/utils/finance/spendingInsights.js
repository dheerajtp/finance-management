import { calculateCategoryBaseline, calculateConsecutiveIncreaseStreak, isSpendingAboveBaseline } from './spendingTrends'

const CONSECUTIVE_INCREASE_MIN = 3
const UNCATEGORIZED_SIGNIFICANT_PERCENTAGE = 10
const CONCENTRATION_TOP_N = 3
const CONCENTRATION_THRESHOLD_PERCENTAGE = 60
const MAX_INSIGHTS = 5

// Fixed priority order per spec: significant category increase > repeated
// increase > high discretionary > high uncategorized > high concentration.
const PRIORITY = {
  category_above_average: 1,
  category_consecutive_increase: 2,
  discretionary_high: 3,
  uncategorized_significant: 4,
  category_concentration: 5,
}

// Deterministic rules only — no AI, no guaranteed claims. Every message is
// phrased as an observation ("X is above its recent average") rather than an
// instruction ("stop spending on X").
export const detectSpendingSignals = ({ categorySpending, categoryMonthlyTrends, breakdown, currency, formatCurrency }) => {
  const insights = []

  categorySpending.forEach((category) => {
    const trend = categoryMonthlyTrends.find((entry) => entry.categoryId === category.categoryId)
    if (!trend) return

    const currentMonth = trend.months.find((month) => month.isCurrentMonth)
    const baseline = calculateCategoryBaseline(trend.months)

    if (currentMonth && isSpendingAboveBaseline(currentMonth.total, baseline.average)) {
      const amount = currentMonth.total - baseline.average
      insights.push({
        type: 'category_above_average',
        severity: 'warning',
        categoryId: category.categoryId,
        title: category.categoryName,
        message: `${category.categoryName} is ${formatCurrency(amount, currency)} above its recent average.`,
        amount,
        percentageChange: (amount / baseline.average) * 100,
      })
    }

    const streak = calculateConsecutiveIncreaseStreak(trend.months)
    if (streak >= CONSECUTIVE_INCREASE_MIN) {
      insights.push({
        type: 'category_consecutive_increase',
        severity: 'info',
        categoryId: category.categoryId,
        title: category.categoryName,
        message: `${category.categoryName} has increased for ${streak} consecutive months.`,
        amount: null,
        percentageChange: null,
      })
    }
  })

  if (breakdown.total > 0 && breakdown.discretionary > breakdown.essential) {
    insights.push({
      type: 'discretionary_high',
      severity: 'info',
      categoryId: null,
      title: 'Discretionary spending',
      message: `Discretionary spending represents ${breakdown.discretionaryPercentage.toFixed(0)}% of your expenses, higher than essential spending.`,
      amount: breakdown.discretionary,
      percentageChange: breakdown.discretionaryPercentage,
    })
  }

  if (breakdown.uncategorizedPercentage >= UNCATEGORIZED_SIGNIFICANT_PERCENTAGE) {
    insights.push({
      type: 'uncategorized_significant',
      severity: 'warning',
      categoryId: null,
      title: 'Uncategorized spending',
      message: `${formatCurrency(breakdown.uncategorized, currency)} of spending is uncategorized.`,
      amount: breakdown.uncategorized,
      percentageChange: breakdown.uncategorizedPercentage,
    })
  }

  const top3Percentage = categorySpending
    .slice(0, CONCENTRATION_TOP_N)
    .reduce((sum, category) => sum + category.percentage, 0)

  if (categorySpending.length >= CONCENTRATION_TOP_N && top3Percentage > CONCENTRATION_THRESHOLD_PERCENTAGE) {
    insights.push({
      type: 'category_concentration',
      severity: 'neutral',
      categoryId: null,
      title: 'Category concentration',
      message: `Your top ${CONCENTRATION_TOP_N} categories account for ${top3Percentage.toFixed(0)}% of spending.`,
      amount: null,
      percentageChange: top3Percentage,
    })
  }

  return insights.sort((a, b) => PRIORITY[a.type] - PRIORITY[b.type]).slice(0, MAX_INSIGHTS)
}
