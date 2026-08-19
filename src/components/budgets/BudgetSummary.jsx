import StatCard from '../ui/StatCard'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './BudgetSummary.module.css'

// Counts (over/near-limit) are safe to combine across currencies; monetary
// totals are never combined — one StatCard row per currency.
const BudgetSummary = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className={styles.grid}>
        <StatCard label="Over budget" loading />
        <StatCard label="Near limit" loading />
      </div>
    )
  }

  return (
    <div>
      <div className={styles.grid}>
        <StatCard label="Over budget" value={String(summary.overBudgetCount)} />
        <StatCard label="Near limit" value={String(summary.nearLimitCount)} />
      </div>

      {summary.totalsByCurrency.map((group) => (
        <div key={group.currency} className={styles.currencyGrid}>
          <StatCard
            label={`Total budgeted (${group.currency})`}
            value={formatCurrency(group.totalBudgeted, group.currency)}
          />
          <StatCard label={`Total spent (${group.currency})`} value={formatCurrency(group.totalSpent, group.currency)} />
          <StatCard
            label={`Total remaining (${group.currency})`}
            value={formatCurrency(group.totalRemaining, group.currency)}
          />
        </div>
      ))}
    </div>
  )
}

export default BudgetSummary
