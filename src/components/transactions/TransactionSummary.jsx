import StatCard from '../ui/StatCard'
import { summarizeTransactions } from '../../utils/finance/transactionSummary'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './TransactionSummary.module.css'

const TransactionSummary = ({ transactions, accountsById, loading }) => {
  if (loading) {
    return (
      <div className={styles.grid}>
        <StatCard label="Income" loading />
        <StatCard label="Expenses" loading />
        <StatCard label="Net" loading />
      </div>
    )
  }

  const groups = summarizeTransactions(transactions, accountsById)
  if (groups.length === 0) return null

  return (
    <div className={styles.stack}>
      {groups.map((group) => {
        const suffix = groups.length > 1 ? ` (${group.currency})` : ''
        return (
          <div key={group.currency} className={styles.grid}>
            <StatCard label={`Income${suffix}`} value={formatCurrency(group.income, group.currency)} />
            <StatCard label={`Expenses${suffix}`} value={formatCurrency(group.expenses, group.currency)} />
            <StatCard
              label={`Net${suffix}`}
              value={formatCurrency(group.net, group.currency)}
              delta={group.net >= 0 ? 'Positive' : 'Negative'}
              deltaDirection={group.net >= 0 ? 'up' : 'down'}
            />
            {group.invested > 0 && <StatCard label={`Invested${suffix}`} value={formatCurrency(group.invested, group.currency)} />}
          </div>
        )
      })}
    </div>
  )
}

export default TransactionSummary
