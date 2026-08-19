// Groups transactions by their account's currency and sums income/expenses
// within each group — same no-cross-currency-mixing rule as accountSummary.js.
// Transfers and investment contributions are never income or spending, so
// they never contribute to income/expenses/net — "net" keeps meaning
// income - expenses exactly as before Task 22.
export const summarizeTransactions = (transactions, accountsById) => {
  const groups = new Map()

  transactions.forEach((transaction) => {
    if (transaction.type === 'transfer') return

    const currency = accountsById[transaction.account_id]?.currency ?? 'N/A'
    const amount = Number(transaction.amount) || 0

    if (!groups.has(currency)) {
      groups.set(currency, { currency, income: 0, expenses: 0, invested: 0 })
    }
    const group = groups.get(currency)

    if (transaction.type === 'income') {
      group.income += amount
    } else if (transaction.type === 'expense') {
      group.expenses += amount
    } else if (transaction.type === 'investment') {
      group.invested += amount
    }
  })

  return Array.from(groups.values()).map((group) => {
    const net = group.income - group.expenses
    return {
      ...group,
      net,
      netAfterExpenses: net,
      cashRetainedAfterInvestments: net - group.invested,
      investmentRate: group.income > 0 ? (group.invested / group.income) * 100 : null,
    }
  })
}

// Splits transactions into buckets keyed by their account's currency, without
// summing — used when a caller needs the raw per-currency transaction lists
// (e.g. the dashboard picking one "primary" currency to run further
// calculations against, rather than mixing currencies together).
export const groupTransactionsByCurrency = (transactions, accountsById) => {
  const groups = new Map()

  transactions.forEach((transaction) => {
    const currency = accountsById[transaction.account_id]?.currency ?? 'N/A'
    if (!groups.has(currency)) groups.set(currency, [])
    groups.get(currency).push(transaction)
  })

  return groups
}
