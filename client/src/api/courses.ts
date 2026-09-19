// Course endpoints (real API only — no offline mock fallback).

import { apiFetch } from './client'
import type {
  Course,
  CourseDetail,
  CoursesResponse,
  CourseResponse,
  LessonsResponse,
  Module,
} from './types'

export async function getCourses(): Promise<Course[]> {
  const data = await apiFetch<CoursesResponse>('/courses')
  return data.courses
}

export async function getCourse(slug: string): Promise<CourseDetail> {
  const data = await apiFetch<CourseResponse>(`/courses/${slug}`)
  return data.course
}

export async function getLessons(slug: string): Promise<Module[]> {
  const data = await apiFetch<LessonsResponse>(`/courses/${slug}/lessons`)
  return data.modules
}
