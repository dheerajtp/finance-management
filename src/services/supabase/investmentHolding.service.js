import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

export const getHoldings = async (filters = {}) => {
  let query = supabase.from('investment_holdings').select('*').order('created_at', { ascending: true })

  if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive)
  if (filters.accountId) query = query.eq('account_id', filters.accountId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getHolding = async (id) => {
  const { data, error } = await supabase.from('investment_holdings').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createHolding = async (data) => {
  const user = await getCurrentUser()

  const { data: holding, error } = await supabase
    .from('investment_holdings')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return holding
}

export const updateHolding = async (id, data) => {
  const { data: holding, error } = await supabase
    .from('investment_holdings')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return holding
}

export const deactivateHolding = (id) => updateHolding(id, { is_active: false })

export const activateHolding = (id) => updateHolding(id, { is_active: true })
