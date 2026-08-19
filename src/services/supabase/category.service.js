import { supabase } from './supabaseClient'
import { getCurrentUser } from './auth.service'

export const getCategories = async (filters = {}) => {
  let query = supabase.from('categories').select('*').order('name', { ascending: true })

  if (filters.type) query = query.eq('type', filters.type)
  if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive)

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getCategory = async (id) => {
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export const createCategory = async (data) => {
  const user = await getCurrentUser()

  const { data: category, error } = await supabase
    .from('categories')
    .insert({ ...data, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return category
}

export const updateCategory = async (id, data) => {
  const { data: category, error } = await supabase.from('categories').update(data).eq('id', id).select().single()
  if (error) throw error
  return category
}

export const deactivateCategory = (id) => updateCategory(id, { is_active: false })

export const activateCategory = (id) => updateCategory(id, { is_active: true })

// Runs public.initialize_default_categories() (SECURITY INVOKER — see
// 0004_create_categories.sql) under the current session's own RLS-scoped
// permissions. Idempotent: safe to call on every first visit to /categories.
export const initializeDefaultCategories = async () => {
  const { error } = await supabase.rpc('initialize_default_categories')
  if (error) throw error
}
