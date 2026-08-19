import { useNavigate } from 'react-router-dom'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Skeleton from '../ui/Skeleton'
import ErrorState from '../ui/ErrorState'
import { FLEXIBLE_CATEGORY_LABEL } from '../../constants/flexibleSpending'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './SafeToSpend.module.css'

// Compact dashboard version only — the full breakdown/allocation editing
// lives on /safe-to-spend (SafeToSpendPage). Every figure here is already
// computed by useActionSpendingPlan; nothing is recalculated.
const SafeToSpend = ({ isLoading, isError, refetch, currency, hasIncome, isOverCommitted, availableAmount, overCommittedAmount, categories }) => {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <Card className={styles.card}>
        <p className="text-section-title">Safe to Spend</p>
        <Skeleton height="2.5rem" width="10rem" />
        <div className={styles.skeletonList}>
          <Skeleton height="1.25rem" />
          <Skeleton height="1.25rem" />
          <Skeleton height="1.25rem" />
        </div>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card className={styles.card}>
        <p className="text-section-title">Safe to Spend</p>
        <ErrorState message="Safe-to-spend information is temporarily unavailable." onRetry={refetch} />
      </Card>
    )
  }

  return (
    <Card className={styles.card}>
      <p className="text-section-title">Safe to Spend</p>

      {!hasIncome ? (
        <p className={`text-secondary ${styles.notice}`}>
          Safe-to-spend amount isn&rsquo;t available because no income has been recorded for this month.
        </p>
      ) : isOverCommitted ? (
        <>
          <p className={`text-hero-metric ${styles.overAmount}`}>{formatCurrency(overCommittedAmount, currency)}</p>
          <p className="text-caption">Planned commitments are above recorded income this month.</p>
        </>
      ) : (
        <>
          <p className={`text-hero-metric ${styles.amount}`}>{formatCurrency(availableAmount, currency)}</p>
          <p className="text-caption">After essential expenses and planned commitments.</p>
        </>
      )}

      {hasIncome && !isOverCommitted && (
        <div className={styles.list}>
          {categories.map((category) => (
            <div key={category.key} className={styles.row}>
              <span className="text-secondary">{FLEXIBLE_CATEGORY_LABEL[category.key]}</span>
              <span className="text-body">
                {category.remaining >= 0
                  ? `${formatCurrency(category.remaining, currency)} left`
                  : `${formatCurrency(Math.abs(category.remaining), currency)} over`}
              </span>
            </div>
          ))}
        </div>
      )}

      <Button variant="secondary" className={styles.viewButton} onClick={() => navigate('/safe-to-spend')}>
        View spending plan
      </Button>
    </Card>
  )
}

export default SafeToSpend
