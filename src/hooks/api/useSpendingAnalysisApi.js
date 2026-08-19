import { useAccountsQuery } from './useAccountApi'
import { useCategoriesQuery } from './useCategoryApi'
import { useTransactionsQuery } from './useTransactionApi'

// Composes existing query hooks for the analysis window — no new Supabase
// service. Expense-only is filtered server-side via the existing
// transaction service filter, so transfers/income never even reach the
// calculation layer.
export const useSpendingAnalysisData = (dateRange) => {
  const accountsQuery = useAccountsQuery()
  const categoriesQuery = useCategoriesQuery({})
  const transactionsQuery = useTransactionsQuery({
    type: 'expense',
    fromDate: dateRange.start,
    toDate: dateRange.end,
  })

  return {
    accounts: accountsQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    transactions: transactionsQuery.data ?? [],
    isLoading: accountsQuery.isLoading || categoriesQuery.isLoading || transactionsQuery.isLoading,
    isError: accountsQuery.isError || categoriesQuery.isError || transactionsQuery.isError,
    refetch: () => {
      accountsQuery.refetch()
      categoriesQuery.refetch()
      transactionsQuery.refetch()
    },
  }
}
