import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ApiError,
  clearToken,
  getMe,
  getToken,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  setToken,
} from '../api'
import type { AuthUser, LoginPayload, RegisterPayload, Role } from '../api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Hydrate the session from the stored token on first mount.
  useEffect(() => {
    let active = true
    async function hydrate() {
      if (!getToken()) {
        if (active) setLoading(false)
        return
      }
      try {
        const me = await getMe()
        if (active) setUser(me)
      } catch (error) {
        // A 401 means the token is expired, invalidated (password reset), or
        // malformed — drop it. Network/5xx errors keep the token so a refresh
        // can retry hydration without forcing a fresh login.
        if (error instanceof ApiError && error.status === 401) {
          clearToken()
        }
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    hydrate()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await apiLogin(payload)
    setToken(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiRegister(payload)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // Token is discarded locally regardless of the remote outcome.
    }
    clearToken()
    setUser(null)
  }, [])

  const hasRole = useCallback((role: Role) => user?.role === role, [user])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isStudent: user?.role === 'STUDENT',
      isInstructor: user?.role === 'INSTRUCTOR',
      isAdmin: user?.role === 'ADMIN',
      hasRole,
    }),
    [user, loading, login, register, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
