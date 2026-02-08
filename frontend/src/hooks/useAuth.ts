import { useAuthContext } from '../contexts/AuthContext'
import { useProfile } from './useProfile'

export function useAuth() {
  const { session, user, loading: authLoading, signUp, signIn, signOut } = useAuthContext()
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile(user?.id)

  // Derive role from profile (database source of truth) or user metadata (fallback)
  const role = profile?.role ?? (user?.user_metadata?.role as 'user' | 'vendor' | undefined)

  // Convenience checks
  const isAuthenticated = !!session
  const isGuest = !session
  const isVendor = role === 'vendor'
  const isUser = role === 'user'

  return {
    // Session & User
    session,
    user,
    profile,

    // Loading states
    loading: authLoading || (isAuthenticated && profileLoading),

    // Role & Auth status
    role,
    isAuthenticated,
    isGuest,
    isVendor,
    isUser,

    // Auth actions
    signUp,
    signIn,
    signOut,

    // Profile error (for debugging)
    profileError,
  }
}

// Re-export for convenience
export type { UserRole } from '../lib/auth-supabase'
