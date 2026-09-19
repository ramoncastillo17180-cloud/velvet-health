// Exam endpoints.

import { apiFetch } from './client'
import type { Answer, Exam, ExamResponse, ExamSubmitResult } from './types'

export async function getExam(slug: string): Promise<Exam> {
  const data = await apiFetch<ExamResponse>(`/courses/${slug}/exam`, {
    auth: true,
  })
  return data.exam
}

export async function submitExam(
  slug: string,
  answers: Answer[],
): Promise<ExamSubmitResult> {
  return await apiFetch<ExamSubmitResult>(
    `/courses/${slug}/exam/submit`,
    { method: 'POST', body: { answers }, auth: true },
  )
}
