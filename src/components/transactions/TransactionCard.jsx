import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import { useTransactionAllocatedAmountQuery } from '../../hooks/api/useGoalTransactionAllocationApi'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './TransactionCard.module.css'

const TYPE_ICON = { income: 'arrowDownLeft', expense: 'arrowUpRight', transfer: 'arrowLeftRight', investment: 'chartCandlestick' }
const AMOUNT_CLASS = { income: 'text-delta--up', expense: 'text-delta--down', transfer: '', investment: '' }
const BADGE_VARIANT = { income: 'success', expense: 'danger', transfer: 'info', investment: 'neutral' }

const TransactionCard = ({ transaction, accountsById, categoriesById, onEdit, onDelete, onAllocate }) => {
  const isRouted = transaction.type === 'transfer' || transaction.type === 'investment'
  // Transfers and investment contributions are never eligible for goal
  // allocation (see 0013 and 0019 migrations), so there's nothing to look
  // up or show for them.
  const allocatedQuery = useTransactionAllocatedAmountQuery(!isRouted ? transaction.id : null)
  const allocated = allocatedQuery.data ?? 0

  const account = accountsById[transaction.account_id]
  const category = transaction.category_id ? categoriesById[transaction.category_id] : null
  const destinationAccount = transaction.destination_account_id
    ? accountsById[transaction.destination_account_id]
    : null

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className="text-card-title">
            {isRouted ? (
              <span className={styles.transferRoute}>
                {account?.name ?? 'Account'}
                <Icon name="arrowRight" size="var(--icon-xs)" />
                {destinationAccount?.name ?? 'Account'}
              </span>
            ) : (
              (category?.name ?? 'Uncategorized')
            )}
          </p>
          <p className="text-caption">
            {!isRouted ? `${account?.name ?? 'Account'} · ` : ''}
            {transaction.transaction_date}
          </p>
        </div>
        <Badge variant={BADGE_VARIANT[transaction.type]}>{transaction.type === 'investment' ? 'invested' : transaction.type}</Badge>
      </div>

      {transaction.description && <p className="text-secondary">{transaction.description}</p>}

      <p className={`text-metric ${AMOUNT_CLASS[transaction.type]} ${styles.amount}`}>
        <Icon name={TYPE_ICON[transaction.type]} size="var(--icon-sm)" className={styles.amountIcon} />
        {formatCurrency(transaction.amount, account?.currency)}
      </p>

      {allocated > 0 && <p className="text-caption">Goal allocation: {formatCurrency(allocated, account?.currency)}</p>}

      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => onEdit(transaction)}>
          Edit
        </Button>
        <Button variant="ghost" onClick={() => onDelete(transaction)}>
          Delete
        </Button>
        {!isRouted && (
          <Button variant="ghost" onClick={() => onAllocate(transaction)}>
            Allocate to goal
          </Button>
        )}
      </div>
    </Card>
  )
}

export default TransactionCard
