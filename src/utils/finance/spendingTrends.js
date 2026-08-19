import { calculateSpendingBreakdown } from './spendingBreakdown'

// "Attention" threshold: current spend must be both >=20% above the recent
// average AND at least this absolute amount higher, so a category jumping
// from ₹100 to ₹125 (technically +25%) never gets flagged. Centralized here
// so every caller (insights engine, tests, future callers) agrees on the
// same rule.
const ATTENTION_PERCENTAGE_MULTIPLIER = 1.2
const ATTENTION_ABSOLUTE_THRESHOLD = 500

export const isSpendingAboveBaseline = (currentAmount, baselineAverage) => {
  if (baselineAverage === null || baselineAverage === undefined || baselineAverage <= 0) return false
  const meetsPercentage = currentAmount > baselineAverage * ATTENTION_PERCENTAGE_MULTIPLIER
  const meetsAbsolute = currentAmount - baselineAverage >= ATTENTION_ABSOLUTE_THRESHOLD
  return meetsPercentage && meetsAbsolute
}

// Per-month essential/discretionary/uncategorized/total for each bucket —
// reuses calculateSpendingBreakdown per month rather than re-summing.
export const calculateMonthlySpendingTrend = (transactions, categoriesById, monthBuckets) => {
  return monthBuckets.map((bucket) => {
    const monthTransactions = transactions.filter(
      (transaction) => transaction.transaction_date >= bucket.start && transaction.transaction_date <= bucket.end,
    )
    const breakdown = calculateSpendingBreakdown(monthTransactions, categoriesById)

    return {
      month: bucket.key,
      label: bucket.label,
      isCurrentMonth: bucket.isCurrentMonth,
      total: breakdown.total,
      essential: breakdown.essential,
      discretionary: breakdown.discretionary,
      uncategorized: breakdown.uncategorized,
    }
  })
}

// Per-month totals for a specific set of categories (kept to a small,
// deliberately-chosen list by the caller — never "every category").
export const calculateCategoryMonthlyTrend = (transactions, monthBuckets, categoryIds) => {
  return categoryIds.map((categoryId) => ({
    categoryId,
    months: monthBuckets.map((bucket) => {
      const total = transactions
        .filter(
          (transaction) =>
            transaction.type === 'expense' &&
            transaction.category_id === categoryId &&
            transaction.transaction_date >= bucket.start &&
            transaction.transaction_date <= bucket.end,
        )
        .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0)

      return { month: bucket.key, label: bucket.label, total, isCurrentMonth: bucket.isCurrentMonth }
    }),
  }))
}

// Average of the completed months immediately preceding the current month
// (up to `baselineMonths`, fewer if that many aren't available). The current
// month is never part of its own baseline — it's still in progress.
export const calculateCategoryBaseline = (categoryMonths, baselineMonths = 3) => {
  const completed = categoryMonths.filter((month) => !month.isCurrentMonth)
  const recent = completed.slice(-baselineMonths)

  if (recent.length === 0) {
    return { average: null, monthsUsed: 0 }
  }

  return {
    average: recent.reduce((sum, month) => sum + month.total, 0) / recent.length,
    monthsUsed: recent.length,
  }
}

// Length of the run of strictly-increasing completed months ending at the
// most recent completed month. The current (in-progress) month is excluded —
// its partial total isn't comparable to a full prior month.
export const calculateConsecutiveIncreaseStreak = (categoryMonths) => {
  const completed = categoryMonths.filter((month) => !month.isCurrentMonth)
  let streak = 0

  for (let i = completed.length - 1; i > 0; i -= 1) {
    if (completed[i].total > completed[i - 1].total) {
      streak += 1
    } else {
      break
    }
  }

  return streak
}
