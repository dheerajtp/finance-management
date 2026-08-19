import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

export const getTransactions = async (filters = {}) => {
  let query = supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.type) query = query.eq('type', filters.type)
  if (filters.accountId) query = query.eq('account_id', filters.accountId)
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.fromDate) query = query.gte('transaction_date', filters.fromDate)
  if (filters.toDate) query = query.lte('transaction_date', filters.toDate)
  if (filters.search) query = query.ilike('description', `%${filters.search}%`)
  if (filters.ids) query = query.in('id', filters.ids)
  if (filters.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getTransaction = async (id) => {
  const { data, error } = await supabase.from('transactions').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createTransaction = async (data) => {
  const user = await getCurrentUser()

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return transaction
}

export const updateTransaction = async (id, data) => {
  const { data: transaction, error } = await supabase
    .from('transactions')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return transaction
}

export const deleteTransaction = async (id) => {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}
