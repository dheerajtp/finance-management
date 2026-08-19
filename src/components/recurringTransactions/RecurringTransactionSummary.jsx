import StatCard from '../ui/StatCard'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './RecurringTransactionSummary.module.css'

// Counts are safe to combine across currencies; monthly/annual commitment
// totals are never combined — one StatCard pair per currency.
const RecurringTransactionSummary = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className={styles.grid}>
        <StatCard label="Active recurring items" loading />
        <StatCard label="Due" loading />
        <StatCard label="Upcoming" loading />
        <StatCard label="Overdue" loading />
      </div>
    )
  }

  return (
    <div>
      <div className={styles.grid}>
        <StatCard label="Active recurring items" value={String(summary.active)} />
        <StatCard label="Due" value={String(summary.due)} />
        <StatCard label="Upcoming" value={String(summary.upcoming)} />
        <StatCard label="Overdue" value={String(summary.overdue)} />
      </div>

      {summary.monthlyByCurrency.map((group) => {
        const annual = summary.annualByCurrency.find((entry) => entry.currency === group.currency)
        return (
          <div key={group.currency} className={styles.currencyGrid}>
            <StatCard label={`Monthly commitments (${group.currency})`} value={formatCurrency(group.total, group.currency)} />
            <StatCard
              label={`Annual commitments (${group.currency})`}
              value={formatCurrency(annual?.total ?? 0, group.currency)}
            />
          </div>
        )
      })}
    </div>
  )
}

export default RecurringTransactionSummary
