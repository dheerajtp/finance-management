import { getMonthBuckets } from './dateRange'

// Sums the current month's expense transactions matching a budget's
// category AND currency (a budget only counts transactions in its own
// currency — no cross-currency mixing).
export const calculateBudgetSpent = (currentMonthTransactions, budget, accountsById) => {
  return currentMonthTransactions
    .filter((transaction) => {
      if (transaction.category_id !== budget.category_id) return false
      return accountsById[transaction.account_id]?.currency === budget.currency
    })
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0)
}

// Never a negative "remaining" — once spending exceeds the budget, remaining
// is 0 and the overage is reported separately.
export const calculateBudgetRemaining = (amount, spent) => {
  const diff = amount - spent
  return { remaining: Math.max(0, diff), overBy: Math.max(0, -diff) }
}

// Clamped 0–100 for the visual bar — actual spent/amount/overage are shown
// separately by the caller so the overage is never hidden.
export const calculateBudgetProgress = (amount, spent) => {
  if (!amount || amount <= 0) return 0
  return Math.min(100, Math.max(0, (spent / amount) * 100))
}

export const getBudgetStatus = (amount, spent) => {
  if (spent === 0) return 'no_spending'
  if (spent > amount) return 'over_budget'
  const percentage = (spent / amount) * 100
  if (percentage >= 90) return 'near_limit'
  if (percentage >= 75) return 'attention'
  return 'on_track'
}

// Deterministic, non-alarming — a UI label, not financial advice.
export const getBudgetMessage = (status, amount, spent, currency, formatCurrency) => {
  switch (status) {
    case 'no_spending':
      return 'No spending recorded this month.'
    case 'over_budget':
      return `${formatCurrency(spent - amount, currency)} over this month's budget.`
    case 'near_limit':
      return "You're close to this month's budget limit."
    case 'attention':
      return `${Math.round((spent / amount) * 100)}% of this month's budget has been used.`
    case 'on_track':
      return `${formatCurrency(amount - spent, currency)} remaining this month.`
    default:
      return ''
  }
}

// Average monthly spend for one category+currency over up to
// `completedMonths` completed months (current month always excluded).
// Expects a transaction list already covering at least that window.
export const calculateCategoryAverage = (transactions, categoryId, currency, accountsById, completedMonths = 3) => {
  const buckets = getMonthBuckets(completedMonths + 1)
    .filter((bucket) => !bucket.isCurrentMonth)
    .slice(-completedMonths)

  const monthlyValues = buckets.map((bucket) => {
    const total = transactions
      .filter(
        (transaction) =>
          transaction.type === 'expense' &&
          transaction.category_id === categoryId &&
          transaction.transaction_date >= bucket.start &&
          transaction.transaction_date <= bucket.end &&
          accountsById[transaction.account_id]?.currency === currency,
      )
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0)
    return { month: bucket.key, label: bucket.label, total }
  })

  if (monthlyValues.length === 0) {
    return { average: null, monthsUsed: 0, monthlyValues: [] }
  }

  return {
    average: monthlyValues.reduce((sum, month) => sum + month.total, 0) / monthlyValues.length,
    monthsUsed: monthlyValues.length,
    monthlyValues,
  }
}

// Monetary totals grouped by currency (never combined); over/near-limit
// counts may be combined across currencies since they're just counts.
// Expects budgets already decorated with spent/remaining/status.
export const calculateBudgetSummary = (decoratedBudgets) => {
  const activeBudgets = decoratedBudgets.filter((budget) => budget.is_active)

  const totalsByCurrency = new Map()
  activeBudgets.forEach((budget) => {
    if (!totalsByCurrency.has(budget.currency)) {
      totalsByCurrency.set(budget.currency, {
        currency: budget.currency,
        totalBudgeted: 0,
        totalSpent: 0,
        totalRemaining: 0,
      })
    }
    const group = totalsByCurrency.get(budget.currency)
    group.totalBudgeted += budget.amount
    group.totalSpent += budget.spent
    group.totalRemaining += budget.remaining
  })

  return {
    totalsByCurrency: Array.from(totalsByCurrency.values()),
    overBudgetCount: activeBudgets.filter((budget) => budget.status === 'over_budget').length,
    nearLimitCount: activeBudgets.filter((budget) => budget.status === 'near_limit').length,
  }
}

const STATUS_SORT_WEIGHT = { over_budget: 0, near_limit: 1, attention: 2, on_track: 3, no_spending: 4 }

// 1. over budget, 2. near limit, 3. attention, 4. on track, 5. no spending.
// Within the same status: highest percentage used first.
export const sortBudgets = (decoratedBudgets) => {
  const percentageOf = (budget) => (budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0)
  return [...decoratedBudgets].sort((a, b) => {
    const statusDiff = (STATUS_SORT_WEIGHT[a.status] ?? 99) - (STATUS_SORT_WEIGHT[b.status] ?? 99)
    if (statusDiff !== 0) return statusDiff
    return percentageOf(b) - percentageOf(a)
  })
}
