import { Link } from 'react-router-dom'
import Button from '../ui/Button'
import Skeleton from '../ui/Skeleton'
import ErrorState from '../ui/ErrorState'
import EmptyState from '../ui/EmptyState'
import NotificationCard from './NotificationCard'
import useActionNotifications from '../../hooks/functionality/useActionNotifications'
import styles from './NotificationPanel.module.css'

const PANEL_PREVIEW_SIZE = 8

const NotificationPanel = ({ onClose }) => {
  const { notifications, isLoading, isError, unreadCount, openNotification, markAllRead, markingAllRead } =
    useActionNotifications()

  // Unread first, then most recent — the list itself is already
  // created_at-desc from the service, so this is a stable partition, not a
  // re-sort of time order within each group.
  const preview = [...notifications]
    .sort((a, b) => Number(a.is_read) - Number(b.is_read))
    .slice(0, PANEL_PREVIEW_SIZE)

  const handleOpen = (notification) => {
    openNotification(notification)
    onClose()
  }

  return (
    <div className={styles.panel} role="dialog" aria-label="Notifications">
      <div className={styles.header}>
        <p className="text-section-title">Notifications</p>
        {unreadCount > 0 && (
          <Button variant="ghost" className={styles.markAllButton} onClick={markAllRead} loading={markingAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className={styles.body}>
        {isLoading && (
          <div className={styles.skeletonStack}>
            <Skeleton height="3.5rem" radius="var(--radius-md)" />
            <Skeleton height="3.5rem" radius="var(--radius-md)" />
            <Skeleton height="3.5rem" radius="var(--radius-md)" />
          </div>
        )}

        {!isLoading && isError && <ErrorState message="We couldn't load notifications." />}

        {!isLoading && !isError && preview.length === 0 && (
          <EmptyState icon="bell" title="You're all caught up" description="Nothing needs your attention right now." />
        )}

        {!isLoading && !isError && preview.length > 0 && (
          <div className={styles.list}>
            {preview.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} onOpen={handleOpen} compact />
            ))}
          </div>
        )}
      </div>

      <Link to="/notifications" className={styles.viewAll} onClick={onClose}>
        View all notifications
      </Link>
    </div>
  )
}

export default NotificationPanel
