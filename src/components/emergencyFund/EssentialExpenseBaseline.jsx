import Icon from '../ui/Icon'
import EmptyState from '../ui/EmptyState'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './EssentialExpenseBaseline.module.css'

const TITLE = (
  <div className={styles.title}>
    <Icon name="barChart" size="var(--icon-sm)" className={styles.titleIcon} />
    <p className="text-section-title">Essential Expense Baseline</p>
  </div>
)

// Makes the target calculation transparent — the exact months and values it
// came from, not just the final number.
const EssentialExpenseBaseline = ({ baseline, currency }) => {
  if (baseline.monthsUsed === 0) {
    return (
      <div>
        {TITLE}
        <EmptyState
          icon="barChart"
          title="Not enough spending history yet"
          description="Your emergency fund target is based on your average essential monthly expenses. More completed spending history will make this estimate more useful."
          className={styles.empty}
        />
      </div>
    )
  }

  const maxEssential = Math.max(1, ...baseline.monthlyValues.map((month) => month.essential))

  return (
    <div>
      {TITLE}
      <p className="text-caption">
        Based on your {baseline.monthsUsed} most recent completed month{baseline.monthsUsed === 1 ? '' : 's'} of
        essential spending.
      </p>

      <div className={styles.list}>
        {baseline.monthlyValues.map((month) => (
          <div key={month.month} className={styles.row}>
            <span className={styles.label}>{month.label}</span>
            <div className={styles.barTrack}>
              <div className={styles.bar} style={{ width: `${(month.essential / maxEssential) * 100}%` }} />
            </div>
            <span className={styles.value}>{formatCurrency(month.essential, currency)}</span>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        <p className="text-label">Average</p>
        <p className={`text-metric ${styles.average}`}>{formatCurrency(baseline.average, currency)}/month</p>
      </div>
    </div>
  )
}

export default EssentialExpenseBaseline
