// Auth endpoints with offline mock fallback.

import { NetworkError, apiFetch } from './client'
import { mockGetMe, mockLogin, mockRegister } from './mock'
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  User,
} from './types'

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    return await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: payload,
    })
  } catch (error) {
    if (error instanceof NetworkError) return mockLogin(payload)
    throw error
  }
}

export async function register(payload: RegisterPayload): Promise<User> {
  try {
    const data = await apiFetch<{ user: User }>('/auth/register', {
      method: 'POST',
      body: payload,
    })
    return data.user
  } catch (error) {
    if (error instanceof NetworkError) return mockRegister(payload)
    throw error
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST', auth: true })
  } catch (error) {
    if (error instanceof NetworkError) return
    throw error
  }
}

export async function getMe(): Promise<AuthUser> {
  try {
    const data = await apiFetch<{ user: AuthUser }>('/auth/me', { auth: true })
    return data.user
  } catch (error) {
    if (error instanceof NetworkError) return mockGetMe()
    throw error
  }
}
