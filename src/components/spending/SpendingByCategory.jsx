import Card from '../ui/Card'
import Progress from '../ui/Progress'
import EmptyState from '../ui/EmptyState'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './SpendingByCategory.module.css'

const SpendingByCategory = ({ categories, currency }) => {
  if (categories.length === 0) {
    return (
      <Card>
        <p className="text-section-title">Top Spending Categories</p>
        <EmptyState
          icon="barChart"
          title="No categorized spending yet"
          description="Categorize your expenses to see which categories consume the most money."
        />
      </Card>
    )
  }

  return (
    <Card>
      <p className="text-section-title">Top Spending Categories</p>
      <div className={styles.list}>
        {categories.map((category, index) => (
          <div key={category.categoryId} className={styles.row}>
            <span className={styles.rank}>{index + 1}</span>
            <div className={styles.progressWrap}>
              <Progress
                label={category.categoryName}
                value={`${formatCurrency(category.amount, currency)} · ${category.percentage.toFixed(1)}%`}
                percentage={category.percentage}
              />
              <div className={styles.meta}>
                <span className="text-caption">{category.transactionCount} transactions</span>
                <span className="text-caption">
                  {formatCurrency(category.monthlyAverage, currency)}/month average
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default SpendingByCategory
