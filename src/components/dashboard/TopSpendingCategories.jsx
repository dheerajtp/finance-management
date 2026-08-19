import { Link } from 'react-router-dom'
import Progress from '../ui/Progress'
import EmptyState from '../ui/EmptyState'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './TopSpendingCategories.module.css'

// Copy differs depending on whether the user has never recorded spending at
// all vs. simply has none in the selected period — a returning user with a
// quiet month shouldn't be told to add their "first" transaction.
const TopSpendingCategories = ({ categories, currency, hasEverHadTransactions, periodLabel, onAddTransaction }) => {
  return (
    <section>
      <div className={styles.head}>
        <p className="text-section-title">Top Spending Categories</p>
        {categories.length > 0 && (
          <Link to="/spending-analysis" className={styles.viewAll}>
            View analysis
            <Icon name="chevronRight" size="var(--icon-xs)" />
          </Link>
        )}
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon="barChart"
          title={hasEverHadTransactions ? `No spending in ${periodLabel.toLowerCase()}` : 'No spending data yet'}
          description={
            hasEverHadTransactions
              ? 'Try a different period, or view your full spending history.'
              : 'Your spending breakdown will appear after you add your first expense transaction.'
          }
          action={
            hasEverHadTransactions ? (
              <Link to="/spending-analysis" className={styles.viewAll}>
                View spending analysis
                <Icon name="chevronRight" size="var(--icon-xs)" />
              </Link>
            ) : (
              <Button onClick={onAddTransaction}>
                <Icon name="plus" size="var(--icon-sm)" />
                Add transaction
              </Button>
            )
          }
          className={styles.empty}
        />
      ) : (
        <div className={styles.list}>
          {categories.map((category, index) => (
            <div key={category.categoryId} className={styles.row}>
              <span className={styles.rank}>{index + 1}</span>
              <div className={styles.progressWrap}>
                <Progress
                  label={category.name}
                  value={formatCurrency(category.amount, currency)}
                  percentage={category.percentage}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default TopSpendingCategories
