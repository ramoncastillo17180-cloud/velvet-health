import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Role } from '../api'
import { Skeleton } from '../components/Skeleton'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  /** When set, only these roles may pass; any other authenticated user goes home. */
  roles?: Role[]
}

/**
 * Guards protected routes:
 * - No token → redirect to /login, remembering the intended path.
 * - Session still hydrating → render a skeleton (avoid a redirect flash).
 * - Authenticated but wrong role → redirect to /.
 */
export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const location = useLocation()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
