import Skeleton from '../ui/Skeleton'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './FinancialSnapshot.module.css'

// ONE connected financial summary instead of five identically-weighted
// boxes — ties Account Position, Income, Expenses, Savings, and Savings
// Rate together on a single surface, with the account position given
// visual seniority (it answers "where do I stand," everything else is
// this period's activity). Every number is already computed by
// useActionDashboard/useActionDashboardPlanning; this only lays it out.
const FinancialSnapshot = ({ loading, primaryAccountGroup, otherAccountGroups, metrics, currency, periodLabel }) => {
  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.hero}>
          <Skeleton width="40%" height="0.75rem" />
          <Skeleton width="55%" height="2.5rem" />
        </div>
        <div className={styles.metrics}>
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className={styles.metric}>
              <Skeleton width="70%" height="0.75rem" />
              <Skeleton width="55%" height="1.5rem" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const periodSuffix = periodLabel.toLowerCase()

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <p className="text-label">Total Account Position</p>
        <p className={`text-hero-metric ${styles.heroValue}`}>
          {primaryAccountGroup ? formatCurrency(primaryAccountGroup.totalAssets, primaryAccountGroup.currency) : '—'}
        </p>
        {otherAccountGroups.length > 0 && (
          <p className="text-caption">
            {otherAccountGroups.map((group) => `+ ${formatCurrency(group.totalAssets, group.currency)}`).join(' · ')} (not
            combined)
          </p>
        )}
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={`${styles.metricAccent} ${styles.accentIncome}`} aria-hidden="true" />
          <p className="text-label">Income</p>
          <p className={`text-metric ${styles.up}`}>{formatCurrency(metrics.income, currency)}</p>
          <p className="text-caption">{periodSuffix}</p>
        </div>
        <div className={styles.metric}>
          <span className={`${styles.metricAccent} ${styles.accentExpenses}`} aria-hidden="true" />
          <p className="text-label">Expenses</p>
          <p className={`text-metric ${styles.down}`}>{formatCurrency(metrics.expenses, currency)}</p>
          <p className="text-caption">{periodSuffix}</p>
        </div>
        <div className={styles.metric}>
          <span className={`${styles.metricAccent} ${styles.accentSavings}`} aria-hidden="true" />
          <p className="text-label">Savings</p>
          <p className="text-metric">{formatCurrency(metrics.savings, currency)}</p>
          <p className="text-caption">income minus expenses</p>
        </div>
        <div className={styles.metric}>
          <span className={`${styles.metricAccent} ${styles.accentRate}`} aria-hidden="true" />
          <p className="text-label">Savings Rate</p>
          <p className="text-metric">{metrics.savingsRate === null ? 'N/A' : `${metrics.savingsRate.toFixed(1)}%`}</p>
          <p className="text-caption">{periodSuffix}</p>
        </div>
        {metrics.invested > 0 && (
          <div className={styles.metric}>
            <span className={`${styles.metricAccent} ${styles.accentInvested}`} aria-hidden="true" />
            <p className="text-label">Invested</p>
            <p className="text-metric">{formatCurrency(metrics.invested, currency)}</p>
            <p className="text-caption">
              {metrics.investmentRate === null ? periodSuffix : `${metrics.investmentRate.toFixed(1)}% of income`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FinancialSnapshot
