import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

export const getGoals = async (filters = {}) => {
  let query = supabase.from('goals').select('*').order('priority', { ascending: true }).order('created_at', { ascending: true })

  if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive)
  if (filters.priority) query = query.eq('priority', filters.priority)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getGoal = async (id) => {
  const { data, error } = await supabase.from('goals').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createGoal = async (data) => {
  const user = await getCurrentUser()

  const { data: goal, error } = await supabase
    .from('goals')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return goal
}

export const updateGoal = async (id, data) => {
  const { data: goal, error } = await supabase.from('goals').update(data).eq('id', id).select().single()
  if (error) throw error
  return goal
}

export const deactivateGoal = (id) => updateGoal(id, { is_active: false })

export const activateGoal = (id) => updateGoal(id, { is_active: true })
