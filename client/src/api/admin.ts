// Admin endpoints — instructor-application moderation, course moderation, the
// admin user list, and credential-document download. All routes require the
// bearer token; the server enforces ADMIN-only.

import { apiDownload, apiFetch } from './client'
import type {
  AdminCourse,
  AdminCoursesResponse,
  AdminUsersResponse,
  ApplicationStatus,
  CourseStatus,
  CourseStatusResponse,
  InstructorApplication,
  InstructorApplicationsResponse,
  User,
} from './types'

// ---- Instructor applications ----

export async function listInstructorApplications(
  status?: ApplicationStatus,
): Promise<InstructorApplication[]> {
  const query = status ? `?status=${status}` : ''
  const data = await apiFetch<InstructorApplicationsResponse>(
    `/admin/instructor-applications${query}`,
    { auth: true },
  )
  return data.applications
}

export async function approveInstructorApplication(
  id: number,
  notes?: string,
): Promise<{ id: number; status: ApplicationStatus; reviewedAt: string | null }> {
  const data = await apiFetch<{
    application: {
      id: number
      status: ApplicationStatus
      reviewedAt: string | null
    }
  }>(`/admin/instructor-applications/${id}/approve`, {
    method: 'POST',
    body: { reviewNotes: notes },
    auth: true,
  })
  return data.application
}

export async function rejectInstructorApplication(
  id: number,
  notes: string,
): Promise<{ id: number; status: ApplicationStatus }> {
  const data = await apiFetch<{ application: { id: number; status: ApplicationStatus } }>(
    `/admin/instructor-applications/${id}/reject`,
    { method: 'POST', body: { reviewNotes: notes }, auth: true },
  )
  return data.application
}

// ---- Course moderation ----

export async function listPendingCourses(): Promise<AdminCourse[]> {
  const data = await apiFetch<AdminCoursesResponse>(
    '/admin/courses?status=PENDING',
    { auth: true },
  )
  return data.courses
}

export async function approveCourse(
  id: number,
): Promise<{ id: number; status: CourseStatus }> {
  const data = await apiFetch<CourseStatusResponse>(
    `/admin/courses/${id}/approve`,
    { method: 'POST', auth: true },
  )
  return data.course
}

export async function rejectCourse(
  id: number,
): Promise<{ id: number; status: CourseStatus }> {
  const data = await apiFetch<CourseStatusResponse>(
    `/admin/courses/${id}/reject`,
    { method: 'POST', auth: true },
  )
  return data.course
}

// ---- Users + documents ----

export async function listUsers(): Promise<User[]> {
  const data = await apiFetch<AdminUsersResponse>('/admin/users', { auth: true })
  return data.users
}

export function downloadDocument(id: number): Promise<void> {
  return apiDownload(`/admin/documents/${id}`, 'documento')
}
