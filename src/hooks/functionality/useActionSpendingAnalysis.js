import { useMemo, useState } from 'react'
import useActionAuth from './useActionAuth'
import { useSpendingAnalysisData } from '../api/useSpendingAnalysisApi'
import { getLastNMonthsRange, getMonthBuckets } from '../../utils/finance/dateRange'
import { groupTransactionsByCurrency } from '../../utils/finance/transactionSummary'
import { calculateSpendingBreakdown } from '../../utils/finance/spendingBreakdown'
import { calculateCategorySpending } from '../../utils/finance/spendingAnalysis'
import { calculateMonthlySpendingTrend, calculateCategoryMonthlyTrend } from '../../utils/finance/spendingTrends'
import { detectSpendingSignals } from '../../utils/finance/spendingInsights'
import { formatCurrency } from '../../utils/finance/currency'

const TOP_CATEGORY_LIMIT = 10
// Category trend/insight scope is deliberately limited to the biggest
// spenders — "top by total" doubles as "the categories worth watching",
// keeping the trend chart and the insights it feeds consistent with each
// other rather than referencing categories the chart doesn't show.
const TREND_CATEGORY_LIMIT = 5
const MIN_BASELINE_MONTHS = 3

const useActionSpendingAnalysis = () => {
  const { profile } = useActionAuth()
  const [months, setMonths] = useState(6)

  const dateRange = getLastNMonthsRange(months)
  const monthBuckets = useMemo(() => getMonthBuckets(months), [months])

  const { accounts, categories, transactions, isLoading, isError, refetch } = useSpendingAnalysisData(dateRange)

  const accountsById = useMemo(() => Object.fromEntries(accounts.map((account) => [account.id, account])), [accounts])
  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category])),
    [categories],
  )

  const analysis = useMemo(() => {
    const groups = groupTransactionsByCurrency(transactions, accountsById)
    const currencies = Array.from(groups.keys())
    const primaryCurrency = currencies.includes(profile?.currency) ? profile.currency : currencies[0]
    const primaryTransactions = primaryCurrency ? groups.get(primaryCurrency) : []
    const hasTransactions = primaryTransactions.length > 0

    const breakdown = calculateSpendingBreakdown(primaryTransactions, categoriesById)
    const categorySpending = calculateCategorySpending(
      primaryTransactions,
      categoriesById,
      breakdown.total,
      months,
      TOP_CATEGORY_LIMIT,
    )
    const monthlyTrend = calculateMonthlySpendingTrend(primaryTransactions, categoriesById, monthBuckets)

    const trendCategoryIds = categorySpending.slice(0, TREND_CATEGORY_LIMIT).map((category) => category.categoryId)
    const categoryMonthlyTrends = calculateCategoryMonthlyTrend(primaryTransactions, monthBuckets, trendCategoryIds)

    const completedMonthsAvailable = monthBuckets.filter((bucket) => !bucket.isCurrentMonth).length
    const hasSufficientHistory = completedMonthsAvailable >= MIN_BASELINE_MONTHS

    const insights = detectSpendingSignals({
      categorySpending,
      categoryMonthlyTrends,
      breakdown,
      currency: primaryCurrency,
      formatCurrency,
    })

    return {
      currency: primaryCurrency,
      breakdown,
      categorySpending,
      monthlyTrend,
      categoryMonthlyTrends,
      insights,
      hasTransactions,
      hasOtherCurrencies: currencies.length > 1,
      hasSufficientHistory,
      completedMonthsAvailable,
    }
  }, [transactions, accountsById, categoriesById, profile, monthBuckets, months])

  return {
    months,
    setMonths,
    isLoading,
    isError,
    refetch,
    categoriesById,
    ...analysis,
  }
}

export default useActionSpendingAnalysis
