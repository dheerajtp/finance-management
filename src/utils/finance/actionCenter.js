// Deterministic rules only — no AI, nothing fabricated. Every signal here
// comes from a calculation another feature page already performs (spending
// breakdown, recurring transaction status, emergency fund/budget/goal
// progress) — this file only turns "what's already true" into a sentence
// and orders it.
//
// Priority (highest first, per task spec): missing essential setup →
// due/overdue recurring transactions → emergency fund issues → budget
// attention → spending patterns → goal progress. Pushed in that order so a
// plain slice(0, 5) always keeps the most important ones.
export const getFinancialActions = (metrics, domains, formatCurrency) => {
  const actions = []

  // 1. Missing essential setup — mutually exclusive (showing both would
  // waste a slot on near-duplicate advice).
  if (!metrics.hasTransactions) {
    actions.push({
      id: 'no_transactions',
      message: 'Add your first transaction to start understanding your spending.',
    })
  } else if (metrics.income === 0) {
    actions.push({
      id: 'no_income',
      message: 'Add your income transactions to understand your monthly cash flow.',
    })
  }

  // 2. Due/overdue recurring transactions.
  if (domains.recurringOverdueCount > 0) {
    actions.push({
      id: 'recurring_overdue',
      message: `You have ${domains.recurringOverdueCount} overdue recurring transaction${domains.recurringOverdueCount === 1 ? '' : 's'}.`,
    })
  } else if (domains.recurringDueCount > 0) {
    actions.push({
      id: 'recurring_due',
      message: `You have ${domains.recurringDueCount} recurring transaction${domains.recurringDueCount === 1 ? '' : 's'} due today.`,
    })
  }

  // 3. Emergency fund issues.
  if (domains.emergencyFundConfigured === false) {
    actions.push({ id: 'no_emergency_fund', message: 'Your emergency fund target is not yet calculated.' })
  }

  // 4. Budget attention.
  if (domains.budgetAttentionCount > 0) {
    actions.push({
      id: 'budget_attention',
      message: `You have ${domains.budgetAttentionCount} budget${domains.budgetAttentionCount === 1 ? '' : 's'} needing attention.`,
    })
  }

  // 5. Spending patterns.
  if (metrics.savingsTarget.hasTarget && metrics.savings < metrics.savingsTarget.target) {
    const shortfall = formatCurrency(metrics.savingsTarget.target - metrics.savings, metrics.currency)
    actions.push({ id: 'below_target', message: `You're below your monthly savings target by ${shortfall}.` })
  }

  if (metrics.income > 0 && metrics.savingsRate !== null && metrics.savingsRate < 10) {
    actions.push({ id: 'low_savings_rate', message: 'Your current savings rate is below 10%.' })
  }

  if (metrics.breakdown.discretionary > metrics.breakdown.essential) {
    actions.push({
      id: 'high_discretionary',
      message: 'Discretionary spending is higher than essential spending this month.',
    })
  }

  if (metrics.breakdown.uncategorized > 0) {
    const amount = formatCurrency(metrics.breakdown.uncategorized, metrics.currency)
    actions.push({
      id: 'uncategorized',
      message: `You have ${amount} of uncategorized spending. Categorize it for better insights.`,
    })
  }

  // 6. Goal progress.
  if (domains.goalsBehindCount > 0) {
    actions.push({
      id: 'goals_behind',
      message: `You have ${domains.goalsBehindCount} goal${domains.goalsBehindCount === 1 ? '' : 's'} behind schedule.`,
    })
  }

  return actions.slice(0, 5)
}
