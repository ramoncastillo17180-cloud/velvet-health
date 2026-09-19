// Role-scoped dashboard endpoints (real API only).

import { apiFetch } from './client'
import type {
  AdminDashboard,
  InstructorDashboard,
  StudentDashboard,
} from './types'

export async function getStudentDashboard(): Promise<StudentDashboard> {
  const data = await apiFetch<{ dashboard: StudentDashboard }>('/me/dashboard', {
    auth: true,
  })
  return data.dashboard
}

export async function getInstructorDashboard(): Promise<InstructorDashboard> {
  const data = await apiFetch<{ dashboard: InstructorDashboard }>(
    '/instructor/dashboard',
    { auth: true },
  )
  return data.dashboard
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const data = await apiFetch<{ dashboard: AdminDashboard }>('/admin/dashboard', {
    auth: true,
  })
  return data.dashboard
}
