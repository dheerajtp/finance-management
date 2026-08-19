import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

export const getPlans = async (filters = {}) => {
  let query = supabase.from('investment_plans').select('*').order('start_date', { ascending: true })

  if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive)
  if (filters.holdingId) query = query.eq('holding_id', filters.holdingId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getPlan = async (id) => {
  const { data, error } = await supabase.from('investment_plans').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createPlan = async (data) => {
  const user = await getCurrentUser()

  const { data: plan, error } = await supabase
    .from('investment_plans')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return plan
}

export const updatePlan = async (id, data) => {
  const { data: plan, error } = await supabase.from('investment_plans').update(data).eq('id', id).select().single()
  if (error) throw error
  return plan
}

export const pausePlan = (id) => updatePlan(id, { is_active: false })

export const resumePlan = (id) => updatePlan(id, { is_active: true })

// "Ended" isn't a separate stored state — it's an end_date the schedule has
// passed (see utils/finance/investments.js's calculateContributionStatus).
// Setting end_date to today is the one concrete action a user can take to
// deliberately end a plan now rather than waiting for a future date.
export const endPlan = (id) => updatePlan(id, { end_date: new Date().toISOString().slice(0, 10), is_active: false })
