import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

const UNIQUE_VIOLATION = '23505'

export const getNotifications = async (filters = {}) => {
  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false })

  if (filters.isRead !== undefined) query = query.eq('is_read', filters.isRead)
  if (filters.type) query = query.eq('type', filters.type)
  if (filters.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getUnreadCount = async () => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) throw error
  return count ?? 0
}

export const getNotification = async (id) => {
  const { data, error } = await supabase.from('notifications').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

// A unique-violation here means this exact event (user_id + dedupe_key)
// already has a notification — that's the expected, benign outcome of
// syncing against data that hasn't changed, not an error. Returning null
// lets useNotificationSync treat "already exists" and "just created" the
// same way (nothing further to do).
export const createNotification = async (data) => {
  const user = await getCurrentUser()

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return null
    throw error
  }

  return notification
}

export const markAsRead = async (id) => {
  const { data: notification, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return notification
}

export const markAllAsRead = async () => {
  const user = await getCurrentUser()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) throw error
}

export const deleteNotification = async (id) => {
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) throw error
}

// Cleanup only — never runs on a timer/cron (see task notes), only ever
// triggered alongside a sync. Never removes a notification that hasn't
// expired, regardless of read state.
export const deleteExpiredNotifications = async () => {
  const { error } = await supabase.from('notifications').delete().not('expires_at', 'is', null).lt('expires_at', new Date().toISOString())
  if (error) throw error
}
