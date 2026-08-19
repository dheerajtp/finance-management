import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from '../api/useNotificationApi'

const toFriendlyMessage = () => 'Could not update notifications. Please try again.'

// Owns the notification center's list/filter/read/delete/navigate flow —
// used by both NotificationPanel (Header dropdown) and NotificationsPage.
// Never imports Supabase directly.
const useActionNotifications = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const queryFilters = filter === 'all' ? {} : { isRead: filter === 'read' }
  const notificationsQuery = useNotificationsQuery(queryFilters)
  const unreadCountQuery = useUnreadNotificationCountQuery()

  const markReadMutation = useMarkNotificationReadMutation()
  const markAllReadMutation = useMarkAllNotificationsReadMutation()
  const deleteMutation = useDeleteNotificationMutation()

  const [pendingDelete, setPendingDelete] = useState(null)

  // Read state is marked BEFORE navigating, and navigation only happens
  // when there's actually somewhere to go — a notification with no
  // action_path just gets marked read and the user stays put.
  const openNotification = async (notification) => {
    try {
      if (!notification.is_read) await markReadMutation.mutateAsync(notification.id)
      if (notification.action_path) navigate(notification.action_path)
    } catch {
      toast.error(toFriendlyMessage())
    }
  }

  const markAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync()
    } catch {
      toast.error(toFriendlyMessage())
    }
  }

  const requestDelete = (notification) => setPendingDelete(notification)
  const cancelDelete = () => setPendingDelete(null)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      setPendingDelete(null)
    } catch {
      toast.error(toFriendlyMessage())
    }
  }

  return {
    notifications: notificationsQuery.data ?? [],
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    refetch: notificationsQuery.refetch,

    unreadCount: unreadCountQuery.data ?? 0,

    filter,
    setFilter,

    openNotification,
    markAllRead,
    markingAllRead: markAllReadMutation.isPending,

    pendingDelete,
    requestDelete,
    cancelDelete,
    confirmDelete,
    deleting: deleteMutation.isPending,
  }
}

export default useActionNotifications
