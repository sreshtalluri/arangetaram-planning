import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'vendor'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isVendor, isUser, loading } = useAuth()
  const location = useLocation()

  // Show nothing while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save intended destination for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role if required
  if (requiredRole === 'vendor' && !isVendor) {
    return <Navigate to="/" replace />
  }
  if (requiredRole === 'user' && !isUser) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
