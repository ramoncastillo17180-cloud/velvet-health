// Exam endpoints with offline mock fallback.

import { ApiError, NetworkError, apiFetch } from './client'
import { mockGetExam, mockSubmitExam } from './mock'
import type {
  Answer,
  Exam,
  ExamResponse,
  ExamSubmitResult,
} from './types'

export async function getExam(slug: string): Promise<Exam> {
  try {
    const data = await apiFetch<ExamResponse>(`/courses/${slug}/exam`, {
      auth: true,
    })
    return data.exam
  } catch (error) {
    if (error instanceof NetworkError) {
      const exam = mockGetExam(slug)
      if (!exam) throw new ApiError(404, 'NOT_FOUND', 'Examen no encontrado')
      return exam
    }
    throw error
  }
}

export async function submitExam(
  slug: string,
  answers: Answer[],
): Promise<ExamSubmitResult> {
  try {
    return await apiFetch<ExamSubmitResult>(
      `/courses/${slug}/exam/submit`,
      { method: 'POST', body: { answers }, auth: true },
    )
  } catch (error) {
    if (error instanceof NetworkError) return mockSubmitExam(slug, answers)
    throw error
  }
}
