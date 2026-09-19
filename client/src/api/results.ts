// Results and users endpoints with offline mock fallback.

import { NetworkError, apiFetch } from './client'
import { mockGetResults } from './mock'
import type { ExamResult, PublicUser, ResultsResponse } from './types'

export async function getResults(): Promise<ExamResult[]> {
  try {
    const data = await apiFetch<ResultsResponse>('/me/results', { auth: true })
    return data.results
  } catch (error) {
    if (error instanceof NetworkError) return mockGetResults()
    throw error
  }
}

export async function getUsers(): Promise<PublicUser[]> {
  try {
    const data = await apiFetch<{ users: PublicUser[] }>('/users', {
      auth: true,
    })
    return data.users
  } catch (error) {
    if (error instanceof NetworkError) return []
    throw error
  }
}
