import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

export const getContributions = async (filters = {}) => {
  let query = supabase.from('investment_contributions').select('*').order('contribution_date', { ascending: false })

  if (filters.holdingId) query = query.eq('holding_id', filters.holdingId)
  if (filters.planId) query = query.eq('plan_id', filters.planId)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.fromDate) query = query.gte('contribution_date', filters.fromDate)
  if (filters.toDate) query = query.lte('contribution_date', filters.toDate)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getContribution = async (id) => {
  const { data, error } = await supabase.from('investment_contributions').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createContribution = async (data) => {
  const user = await getCurrentUser()

  const { data: contribution, error } = await supabase
    .from('investment_contributions')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return contribution
}

export const updateContribution = async (id, data) => {
  const { data: contribution, error } = await supabase
    .from('investment_contributions')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return contribution
}

export const deleteContribution = async (id) => {
  const { error } = await supabase.from('investment_contributions').delete().eq('id', id)
  if (error) throw error
}
