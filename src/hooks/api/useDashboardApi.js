import { useAccountsQuery } from './useAccountApi'
import { useCategoriesQuery } from './useCategoryApi'
import { useTransactionsQuery } from './useTransactionApi'
import { useRecurringTransactionsQuery } from './useRecurringTransactionApi'
import { useSubscriptionsQuery } from './useSubscriptionApi'
import { useInvestmentPlansQuery } from './useInvestmentPlanApi'
import { useInvestmentContributionsQuery } from './useInvestmentContributionApi'

// Composes the existing account/category/transaction query hooks for the
// selected period — no new Supabase access, just a single data source for
// useActionDashboard to consume. Profile is intentionally left out: it's
// already available via useActionAuth, and fetching it again here would
// duplicate that query within the same hook tree.
export const useDashboardData = (dateRange) => {
  const accountsQuery = useAccountsQuery()
  const categoriesQuery = useCategoriesQuery({})
  const transactionsQuery = useTransactionsQuery({ fromDate: dateRange.start, toDate: dateRange.end })
  // The 5 most recent transactions overall (not period-filtered — "recent"
  // stays recent regardless of the period selector) doubles as the cheap
  // "has this user ever recorded anything" existence check, so there's only
  // one extra query here instead of two.
  const recentTransactionsQuery = useTransactionsQuery({ limit: 5 })

  return {
    accounts: accountsQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    transactions: transactionsQuery.data ?? [],
    recentTransactions: recentTransactionsQuery.data ?? [],
    hasEverHadTransactions: (recentTransactionsQuery.data ?? []).length > 0,
    isLoading:
      accountsQuery.isLoading ||
      categoriesQuery.isLoading ||
      transactionsQuery.isLoading ||
      recentTransactionsQuery.isLoading,
    isError:
      accountsQuery.isError || categoriesQuery.isError || transactionsQuery.isError || recentTransactionsQuery.isError,
    refetch: () => {
      accountsQuery.refetch()
      categoriesQuery.refetch()
      transactionsQuery.refetch()
      recentTransactionsQuery.refetch()
    },
  }
}

// Lightweight "what's coming up" data source for the dashboard — active
// recurring transactions and active subscriptions only, the same query
// hooks their own pages already use. No occurrence math happens here; see
// useActionDashboardCommitments for that.
export const useDashboardCommitmentsData = () => {
  const recurringQuery = useRecurringTransactionsQuery({ isActive: true })
  const subscriptionsQuery = useSubscriptionsQuery({ isActive: true })
  const investmentPlansQuery = useInvestmentPlansQuery({ isActive: true })
  // Needed to tell "due" apart from "already recorded" — see
  // calculateContributionStatus in utils/finance/investments.js.
  const investmentContributionsQuery = useInvestmentContributionsQuery({})

  return {
    recurringTransactions: recurringQuery.data ?? [],
    subscriptions: subscriptionsQuery.data ?? [],
    investmentPlans: investmentPlansQuery.data ?? [],
    investmentContributions: investmentContributionsQuery.data ?? [],
    isLoading: recurringQuery.isLoading || subscriptionsQuery.isLoading || investmentPlansQuery.isLoading || investmentContributionsQuery.isLoading,
    isError: recurringQuery.isError || subscriptionsQuery.isError || investmentPlansQuery.isError || investmentContributionsQuery.isError,
    refetch: () => {
      recurringQuery.refetch()
      subscriptionsQuery.refetch()
      investmentPlansQuery.refetch()
      investmentContributionsQuery.refetch()
    },
  }
}
