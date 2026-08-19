// Splits a (single-currency) transaction slice's expenses into essential,
// discretionary, and uncategorized. A missing/invalid category is never
// guessed into essential or discretionary — it's reported separately so it
// can't silently skew the classification.
export const calculateSpendingBreakdown = (transactions, categoriesById) => {
  const totals = { essential: 0, discretionary: 0, uncategorized: 0 }

  transactions
    .filter((transaction) => transaction.type === 'expense')
    .forEach((transaction) => {
      const amount = Number(transaction.amount) || 0
      const category = transaction.category_id ? categoriesById[transaction.category_id] : null

      if (!category) {
        totals.uncategorized += amount
      } else if (category.is_essential) {
        totals.essential += amount
      } else {
        totals.discretionary += amount
      }
    })

  const total = totals.essential + totals.discretionary + totals.uncategorized
  const percentageOf = (value) => (total > 0 ? (value / total) * 100 : 0)

  return {
    ...totals,
    total,
    essentialPercentage: percentageOf(totals.essential),
    discretionaryPercentage: percentageOf(totals.discretionary),
    uncategorizedPercentage: percentageOf(totals.uncategorized),
  }
}
