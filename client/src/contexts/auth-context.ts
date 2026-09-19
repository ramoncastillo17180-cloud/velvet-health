import { createContext } from 'react'
import type { AuthUser, LoginPayload, RegisterPayload, Role } from '../api'

export interface AuthContextValue {
  /** Currently authenticated user, or null when logged out. */
  user: AuthUser | null
  /** True while the initial session hydration is in flight. */
  loading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  /** Role helpers derived from the current user. */
  isStudent: boolean
  isInstructor: boolean
  isAdmin: boolean
  hasRole: (role: Role) => boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)
