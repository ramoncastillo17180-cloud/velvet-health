// Course endpoints with offline mock fallback.

import { ApiError, NetworkError, apiFetch } from './client'
import { mockCourseDetails, mockCourses } from './mock'
import type { Course, CourseDetail, CoursesResponse, CourseResponse } from './types'

export async function getCourses(): Promise<Course[]> {
  try {
    const data = await apiFetch<CoursesResponse>('/courses')
    return data.courses
  } catch (error) {
    if (error instanceof NetworkError) return mockCourses
    throw error
  }
}

export async function getCourse(slug: string): Promise<CourseDetail> {
  try {
    const data = await apiFetch<CourseResponse>(`/courses/${slug}`)
    return data.course
  } catch (error) {
    if (error instanceof NetworkError) {
      const course = mockCourseDetails[slug]
      if (!course) throw new ApiError(404, 'NOT_FOUND', 'Curso no encontrado')
      return course
    }
    throw error
  }
}
