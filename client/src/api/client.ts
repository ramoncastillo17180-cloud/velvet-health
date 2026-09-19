// ============================================================
// HTTP client + JWT token helpers for the Velvet Health API.
// All requests go through `apiFetch`; auth attaches the bearer
// token automatically when `auth: true` is set.
// ============================================================

import type { ApiErrorBody } from './types'

const BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

const TOKEN_KEY = 'velvet.token'

/** API error with a well-known code, per the contract error format. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** Raised when the backend is unreachable (network layer failure). */
export class NetworkError extends Error {
  constructor(message = 'No se pudo conectar con el servidor') {
    super(message)
    this.name = 'NetworkError'
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function hasToken(): boolean {
  return getToken() !== null
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = false } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new NetworkError()
  }

  if (res.status === 204) {
    return undefined as T
  }

  const data = (await parseBody(res)) as ApiErrorBody | T | null

  if (!res.ok) {
    const err = data as ApiErrorBody | null
    throw new ApiError(
      res.status,
      err?.error?.code ?? 'UNKNOWN_ERROR',
      err?.error?.message ?? 'Error del servidor',
    )
  }

  return data as T
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}
