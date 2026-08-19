import StatCard from '../ui/StatCard'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './SpendingOverview.module.css'

const SpendingOverview = ({ breakdown, currency, loading }) => {
  if (loading) {
    return (
      <div className={styles.grid}>
        <StatCard label="Total Spending" loading />
        <StatCard label="Essential" loading />
        <StatCard label="Discretionary" loading />
        <StatCard label="Uncategorized" loading />
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      <StatCard label="Total Spending" value={formatCurrency(breakdown.total, currency)} />
      <StatCard
        label="Essential"
        value={formatCurrency(breakdown.essential, currency)}
        description={`${breakdown.essentialPercentage.toFixed(0)}% of spending`}
      />
      <StatCard
        label="Discretionary"
        value={formatCurrency(breakdown.discretionary, currency)}
        description={`${breakdown.discretionaryPercentage.toFixed(0)}% of spending`}
      />
      <StatCard
        label="Uncategorized"
        value={formatCurrency(breakdown.uncategorized, currency)}
        description={`${breakdown.uncategorizedPercentage.toFixed(0)}% of spending`}
      />
    </div>
  )
}

export default SpendingOverview
