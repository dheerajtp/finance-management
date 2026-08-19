import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import PageHeader from '../components/ui/PageHeader'
import Select from '../components/ui/Select'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import SpendingOverview from '../components/spending/SpendingOverview'
import SpendingByCategory from '../components/spending/SpendingByCategory'
import MonthlySpendingTrend from '../components/spending/MonthlySpendingTrend'
import CategorySpendingTrend from '../components/spending/CategorySpendingTrend'
import SpendingInsights from '../components/spending/SpendingInsights'
import useActionSpendingAnalysis from '../hooks/functionality/useActionSpendingAnalysis'
import styles from './SpendingAnalysisPage.module.css'

const PERIOD_OPTIONS = [
  { value: 3, label: 'Last 3 months' },
  { value: 6, label: 'Last 6 months' },
  { value: 12, label: 'Last 12 months' },
]

const SpendingAnalysisPage = () => {
  const navigate = useNavigate()
  const {
    months,
    setMonths,
    isLoading,
    isError,
    refetch,
    currency,
    breakdown,
    categorySpending,
    monthlyTrend,
    categoryMonthlyTrends,
    categoriesById,
    insights,
    hasTransactions,
    hasOtherCurrencies,
    hasSufficientHistory,
  } = useActionSpendingAnalysis()

  return (
    <div>
      <PageHeader
        title="Spending Analysis"
        description="Where your money is going, and what's changed recently."
        actions={
          <Select
            id="spending-analysis-period"
            label="Period"
            className={styles.periodSelect}
            options={PERIOD_OPTIONS}
            value={months}
            onChange={(event) => setMonths(Number(event.target.value))}
          />
        }
      />

      {isLoading && (
        <div className={styles.skeletonGrid}>
          <Skeleton height="6rem" radius="var(--radius-lg)" />
          <Skeleton height="6rem" radius="var(--radius-lg)" />
          <Skeleton height="6rem" radius="var(--radius-lg)" />
          <Skeleton height="6rem" radius="var(--radius-lg)" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message="We couldn't load your spending analysis." onRetry={refetch} />}

      {!isLoading && !isError && !hasTransactions && (
        <EmptyState
          icon="barChart"
          title="No spending data yet"
          description="Add expense transactions to understand where your money is going."
          action={
            <Button onClick={() => navigate('/transactions')}>
              <Icon name="plus" size="var(--icon-sm)" />
              Add Transaction
            </Button>
          }
        />
      )}

      {!isLoading && !isError && hasTransactions && (
        <>
          {hasOtherCurrencies && (
            <p className={`text-caption ${styles.notice}`}>
              Some transactions use other currencies and aren&rsquo;t included in these totals.
            </p>
          )}

          {!hasSufficientHistory && (
            <p className={`text-caption ${styles.notice}`}>
              More history is needed to identify spending patterns. Baseline comparisons will appear once at least 3
              completed months of data exist.
            </p>
          )}

          <SpendingOverview breakdown={breakdown} currency={currency} />

          <div className={styles.heroSection}>
            <MonthlySpendingTrend monthlyTrend={monthlyTrend} currency={currency} />
          </div>

          <div className={styles.secondaryGrid}>
            <SpendingByCategory categories={categorySpending} currency={currency} />
            <CategorySpendingTrend
              categoryMonthlyTrends={categoryMonthlyTrends}
              categoriesById={categoriesById}
              currency={currency}
            />
          </div>

          <div className={styles.section}>
            <SpendingInsights insights={insights} hasSufficientHistory={hasSufficientHistory} />
          </div>
        </>
      )}
    </div>
  )
}

export default SpendingAnalysisPage
