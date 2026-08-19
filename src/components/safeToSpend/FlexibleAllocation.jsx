import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import FlexibleSpendingCard from './FlexibleSpendingCard'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './FlexibleAllocation.module.css'

// Purely presentational — categories/unallocated figures already come from
// summarizeSafeToSpend (utils/finance/safeToSpend.js).
const FlexibleAllocation = ({
  categories,
  currency,
  unallocatedSpending,
  unallocatedAmount,
  unallocatedPercentage,
  hasFlexibleSpending,
  budgetTotalByFlexibleGroup,
  onEditAllocation,
}) => (
  <section>
    <div className={styles.head}>
      <div>
        <h2 className="text-section-title">Flexible Allocation</h2>
        {unallocatedPercentage > 0 && (
          <p className="text-caption">{formatCurrency(unallocatedAmount, currency)} ({unallocatedPercentage}%) remains unallocated.</p>
        )}
      </div>
      <Button variant="secondary" onClick={onEditAllocation}>
        <Icon name="sliders" size="var(--icon-sm)" />
        Edit allocation
      </Button>
    </div>

    {!hasFlexibleSpending && <p className={`text-caption ${styles.notice}`}>No flexible spending recorded this month.</p>}

    <div className={styles.grid}>
      {categories.map((category) => (
        <FlexibleSpendingCard
          key={category.key}
          category={category}
          budgetAmount={budgetTotalByFlexibleGroup.get(category.key)}
          currency={currency}
        />
      ))}
    </div>

    {unallocatedSpending > 0 && (
      <div className={styles.unallocated}>
        <div>
          <p className="text-card-title">Unallocated spending</p>
          <p className="text-caption">Flexible spending in a category with nothing allocated to it.</p>
        </div>
        <div className={styles.unallocatedTrailing}>
          <p className="text-metric">{formatCurrency(unallocatedSpending, currency)}</p>
          <Link to="/spending-analysis" className={styles.reviewLink}>
            Review spending
          </Link>
        </div>
      </div>
    )}
  </section>
)

export default FlexibleAllocation
