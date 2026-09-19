// Auth endpoints (real API only — no offline mock fallback).

import { apiFetch } from './client'
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  MessageResponse,
  RegisterPayload,
  User,
} from './types'

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export async function register(payload: RegisterPayload): Promise<User> {
  const data = await apiFetch<{ user: User }>('/auth/register', {
    method: 'POST',
    body: payload,
  })
  return data.user
}

export async function logout(): Promise<void> {
  await apiFetch<void>('/auth/logout', { method: 'POST', auth: true })
}

export async function getMe(): Promise<AuthUser> {
  const data = await apiFetch<{ user: AuthUser }>('/auth/me', { auth: true })
  return data.user
}

export async function forgotPassword(correo: string): Promise<MessageResponse> {
  return await apiFetch<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    body: { correo },
  })
}

export async function resetPassword(
  token: string,
  contraseña: string,
): Promise<MessageResponse> {
  return await apiFetch<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    body: { token, contraseña },
  })
}
