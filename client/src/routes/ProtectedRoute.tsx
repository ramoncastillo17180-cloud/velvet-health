import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { hasToken } from '../api'

/**
 * Guards protected routes. Redirects unauthenticated users to /login,
 * remembering where they were headed so login can return them.
 */
export function ProtectedRoute() {
  const location = useLocation()

  if (!hasToken()) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  return <Outlet />
}
