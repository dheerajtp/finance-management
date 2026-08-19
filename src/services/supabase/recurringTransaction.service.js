import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

export const getRecurringTransactions = async (filters = {}) => {
  let query = supabase.from('recurring_transactions').select('*').order('next_occurrence_date', { ascending: true })

  if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive)
  if (filters.type) query = query.eq('type', filters.type)
  if (filters.accountId) query = query.eq('account_id', filters.accountId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getRecurringTransaction = async (id) => {
  const { data, error } = await supabase.from('recurring_transactions').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createRecurringTransaction = async (data) => {
  const user = await getCurrentUser()

  const { data: recurringTransaction, error } = await supabase
    .from('recurring_transactions')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return recurringTransaction
}

export const updateRecurringTransaction = async (id, data) => {
  const { data: recurringTransaction, error } = await supabase
    .from('recurring_transactions')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return recurringTransaction
}

export const deactivateRecurringTransaction = (id) => updateRecurringTransaction(id, { is_active: false })

export const activateRecurringTransaction = (id) => updateRecurringTransaction(id, { is_active: true })

// Advances the schedule after an occurrence has been confirmed into an
// actual transaction. There's no separate occurrence-log table (see the
// 0012 migration notes) — next_occurrence_date moving forward IS the
// "processed" marker, so this is a normal update, not a new mechanism.
// transactionId isn't persisted (the schema has no column for it — the
// generated transaction is only ever looked up from the transactions table
// itself); it's accepted here so callers have a single, named place this
// bookkeeping happens if a future task adds an audit column for it.
export const markRecurringTransactionProcessed = (id, { nextOccurrenceDate }) =>
  updateRecurringTransaction(id, { next_occurrence_date: nextOccurrenceDate })
