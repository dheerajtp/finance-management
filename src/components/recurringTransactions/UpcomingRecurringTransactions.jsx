import { format, parseISO } from 'date-fns'
import Card from '../ui/Card'
import Icon from '../ui/Icon'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './UpcomingRecurringTransactions.module.css'

const TYPE_ICON = { income: 'arrowDownLeft', expense: 'arrowUpRight', transfer: 'arrowLeftRight' }

const occurrenceLabel = (item) => {
  if (item.status === 'overdue') return `Overdue since ${format(parseISO(item.next_occurrence_date), 'MMM d')}`
  if (item.status === 'due') return 'Due today'
  return `In ${item.daysUntilOccurrence} day${item.daysUntilOccurrence === 1 ? '' : 's'}`
}

// Only rendered when there's something upcoming/due/overdue — real data
// only, never a placeholder row.
const UpcomingRecurringTransactions = ({ items }) => {
  if (items.length === 0) return null

  return (
    <Card className={styles.card}>
      <p className="text-section-title">Upcoming</p>
      <div className={styles.list}>
        {items.map((item) => (
          <div key={item.id} className={styles.row}>
            <span className={styles.rowIcon}>
              <Icon name={TYPE_ICON[item.type]} size="var(--icon-sm)" />
            </span>
            <div className={styles.identity}>
              <p className="text-card-title">{item.description || `Recurring ${item.type}`}</p>
              <p className="text-caption">{occurrenceLabel(item)}</p>
            </div>
            <p className={`text-body ${styles.amount}`}>{formatCurrency(item.amount, item.currency)}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default UpcomingRecurringTransactions
