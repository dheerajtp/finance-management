import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

export const getGoalContributions = async (goalId) => {
  const { data, error } = await supabase
    .from('goal_contributions')
    .select('*')
    .eq('goal_id', goalId)
    .order('contribution_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getGoalContribution = async (id) => {
  const { data, error } = await supabase.from('goal_contributions').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createGoalContribution = async (data) => {
  const user = await getCurrentUser()

  const { data: contribution, error } = await supabase
    .from('goal_contributions')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return contribution
}

export const updateGoalContribution = async (id, data) => {
  const { data: contribution, error } = await supabase
    .from('goal_contributions')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return contribution
}

export const deleteGoalContribution = async (id) => {
  const { error } = await supabase.from('goal_contributions').delete().eq('id', id)
  if (error) throw error
}
