// Expects a single-currency slice of transactions (the caller groups by
// currency first — see groupTransactionsByCurrency). Transfers are excluded:
// they are never income or spending. Investment contributions are also
// excluded from income/expenses/savings (that meaning — income minus
// expenses — is unchanged by Task 22) but totalled separately as `invested`.
export const calculateMonthlyMetrics = (transactions) => {
  const totals = transactions.reduce(
    (acc, transaction) => {
      const amount = Number(transaction.amount) || 0
      if (transaction.type === 'income') acc.income += amount
      else if (transaction.type === 'expense') acc.expenses += amount
      else if (transaction.type === 'investment') acc.invested += amount
      return acc
    },
    { income: 0, expenses: 0, invested: 0 },
  )

  const savings = totals.income - totals.expenses

  return {
    income: totals.income,
    expenses: totals.expenses,
    invested: totals.invested,
    savings,
    savingsRate: totals.income > 0 ? (savings / totals.income) * 100 : null,
    investmentRate: totals.income > 0 ? (totals.invested / totals.income) * 100 : null,
    cashRetainedAfterInvestments: savings - totals.invested,
  }
}
