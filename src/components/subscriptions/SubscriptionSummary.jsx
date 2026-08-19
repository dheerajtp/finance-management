import StatCard from '../ui/StatCard'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './SubscriptionSummary.module.css'

// Counts are safe to combine across currencies; monthly/annual commitment
// totals are never combined — one StatCard pair per currency.
const SubscriptionSummary = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className={styles.grid}>
        <StatCard label="Active subscriptions" loading />
        <StatCard label="Upcoming renewals" loading />
      </div>
    )
  }

  return (
    <div>
      <div className={styles.grid}>
        <StatCard label="Active subscriptions" value={String(summary.active)} />
        <StatCard label="Upcoming renewals" value={String(summary.upcomingRenewals)} />
        {summary.overdue > 0 && <StatCard label="Overdue" value={String(summary.overdue)} />}
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

export default SubscriptionSummary
