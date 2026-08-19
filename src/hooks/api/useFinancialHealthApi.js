import { useAccountsQuery } from './useAccountApi'
import { useTransactionsQuery } from './useTransactionApi'
import { useEmergencyFundSettingsQuery } from './useEmergencyFundApi'
import { useInvestmentPlansQuery } from './useInvestmentPlanApi'
import { useInvestmentContributionsQuery } from './useInvestmentContributionApi'
import { getCurrentMonthRange } from '../../utils/finance/dateRange'

// Dashboard-level composition for the Financial Health section. Every query
// here is the same query key an existing feature page already uses
// (accounts, emergency fund settings, investment plans/contributions), so
// TanStack Query dedupes the network request even though this hook is
// called independently of those pages. The one new query is a single
// current-month, all-types transaction fetch — used for this month's
// savings and emergency-fund-contribution check — not a "fetch everything"
// query.
export const useFinancialHealthData = (userId) => {
  const accountsQuery = useAccountsQuery()

  const monthRange = getCurrentMonthRange()
  const currentMonthTransactionsQuery = useTransactionsQuery({ fromDate: monthRange.start, toDate: monthRange.end })

  const efSettingsQuery = useEmergencyFundSettingsQuery(userId)

  // All plans/contributions (not just active) — Financial Health needs to
  // tell "never configured" apart from "currently paused", which requires
  // seeing inactive plans too.
  const investmentPlansQuery = useInvestmentPlansQuery({})
  const investmentContributionsQuery = useInvestmentContributionsQuery({})

  return {
    accounts: accountsQuery.data ?? [],
    currentMonthTransactions: currentMonthTransactionsQuery.data ?? [],
    emergencyFundSettings: efSettingsQuery.data ?? null,
    investmentPlans: investmentPlansQuery.data ?? [],
    investmentContributions: investmentContributionsQuery.data ?? [],
    isLoading:
      accountsQuery.isLoading ||
      currentMonthTransactionsQuery.isLoading ||
      efSettingsQuery.isLoading ||
      investmentPlansQuery.isLoading ||
      investmentContributionsQuery.isLoading,
    isError:
      accountsQuery.isError ||
      currentMonthTransactionsQuery.isError ||
      efSettingsQuery.isError ||
      investmentPlansQuery.isError ||
      investmentContributionsQuery.isError,
    refetch: () => {
      accountsQuery.refetch()
      currentMonthTransactionsQuery.refetch()
      efSettingsQuery.refetch()
      investmentPlansQuery.refetch()
      investmentContributionsQuery.refetch()
    },
  }
}
