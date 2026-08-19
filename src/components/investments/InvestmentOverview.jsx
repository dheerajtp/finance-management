import StatCard from '../ui/StatCard'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './InvestmentOverview.module.css'

// One full stat row per currency — never combined (see
// useActionInvestments' overviewByCurrency, which groups holdings by
// currency before any of these numbers are summed).
const InvestmentOverview = ({ overviewByCurrency, loading }) => {
  if (loading) {
    return (
      <div className={styles.grid}>
        <StatCard label="Total invested" loading />
        <StatCard label="Current value" loading />
        <StatCard label="Gain/loss" loading />
      </div>
    )
  }

  if (overviewByCurrency.length === 0) return null

  return (
    <div className={styles.stack}>
      {overviewByCurrency.map((group) => {
        const isGain = group.gain >= 0
        return (
          <div key={group.currency} className={styles.currencyGroup}>
            {overviewByCurrency.length > 1 && <p className={`text-label ${styles.currencyLabel}`}>{group.currency}</p>}
            <div className={styles.grid}>
              <StatCard label="Total invested" value={formatCurrency(group.invested, group.currency)} icon="chartCandlestick" accent="purple" />
              <StatCard label="Current value" value={formatCurrency(group.currentValue, group.currency)} icon="wallet" accent="info" />
              <StatCard
                label={isGain ? 'Gain' : 'Loss'}
                value={formatCurrency(Math.abs(group.gain), group.currency)}
                icon={isGain ? 'trendingUp' : 'trendingDown'}
                accent={isGain ? 'success' : 'danger'}
                description={
                  group.gainPercentage !== null ? `${isGain ? '+' : '-'}${Math.abs(group.gainPercentage).toFixed(1)}%` : undefined
                }
              />
              <StatCard
                label="Monthly SIP"
                value={formatCurrency(group.monthlySip, group.currency)}
                icon="calendarCheck"
                accent="warning"
              />
              <StatCard
                label="Investment rate"
                value={group.investmentRate === null ? 'N/A' : `${group.investmentRate.toFixed(1)}%`}
                icon="barChart"
                accent="purple"
                description="Invested this month ÷ income this month"
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default InvestmentOverview
