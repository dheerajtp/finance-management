import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

export const getGoalTransactionAllocations = async (filters = {}) => {
  let query = supabase
    .from('goal_transaction_allocations')
    .select('*')
    .order('contribution_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.goalId) query = query.eq('goal_id', filters.goalId)
  if (filters.transactionId) query = query.eq('transaction_id', filters.transactionId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getGoalTransactionAllocation = async (id) => {
  const { data, error } = await supabase.from('goal_transaction_allocations').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createGoalTransactionAllocation = async (data) => {
  const user = await getCurrentUser()

  const { data: allocation, error } = await supabase
    .from('goal_transaction_allocations')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return allocation
}

// Edit intentionally only ever sends { amount, note } — goal_id,
// transaction_id, and contribution_date are stable once created (see task
// notes: changing the underlying relationship means delete + recreate, not
// an edit, to avoid allocation-reconciliation complexity).
export const updateGoalTransactionAllocation = async (id, data) => {
  const { data: allocation, error } = await supabase
    .from('goal_transaction_allocations')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return allocation
}

export const deleteGoalTransactionAllocation = async (id) => {
  const { error } = await supabase.from('goal_transaction_allocations').delete().eq('id', id)
  if (error) throw error
}

export const getGoalAllocationTotal = async (goalId) => {
  const { data, error } = await supabase.from('goal_transaction_allocations').select('amount').eq('goal_id', goalId)
  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
}

export const getTransactionAllocatedAmount = async (transactionId) => {
  const { data, error } = await supabase
    .from('goal_transaction_allocations')
    .select('amount')
    .eq('transaction_id', transactionId)
  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
}
