import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

export const getSubscriptions = async (filters = {}) => {
  let query = supabase.from('subscriptions').select('*').order('next_billing_date', { ascending: true })

  if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getSubscription = async (id) => {
  const { data, error } = await supabase.from('subscriptions').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createSubscription = async (data) => {
  const user = await getCurrentUser()

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return subscription
}

export const updateSubscription = async (id, data) => {
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return subscription
}

export const deactivateSubscription = (id) => updateSubscription(id, { is_active: false })

export const activateSubscription = (id) => updateSubscription(id, { is_active: true })
