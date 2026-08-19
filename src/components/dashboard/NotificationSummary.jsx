import { Link, useNavigate } from 'react-router-dom'
import Section from '../ui/Section'
import Badge from '../ui/Badge'
import Icon from '../ui/Icon'
import Skeleton from '../ui/Skeleton'
import { useNotificationsQuery, useMarkNotificationReadMutation } from '../../hooks/api/useNotificationApi'
import styles from './NotificationSummary.module.css'

const SEVERITY_VARIANT = { info: 'info', success: 'success', warning: 'warning' }
const PREVIEW_SIZE = 3

// Only ever the top 3 unread — never the full notification history (see
// task notes). Reuses the same notification query hooks the panel/page use,
// not a new data source.
const NotificationSummary = () => {
  const navigate = useNavigate()
  const unreadQuery = useNotificationsQuery({ isRead: false })
  const markReadMutation = useMarkNotificationReadMutation()

  const preview = (unreadQuery.data ?? []).slice(0, PREVIEW_SIZE)

  if (unreadQuery.isLoading) return <Skeleton height="8rem" radius="var(--radius-lg)" />
  if (preview.length === 0) return null

  const handleOpen = (notification) => {
    markReadMutation.mutate(notification.id)
    if (notification.action_path) navigate(notification.action_path)
  }

  const viewAll = (
    <Link to="/notifications" className={styles.viewAll}>
      View all
      <Icon name="chevronRight" size="var(--icon-xs)" />
    </Link>
  )

  return (
    <Section title="Needs Your Attention" actions={viewAll}>
      <div className={styles.list}>
        {preview.map((notification) => (
          <button key={notification.id} type="button" className={styles.row} onClick={() => handleOpen(notification)}>
            <span className="text-body">{notification.title}</span>
            <Badge variant={SEVERITY_VARIANT[notification.severity] ?? 'info'}>{notification.severity}</Badge>
          </button>
        ))}
      </div>
    </Section>
  )
}

export default NotificationSummary
