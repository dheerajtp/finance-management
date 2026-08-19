import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Icon from '../ui/Icon'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './TransactionTable.module.css'

const TYPE_ICON = { income: 'arrowDownLeft', expense: 'arrowUpRight', transfer: 'arrowLeftRight', investment: 'chartCandlestick' }
const AMOUNT_CLASS = { income: 'text-delta--up', expense: 'text-delta--down', transfer: '', investment: '' }
const BADGE_VARIANT = { income: 'success', expense: 'danger', transfer: 'info', investment: 'neutral' }

const TransactionTable = ({ transactions, accountsById, categoriesById, onEdit, onDelete, onAllocate }) => {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col">Category</th>
            <th scope="col">Account</th>
            <th scope="col">Type</th>
            <th scope="col" className={styles.amountHead}>
              Amount
            </th>
            <th scope="col" className={styles.actionsHead}>
              <span className={styles.srOnly}>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const account = accountsById[transaction.account_id]
            const category = transaction.category_id ? categoriesById[transaction.category_id] : null
            const destinationAccount = transaction.destination_account_id
              ? accountsById[transaction.destination_account_id]
              : null
            const isRouted = transaction.type === 'transfer' || transaction.type === 'investment'

            return (
              <tr key={transaction.id} className={styles.row}>
                <td className="text-secondary">{transaction.transaction_date}</td>
                <td>
                  <p className="text-body">
                    {isRouted ? (
                      <span className={styles.transferRoute}>
                        {account?.name ?? 'Account'}
                        <Icon name="arrowRight" size="var(--icon-xs)" />
                        {destinationAccount?.name ?? 'Account'}
                      </span>
                    ) : (
                      transaction.description || '—'
                    )}
                  </p>
                </td>
                <td className="text-secondary">{isRouted ? '—' : category?.name ?? 'Uncategorized'}</td>
                <td className="text-secondary">{account?.name ?? '—'}</td>
                <td>
                  <Badge variant={BADGE_VARIANT[transaction.type]}>{transaction.type === 'investment' ? 'invested' : transaction.type}</Badge>
                </td>
                <td className={`text-card-title ${AMOUNT_CLASS[transaction.type]} ${styles.amount}`}>
                  <Icon name={TYPE_ICON[transaction.type]} size="var(--icon-xs)" className={styles.amountIcon} />
                  {formatCurrency(transaction.amount, account?.currency)}
                </td>
                <td className={styles.actions}>
                  <Button variant="ghost" className={styles.actionButton} onClick={() => onEdit(transaction)}>
                    Edit
                  </Button>
                  <Button variant="ghost" className={styles.actionButton} onClick={() => onDelete(transaction)}>
                    Delete
                  </Button>
                  {!isRouted && (
                    <Button variant="ghost" className={styles.actionButton} onClick={() => onAllocate(transaction)}>
                      Allocate
                    </Button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default TransactionTable
