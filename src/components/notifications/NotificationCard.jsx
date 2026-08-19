import { formatDistanceToNow, parseISO } from 'date-fns'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import styles from './NotificationCard.module.css'

const TYPE_ICON = {
  recurring_due: 'calendarCheck',
  recurring_overdue: 'calendarCheck',
  subscription_upcoming: 'refresh',
  subscription_due: 'refresh',
  budget_attention: 'target',
  budget_over_limit: 'target',
  goal_milestone: 'flag',
  goal_target_reached: 'flag',
  emergency_fund_milestone: 'shield',
  emergency_fund_target_reached: 'shield',
  profile_incomplete: 'user',
  financial_freedom_insufficient_history: 'compass',
}

const SEVERITY_VARIANT = { info: 'info', success: 'success', warning: 'warning' }

// One notification, in either the Header dropdown or the full page — same
// card either way, `compact` only trims the delete action for the dropdown.
const NotificationCard = ({ notification, onOpen, onDelete, compact = false }) => {
  return (
    <div className={`${styles.card} ${notification.is_read ? '' : styles.unread}`}>
      <button type="button" className={styles.main} onClick={() => onOpen(notification)}>
        <span className={`${styles.iconWrap} ${styles[SEVERITY_VARIANT[notification.severity] ?? 'info']}`}>
          <Icon name={TYPE_ICON[notification.type] ?? 'bell'} size="var(--icon-sm)" />
        </span>
        <div className={styles.body}>
          <div className={styles.headline}>
            <p className="text-card-title">{notification.title}</p>
            {!notification.is_read && <span className={styles.dot} aria-label="Unread" />}
          </div>
          <p className="text-secondary">{notification.message}</p>
          <p className="text-caption">{formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}</p>
        </div>
      </button>

      {!compact && onDelete && (
        <Button variant="ghost" className={styles.deleteButton} onClick={() => onDelete(notification)}>
          <Icon name="trash" size="var(--icon-xs)" />
        </Button>
      )}
    </div>
  )
}

export default NotificationCard
