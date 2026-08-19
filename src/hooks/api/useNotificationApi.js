import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as notificationService from '../../services/supabase/notification.service'

export const notificationKeys = {
  list: (filters = {}) => ['notifications', filters],
  unreadCount: ['notifications', 'unread-count'],
  detail: (id) => ['notification', id],
}

export const useNotificationsQuery = (filters = {}) =>
  useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationService.getNotifications(filters),
  })

export const useUnreadNotificationCountQuery = () =>
  useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: notificationService.getUnreadCount,
  })

export const useNotificationQuery = (id) =>
  useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: () => notificationService.getNotification(id),
    enabled: Boolean(id),
  })

const useInvalidateNotifications = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }
}

export const useCreateNotificationMutation = () => {
  const invalidate = useInvalidateNotifications()
  return useMutation({ mutationFn: notificationService.createNotification, onSuccess: invalidate })
}

export const useMarkNotificationReadMutation = () => {
  const invalidate = useInvalidateNotifications()
  return useMutation({ mutationFn: notificationService.markAsRead, onSuccess: invalidate })
}

export const useMarkAllNotificationsReadMutation = () => {
  const invalidate = useInvalidateNotifications()
  return useMutation({ mutationFn: notificationService.markAllAsRead, onSuccess: invalidate })
}

export const useDeleteNotificationMutation = () => {
  const invalidate = useInvalidateNotifications()
  return useMutation({ mutationFn: notificationService.deleteNotification, onSuccess: invalidate })
}

export const useDeleteExpiredNotificationsMutation = () => {
  const invalidate = useInvalidateNotifications()
  return useMutation({ mutationFn: notificationService.deleteExpiredNotifications, onSuccess: invalidate })
}
