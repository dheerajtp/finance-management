import { format, parseISO } from 'date-fns'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import { RECURRING_FREQUENCY_MAP } from '../../constants/recurringFrequency'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './RecurringTransactionCard.module.css'

const TYPE_ICON = { income: 'arrowDownLeft', expense: 'arrowUpRight', transfer: 'arrowLeftRight' }
const AMOUNT_CLASS = { income: 'text-delta--up', expense: 'text-delta--down', transfer: '' }
const TYPE_BADGE_VARIANT = { income: 'success', expense: 'danger', transfer: 'info' }

const STATUS_LABELS = { upcoming: 'Upcoming', due: 'Due today', overdue: 'Overdue', ended: 'Ended', inactive: 'Inactive' }

// Restrained on purpose — an overdue recurring transaction is normal
// (nothing ran automatically, nothing was lost), not an emergency. Only the
// wording says "Overdue"; the color stays a muted warning, not danger red.
const STATUS_BADGE_VARIANT = { upcoming: 'neutral', due: 'info', overdue: 'warning', ended: 'neutral', inactive: 'neutral' }

const occurrenceLabel = (item) => {
  if (item.status === 'overdue') return `Overdue since ${format(parseISO(item.next_occurrence_date), 'MMM d')}`
  if (item.status === 'due') return 'Due today'
  return `In ${item.daysUntilOccurrence} day${item.daysUntilOccurrence === 1 ? '' : 's'}`
}

const RecurringTransactionCard = ({ item, onEdit, onToggleActive, onRecord }) => {
  const frequencyLabel = RECURRING_FREQUENCY_MAP[item.frequency]?.label ?? item.frequency
  const canRecord = item.is_active && (item.status === 'due' || item.status === 'overdue')

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className="text-card-title">{item.description || `Recurring ${item.type}`}</p>
          <p className="text-caption">
            {frequencyLabel}
            {item.categoryName ? ` · ${item.categoryName}${item.categoryInactive ? ' (inactive)' : ''}` : ''}
          </p>
        </div>
        <div className={styles.badges}>
          <Badge variant={TYPE_BADGE_VARIANT[item.type]}>{item.type}</Badge>
          <Badge variant={STATUS_BADGE_VARIANT[item.status] ?? 'neutral'}>{STATUS_LABELS[item.status] ?? item.status}</Badge>
        </div>
      </div>

      {item.type === 'transfer' ? (
        <p className={styles.transferRoute}>
          <span className="text-caption">From {item.accountName}</span>
          <Icon name="arrowRight" size="var(--icon-xs)" />
          <span className="text-caption">To {item.destinationAccountName}</span>
        </p>
      ) : (
        <p className="text-caption">
          {item.accountName}
          {item.accountInactive ? ' (inactive)' : ''}
        </p>
      )}

      <p className={`text-metric ${AMOUNT_CLASS[item.type]} ${styles.amount}`}>
        <Icon name={TYPE_ICON[item.type]} size="var(--icon-sm)" className={styles.amountIcon} />
        {formatCurrency(item.amount, item.currency)}
      </p>
      <p className="text-secondary">
        {formatCurrency(item.monthlyEquivalent, item.currency)}/mo · {formatCurrency(item.annualEquivalent, item.currency)}/yr
      </p>

      <div className={styles.meta}>
        <span className="text-caption">Next occurrence: {item.next_occurrence_date}</span>
        {item.is_active && item.status !== 'ended' && <span className="text-caption">{occurrenceLabel(item)}</span>}
      </div>

      <div className={styles.actions}>
        {canRecord && (
          <Button variant="primary" onClick={() => onRecord(item)}>
            Record transaction
          </Button>
        )}
        <Button variant="ghost" onClick={() => onEdit(item)}>
          Edit
        </Button>
        <Button variant="ghost" onClick={() => onToggleActive(item)}>
          {item.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </Card>
  )
}

export default RecurringTransactionCard
