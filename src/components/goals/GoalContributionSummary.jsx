import StatCard from '../ui/StatCard'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './GoalContributionSummary.module.css'

// A goal only ever has one currency, but the summary itself is already
// computed by calculateContributionSummary against that one currency (see
// useActionGoalTransactionAllocation) — this component just renders it.
//
// showGoalProgress defaults on for a goal's full contribution picture. When
// this summary is scoped to only one contribution source (e.g. the
// "Transaction allocations" section on the goal detail page, which sits
// right below the goal's already-combined Remaining/Progress figures),
// pass showGoalProgress={false} so a second, differently-scoped
// "Remaining"/"Progress" pair never appears next to the accurate one.
const GoalContributionSummary = ({ summary, currency, loading, showGoalProgress = true, totalLabel = 'Total contributed' }) => {
  if (loading) {
    return (
      <div className={styles.grid}>
        <StatCard label={totalLabel} loading />
        {showGoalProgress && <StatCard label="Remaining" loading />}
        {showGoalProgress && <StatCard label="Progress" loading />}
        <StatCard label="Contributions" loading />
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      <StatCard label={totalLabel} value={formatCurrency(summary.total, currency)} />
      {showGoalProgress && <StatCard label="Remaining" value={formatCurrency(summary.remaining, currency)} />}
      {showGoalProgress && <StatCard label="Progress" value={`${summary.progress.toFixed(0)}%`} />}
      <StatCard label="Contributions" value={String(summary.count)} />
      <StatCard
        label="Monthly average"
        value={summary.count > 0 ? formatCurrency(summary.averageMonthly, currency) : '—'}
      />
      <StatCard label="Last contribution" value={summary.lastContributionDate ?? '—'} />
    </div>
  )
}

export default GoalContributionSummary
