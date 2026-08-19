import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { BILLING_FREQUENCY_MAP } from '../../constants/subscriptionFrequency'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './SubscriptionCard.module.css'

const STATUS_LABELS = {
  active: 'Active',
  renewing_soon: 'Renewing soon',
  overdue: 'Overdue',
  inactive: 'Inactive',
}

// Restrained on purpose — only an actually-overdue renewal reads as
// alarming. A subscription simply renewing soon is normal, expected
// activity, not something to flag red.
const STATUS_BADGE_VARIANT = {
  active: 'neutral',
  renewing_soon: 'info',
  overdue: 'danger',
  inactive: 'neutral',
}

const renewalLabel = (daysUntilRenewal) => {
  if (daysUntilRenewal < 0) return `${Math.abs(daysUntilRenewal)} day${daysUntilRenewal === -1 ? '' : 's'} overdue`
  if (daysUntilRenewal === 0) return 'Renews today'
  return `In ${daysUntilRenewal} day${daysUntilRenewal === 1 ? '' : 's'}`
}

const SubscriptionCard = ({ subscription, onEdit, onToggleActive }) => {
  const frequencyLabel = BILLING_FREQUENCY_MAP[subscription.billing_frequency]?.label ?? subscription.billing_frequency

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className="text-card-title">{subscription.name}</p>
          <p className="text-caption">
            {frequencyLabel}
            {subscription.accountName ? ` · ${subscription.accountName}` : ''}
          </p>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[subscription.status] ?? 'neutral'}>
          {STATUS_LABELS[subscription.status] ?? subscription.status}
        </Badge>
      </div>

      <div className={styles.headline}>
        <p className="text-metric">{formatCurrency(subscription.amount, subscription.currency)}</p>
        <p className="text-secondary">
          {formatCurrency(subscription.monthlyEquivalent, subscription.currency)}/mo ·{' '}
          {formatCurrency(subscription.annualCost, subscription.currency)}/yr
        </p>
      </div>

      {subscription.description && <p className="text-secondary">{subscription.description}</p>}

      <div className={styles.meta}>
        <span className="text-caption">Next billing: {subscription.next_billing_date}</span>
        {subscription.is_active && <span className="text-caption">{renewalLabel(subscription.daysUntilRenewal)}</span>}
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => onEdit(subscription)}>
          Edit
        </Button>
        <Button variant="ghost" onClick={() => onToggleActive(subscription)}>
          {subscription.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </Card>
  )
}

export default SubscriptionCard
