import { calculateTopCategories } from './topCategories'

// Extends calculateTopCategories (rank/amount/percentage) with transaction
// count and a monthly average — reuses its grouping/sorting/limiting instead
// of re-deriving it.
export const calculateCategorySpending = (transactions, categoriesById, totalExpenses, monthCount, limit = 10) => {
  const ranked = calculateTopCategories(transactions, categoriesById, totalExpenses, limit)

  const countsByCategory = new Map()
  transactions
    .filter((transaction) => transaction.type === 'expense' && transaction.category_id)
    .forEach((transaction) => {
      countsByCategory.set(transaction.category_id, (countsByCategory.get(transaction.category_id) ?? 0) + 1)
    })

  return ranked.map((entry) => ({
    ...entry,
    categoryName: entry.name,
    transactionCount: countsByCategory.get(entry.categoryId) ?? 0,
    monthlyAverage: monthCount > 0 ? entry.amount / monthCount : 0,
  }))
}
