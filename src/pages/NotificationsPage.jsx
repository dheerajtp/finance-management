import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import Select from '../components/ui/Select'
import Skeleton from '../components/ui/Skeleton'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import NotificationCard from '../components/notifications/NotificationCard'
import useActionNotifications from '../hooks/functionality/useActionNotifications'
import styles from './NotificationsPage.module.css'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
]

const NotificationsPage = () => {
  const {
    notifications,
    isLoading,
    isError,
    refetch,
    unreadCount,
    filter,
    setFilter,
    openNotification,
    markAllRead,
    markingAllRead,
    pendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleting,
  } = useActionNotifications()

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up.'}
        actions={
          unreadCount > 0 && (
            <Button variant="secondary" onClick={markAllRead} loading={markingAllRead}>
              Mark all as read
            </Button>
          )
        }
      />

      <div className={styles.filters}>
        <Select
          id="notification-filter"
          label="Show"
          options={FILTER_OPTIONS}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </div>

      {isLoading && (
        <div className={styles.list}>
          <Skeleton height="4.5rem" radius="var(--radius-lg)" />
          <Skeleton height="4.5rem" radius="var(--radius-lg)" />
          <Skeleton height="4.5rem" radius="var(--radius-lg)" />
        </div>
      )}

      {!isLoading && isError && <ErrorState message="We couldn't load your notifications." onRetry={refetch} />}

      {!isLoading && !isError && notifications.length === 0 && (
        <EmptyState
          icon="bell"
          title={filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
          description="Financial reminders and milestones will show up here as they happen."
        />
      )}

      {!isLoading && !isError && notifications.length > 0 && (
        <div className={styles.list}>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onOpen={openNotification}
              onDelete={requestDelete}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete this notification?"
        message={pendingDelete ? `"${pendingDelete.title}" will be removed. This can't be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}

export default NotificationsPage
