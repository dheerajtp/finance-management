import Card from '../ui/Card'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './MonthlySpendingTrend.module.css'

// Plain CSS stacked-bar chart — no charting library for one visualization.
// This is the dominant visualization on the Spending Analysis page (Card variant="hero").
const MonthlySpendingTrend = ({ monthlyTrend, currency }) => {
  const maxTotal = Math.max(1, ...monthlyTrend.map((month) => month.total))

  return (
    <Card variant="hero" className={styles.card}>
      <p className="text-section-title">Monthly Spending Trend</p>
      <div className={styles.chart}>
        {monthlyTrend.map((month) => (
          <div key={month.month} className={styles.month}>
            <span className={styles.total}>{formatCurrency(month.total, currency)}</span>
            <div className={styles.barTrack}>
              <div
                className={`${styles.bar} ${month.isCurrentMonth ? styles.currentBar : ''}`}
                style={{ height: `${(month.total / maxTotal) * 100}%` }}
              >
                {month.total > 0 && (
                  <>
                    <div
                      className={styles.segmentEssential}
                      style={{ height: `${(month.essential / month.total) * 100}%` }}
                    />
                    <div
                      className={styles.segmentDiscretionary}
                      style={{ height: `${(month.discretionary / month.total) * 100}%` }}
                    />
                    <div
                      className={styles.segmentUncategorized}
                      style={{ height: `${(month.uncategorized / month.total) * 100}%` }}
                    />
                  </>
                )}
              </div>
            </div>
            <span className={styles.monthLabel}>
              {month.label}
              {month.isCurrentMonth ? ' *' : ''}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.segmentEssential}`} /> Essential
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.segmentDiscretionary}`} /> Discretionary
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.segmentUncategorized}`} /> Uncategorized
        </span>
        <span className="text-caption">* current month (in progress)</span>
      </div>
    </Card>
  )
}

export default MonthlySpendingTrend
