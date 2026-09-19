import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  clearToken,
  getMe,
  getToken,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  setToken,
} from '../api'
import type { AuthUser, LoginPayload, RegisterPayload } from '../api'
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
      } catch {
        clearToken()
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

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
