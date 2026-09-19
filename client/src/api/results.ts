// Results endpoints (real API only — no offline mock fallback).

import { apiFetch } from './client'
import type { ExamResult, ResultsResponse } from './types'

export async function getResults(): Promise<ExamResult[]> {
  const data = await apiFetch<ResultsResponse>('/me/results', { auth: true })
  return data.results
}
