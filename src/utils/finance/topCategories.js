// Top N expense categories by amount for a (single-currency) transaction
// slice. `totalExpenses` is passed in (from calculateSpendingBreakdown)
// rather than recomputed, so "percentage" always means the same thing here
// as it does in the spending breakdown — share of total expenses, not just
// share of categorized expenses.
export const calculateTopCategories = (transactions, categoriesById, totalExpenses, limit = 5) => {
  const totalsByCategory = new Map()

  transactions
    .filter((transaction) => transaction.type === 'expense' && transaction.category_id)
    .forEach((transaction) => {
      const amount = Number(transaction.amount) || 0
      totalsByCategory.set(transaction.category_id, (totalsByCategory.get(transaction.category_id) ?? 0) + amount)
    })

  return Array.from(totalsByCategory.entries())
    .map(([categoryId, amount]) => ({
      categoryId,
      name: categoriesById[categoryId]?.name ?? 'Uncategorized',
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}
