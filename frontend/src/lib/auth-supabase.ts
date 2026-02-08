import { supabase } from './supabase'

export type UserRole = 'user' | 'vendor'

export async function signUp(
  email: string,
  password: string,
  role: UserRole,
  fullName?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Provide specific error messages per CONTEXT.md
      const msg = String(error.message || '')
      if (msg.includes('Invalid login credentials')) {
        throw new Error('Email or password is incorrect')
      }
      if (msg.includes('Email not confirmed')) {
        throw new Error('Please verify your email before logging in')
      }
      throw new Error(msg || 'Login failed')
    }

    return data
  } catch (err) {
    // Ensure we always throw a clean Error object
    if (err instanceof Error) {
      throw err
    }
    throw new Error('Login failed')
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (error) throw error
}

// Helper to get current session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// Helper to get current user
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}
