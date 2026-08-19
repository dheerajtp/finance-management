import Card from '../ui/Card'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './CategorySpendingTrend.module.css'

// Deliberately informational, not evaluative — an increase isn't flagged as
// good or bad here (that's what the insights section is for), so this just
// shows the shape of each category's spending over the window.
const CategorySpendingTrend = ({ categoryMonthlyTrends, categoriesById, currency }) => {
  return (
    <Card>
      <p className="text-section-title">Category Trends</p>
      {categoryMonthlyTrends.length > 0 && (
        <div className={styles.list}>
          {categoryMonthlyTrends.map((trend) => {
            const categoryName = categoriesById[trend.categoryId]?.name ?? 'Uncategorized'
            const maxTotal = Math.max(1, ...trend.months.map((month) => month.total))
            const first = trend.months[0]?.total ?? 0
            const last = trend.months[trend.months.length - 1]?.total ?? 0
            const changeLabel = first > 0 ? `${(((last - first) / first) * 100).toFixed(0)}%` : null

            return (
              <div key={trend.categoryId} className={styles.row}>
                <div className={styles.header}>
                  <span className="text-card-title">{categoryName}</span>
                  {changeLabel && (
                    <span className="text-caption">
                      {last >= first ? '↑' : '↓'} {changeLabel} vs {trend.months[0]?.label}
                    </span>
                  )}
                </div>
                <div className={styles.bars}>
                  {trend.months.map((month) => (
                    <div
                      key={month.month}
                      className={styles.barWrap}
                      title={`${month.label}: ${formatCurrency(month.total, currency)}`}
                    >
                      <div
                        className={`${styles.bar} ${month.isCurrentMonth ? styles.currentBar : ''}`}
                        style={{ height: `${(month.total / maxTotal) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default CategorySpendingTrend
