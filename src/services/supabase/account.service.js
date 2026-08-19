import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

export const getAccounts = async () => {
  const { data, error } = await supabase.from('accounts').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export const getAccount = async (id) => {
  const { data, error } = await supabase.from('accounts').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createAccount = async (data) => {
  const user = await getCurrentUser()

  const { data: account, error } = await supabase
    .from('accounts')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return account
}

export const updateAccount = async (id, data) => {
  const { data: account, error } = await supabase.from('accounts').update(data).eq('id', id).select().single()
  if (error) throw error
  return account
}

export const deactivateAccount = (id) => updateAccount(id, { is_active: false })

export const activateAccount = (id) => updateAccount(id, { is_active: true })
