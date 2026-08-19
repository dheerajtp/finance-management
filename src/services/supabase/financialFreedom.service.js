import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

const UNIQUE_VIOLATION = '23505'

export const getSettings = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('financial_freedom_settings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

export const createSettings = async (data) => {
  const user = await getCurrentUser()

  const { data: settings, error } = await supabase
    .from('financial_freedom_settings')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return getSettings()
    throw error
  }

  return settings
}

export const updateSettings = async (data) => {
  const user = await getCurrentUser()

  const { data: settings, error } = await supabase
    .from('financial_freedom_settings')
    .update(data)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return settings
}
