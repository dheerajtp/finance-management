import StatCard from '../ui/StatCard'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './GoalSummary.module.css'

// Counts are safe to combine across currencies (they're just numbers of
// goals); remaining amounts are never summed across currencies.
const GoalSummary = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className={styles.grid}>
        <StatCard label="Active goals" loading />
        <StatCard label="On track" loading />
        <StatCard label="Behind" loading />
        <StatCard label="Reached" loading />
      </div>
    )
  }

  return (
    <div>
      <div className={styles.grid}>
        <StatCard label="Active goals" value={String(summary.active)} />
        <StatCard label="On track" value={String(summary.onTrack)} />
        <StatCard label="Behind" value={String(summary.behind)} />
        <StatCard label="Reached" value={String(summary.reached)} />
      </div>

      {summary.remainingByCurrency.length > 0 && (
        <div className={styles.remaining}>
          {summary.remainingByCurrency.map((group) => (
            <span key={group.currency} className="text-caption">
              {formatCurrency(group.remaining, group.currency)} remaining across active goals
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default GoalSummary
