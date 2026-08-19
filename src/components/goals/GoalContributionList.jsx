import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Icon from '../ui/Icon'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './GoalContributionList.module.css'

const TYPE_ICON = { income: 'arrowDownLeft', expense: 'arrowUpRight' }
const TYPE_BADGE_VARIANT = { income: 'success', expense: 'neutral' }

// A simple vertical timeline, not a table — each entry is one transaction's
// allocation toward this goal (goal_transaction_allocations, 0013).
const GoalContributionList = ({ allocations, onEdit, onDelete }) => {
  return (
    <div className={styles.list}>
      {allocations.map((allocation) => (
        <div key={allocation.id} className={styles.row}>
          <span className={styles.rowIcon}>
            <Icon name={TYPE_ICON[allocation.transactionType] ?? 'piggyBank'} size="var(--icon-sm)" />
          </span>

          <div className={styles.body}>
            <div className={styles.headline}>
              <p className="text-card-title">{allocation.transactionDescription || 'Transaction'}</p>
              {allocation.transactionType && (
                <Badge variant={TYPE_BADGE_VARIANT[allocation.transactionType] ?? 'neutral'}>
                  {allocation.transactionType}
                </Badge>
              )}
            </div>
            <p className="text-caption">{allocation.contribution_date}</p>
            {allocation.note && <p className={`text-caption ${styles.note}`}>&ldquo;{allocation.note}&rdquo;</p>}
          </div>

          <div className={styles.trailing}>
            <p className="text-card-title">+{formatCurrency(allocation.amount, allocation.currency)}</p>
            <div className={styles.actions}>
              <Button variant="ghost" className={styles.actionButton} onClick={() => onEdit(allocation)}>
                Edit
              </Button>
              <Button variant="ghost" className={styles.actionButton} onClick={() => onDelete(allocation)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default GoalContributionList
