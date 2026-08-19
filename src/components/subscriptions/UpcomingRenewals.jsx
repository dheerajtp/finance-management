import Card from '../ui/Card'
import Icon from '../ui/Icon'
import { formatCurrency } from '../../utils/finance/currency'
import styles from './UpcomingRenewals.module.css'

const renewalLabel = (daysUntilRenewal) => {
  if (daysUntilRenewal < 0) return `${Math.abs(daysUntilRenewal)}d overdue`
  if (daysUntilRenewal === 0) return 'Renews today'
  return `In ${daysUntilRenewal}d`
}

// Only rendered when there's something upcoming — the page skips this
// section entirely otherwise, same as any other empty-state boundary.
const UpcomingRenewals = ({ subscriptions }) => {
  if (subscriptions.length === 0) return null

  return (
    <Card className={styles.card}>
      <p className="text-section-title">Upcoming renewals</p>
      <div className={styles.list}>
        {subscriptions.map((subscription) => (
          <div key={subscription.id} className={styles.row}>
            <span className={styles.rowIcon}>
              <Icon name="refresh" size="var(--icon-sm)" />
            </span>
            <div className={styles.identity}>
              <p className="text-card-title">{subscription.name}</p>
              <p className="text-caption">{subscription.next_billing_date}</p>
            </div>
            <div className={styles.amountCol}>
              <p className="text-body">{formatCurrency(subscription.amount, subscription.currency)}</p>
              <p className={`text-caption ${subscription.status === 'overdue' ? styles.overdue : ''}`}>
                {renewalLabel(subscription.daysUntilRenewal)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default UpcomingRenewals
