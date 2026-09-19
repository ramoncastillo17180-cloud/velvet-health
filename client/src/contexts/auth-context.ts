import { createContext } from 'react'
import type { AuthUser, LoginPayload, RegisterPayload } from '../api'

export interface AuthContextValue {
  /** Currently authenticated user, or null when logged out. */
  user: AuthUser | null
  /** True while the initial session hydration is in flight. */
  loading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)
