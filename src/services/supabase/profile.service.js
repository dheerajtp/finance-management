import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

const UNIQUE_VIOLATION = '23505'

export const getProfile = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error) throw error
  return data
}

export const createProfile = async (data) => {
  const user = await getCurrentUser()

  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({ id: user.id, ...data })
    .select()
    .single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return getProfile()
    }
    throw error
  }

  return profile
}

export const updateProfile = async (data) => {
  const user = await getCurrentUser()

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return profile
}
