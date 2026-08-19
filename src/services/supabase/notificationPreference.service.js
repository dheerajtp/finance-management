import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

const UNIQUE_VIOLATION = '23505'

export const getPreferences = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

export const createPreferences = async (data = {}) => {
  const user = await getCurrentUser()

  const { data: preferences, error } = await supabase
    .from('notification_preferences')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return getPreferences()
    throw error
  }

  return preferences
}

export const updatePreferences = async (data) => {
  const user = await getCurrentUser()

  const { data: preferences, error } = await supabase
    .from('notification_preferences')
    .update(data)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return preferences
}
