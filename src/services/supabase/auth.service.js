import { supabase } from './supabaseClient'

const unwrap = ({ data, error }) => {
  if (error) throw error
  return data
}

export const register = async (email, password) => unwrap(await supabase.auth.signUp({ email, password }))

export const login = async (email, password) =>
  unwrap(await supabase.auth.signInWithPassword({ email, password }))

export const logout = async () => unwrap(await supabase.auth.signOut())

// Relies on the already-authenticated session (no current-password field
// needed — that's how Supabase's own updateUser flow works), so this is
// the smallest safe addition: no new backend, no service-role key.
export const changePassword = async (newPassword) => unwrap(await supabase.auth.updateUser({ password: newPassword }))

export const getCurrentUser = async () => (await unwrap(await supabase.auth.getUser())).user

export const getSession = async () => (await unwrap(await supabase.auth.getSession())).session

export const restoreSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session?.user ?? null
}

export const onAuthStateChange = (callback) => supabase.auth.onAuthStateChange(callback)
