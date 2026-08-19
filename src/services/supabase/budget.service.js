import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

export const getBudgets = async (filters = {}) => {
  let query = supabase.from('budgets').select('*').order('created_at', { ascending: true })

  if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getBudget = async (id) => {
  const { data, error } = await supabase.from('budgets').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createBudget = async (data) => {
  const user = await getCurrentUser()

  const { data: budget, error } = await supabase
    .from('budgets')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return budget
}

export const updateBudget = async (id, data) => {
  const { data: budget, error } = await supabase.from('budgets').update(data).eq('id', id).select().single()
  if (error) throw error
  return budget
}

export const deactivateBudget = (id) => updateBudget(id, { is_active: false })

export const activateBudget = (id) => updateBudget(id, { is_active: true })
