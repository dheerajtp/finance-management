import { Link } from 'react-router-dom'
import Section from '../ui/Section'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import { getCategoryIcon } from '../../constants/categoryIcons'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './RecentTransactions.module.css'

const TYPE_ICON = { income: 'arrowDownLeft', expense: 'arrowUpRight', transfer: 'arrowLeftRight', investment: 'chartCandlestick' }
const AMOUNT_CLASS = { income: 'text-delta--up', expense: 'text-delta--down', transfer: '', investment: '' }

const rowIcon = (transaction, category) => {
  if (transaction.type !== 'income' && transaction.type !== 'expense') return TYPE_ICON[transaction.type]
  return category ? getCategoryIcon(category) : TYPE_ICON[transaction.type]
}

const describe = (transaction, account, category) => {
  if (transaction.type === 'transfer') return `Transfer · ${account?.name ?? 'Account'}`
  if (transaction.type === 'investment') return `Investment · ${account?.name ?? 'Account'}`
  return category?.name ?? 'Uncategorized'
}

// The 5 most recent transactions overall — deliberately NOT filtered by the
// dashboard's period selector (see useActionDashboard/useDashboardApi), so
// "no transactions" here only ever means "never recorded one", not "none
// in the selected period". Real columns on desktop (a table genuinely
// represents this data); the same rows collapse to compact cards on mobile
// via CSS, not a second data source.
const RecentTransactions = ({ transactions, accountsById, categoriesById, onAddTransaction }) => {
  const viewAll = (
    <Link to="/transactions" className={styles.viewAll}>
      View all
      <Icon name="chevronRight" size="var(--icon-xs)" />
    </Link>
  )

  if (transactions.length === 0) {
    return (
      <Section title="Recent Transactions">
        <EmptyState
          icon="list"
          title="No transactions yet"
          description="Start tracking your income and expenses."
          action={
            <Button onClick={onAddTransaction}>
              <Icon name="plus" size="var(--icon-sm)" />
              Add transaction
            </Button>
          }
        />
      </Section>
    )
  }

  return (
    <Section title="Recent Transactions" actions={viewAll} bodyClassName={styles.body}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Description</th>
              <th scope="col">Category</th>
              <th scope="col">Account</th>
              <th scope="col" className={styles.amountHead}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const account = accountsById[transaction.account_id]
              const category = transaction.category_id ? categoriesById[transaction.category_id] : null
              const isRouted = transaction.type === 'transfer' || transaction.type === 'investment'

              return (
                <tr key={transaction.id} className={styles.row}>
                  <td className="text-secondary">{transaction.transaction_date}</td>
                  <td className="text-body">{describe(transaction, account, category)}</td>
                  <td className="text-secondary">{isRouted ? '—' : (category?.name ?? 'Uncategorized')}</td>
                  <td className="text-secondary">{account?.name ?? '—'}</td>
                  <td className={`text-card-title ${styles.amount} ${AMOUNT_CLASS[transaction.type] ?? ''}`}>
                    <Icon name={rowIcon(transaction, category)} size="var(--icon-xs)" />
                    {formatCurrency(transaction.amount, account?.currency)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.cardList}>
        {transactions.map((transaction) => {
          const account = accountsById[transaction.account_id]
          const category = transaction.category_id ? categoriesById[transaction.category_id] : null

          return (
            <div key={transaction.id} className={styles.row}>
              <span className={styles.rowIcon}>
                <Icon name={rowIcon(transaction, category)} size="var(--icon-sm)" />
              </span>
              <div className={styles.identity}>
                <p className="text-card-title">{describe(transaction, account, category)}</p>
                <p className="text-caption">{transaction.transaction_date}</p>
              </div>
              <p className={`text-body ${styles.cardAmount} ${AMOUNT_CLASS[transaction.type] ?? ''}`}>
                {formatCurrency(transaction.amount, account?.currency)}
              </p>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

export default RecentTransactions
