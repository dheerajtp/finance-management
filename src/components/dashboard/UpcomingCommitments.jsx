import { Link } from 'react-router-dom'
import Section from '../ui/Section'
import Badge from '../ui/Badge'
import Icon from '../ui/Icon'
import EmptyState from '../ui/EmptyState'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './UpcomingCommitments.module.css'

const TYPE_ICON = { income: 'arrowDownLeft', expense: 'arrowUpRight', transfer: 'arrowLeftRight', investment: 'chartCandlestick' }
const AMOUNT_CLASS = { income: 'text-delta--up', expense: 'text-delta--down', transfer: '', investment: '' }

const occurrenceLabel = (item) => {
  if (item.status === 'overdue') return `${Math.abs(item.daysUntil)}d overdue`
  if (item.status === 'due') return 'Due today'
  return `in ${item.daysUntil}d`
}

// Real upcoming items only (recurring transactions as the authoritative
// schedule, subscriptions as supplementary — see useActionDashboardCommitments)
// — never a placeholder row when nothing is coming up.
const UpcomingCommitments = ({ upcoming, dueOrOverdue }) => {
  const viewAll = (
    <Link to="/recurring-transactions" className={styles.viewAll}>
      View all
      <Icon name="chevronRight" size="var(--icon-xs)" />
    </Link>
  )

  return (
    <Section title="Upcoming Commitments" actions={viewAll}>
      {upcoming.length === 0 ? (
        <EmptyState
          icon="calendarCheck"
          title="Nothing scheduled"
          description="Recurring transactions and subscriptions you add will show up here."
        />
      ) : (
        <div className={styles.list}>
          {upcoming.map((item) => (
            <div key={item.id} className={styles.row}>
              <span className={styles.rowIcon}>
                <Icon name={TYPE_ICON[item.type] ?? 'refresh'} size="var(--icon-sm)" />
              </span>
              <div className={styles.identity}>
                <p className="text-card-title">{item.name}</p>
                <p className="text-caption">{occurrenceLabel(item)}</p>
              </div>
              <p className={`text-body ${styles.amount} ${AMOUNT_CLASS[item.type] ?? ''}`}>
                {item.type === 'income' ? '+' : ''}
                {formatCurrency(item.amount, item.currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      {dueOrOverdue.length > 0 && (
        <div className={styles.attention}>
          <p className={`text-label ${styles.attentionTitle}`}>Needs attention</p>
          <div className={styles.list}>
            {dueOrOverdue.map((item) => (
              <div key={item.id} className={styles.row}>
                <div className={styles.identity}>
                  <p className="text-card-title">{item.description || `Recurring ${item.type}`}</p>
                  <p className="text-caption">{formatCurrency(item.amount, item.currency)}</p>
                </div>
                <Badge variant={item.status === 'overdue' ? 'warning' : 'info'}>
                  {item.status === 'overdue' ? 'Overdue' : 'Due today'}
                </Badge>
              </div>
            ))}
          </div>
          <Link to="/recurring-transactions" className={`${styles.viewAll} ${styles.recordLink}`}>
            Record transaction
            <Icon name="chevronRight" size="var(--icon-xs)" />
          </Link>
        </div>
      )}
    </Section>
  )
}

export default UpcomingCommitments
