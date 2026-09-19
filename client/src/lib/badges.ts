import type { ApplicationStatus, CourseStatus, Role } from '../api'

const ROLE_STYLES: Record<Role, string> = {
  STUDENT: 'bg-green-100 text-primary-dark',
  INSTRUCTOR: 'bg-pending/15 text-pending',
  ADMIN: 'bg-rejected/15 text-rejected',
}

const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Estudiante',
  INSTRUCTOR: 'Instructor',
  ADMIN: 'Admin',
}

const STATUS_STYLES: Record<CourseStatus | ApplicationStatus, string> = {
  DRAFT: 'bg-draft/15 text-draft',
  PENDING: 'bg-pending/15 text-pending',
  PUBLISHED: 'bg-published/15 text-published',
  REJECTED: 'bg-rejected/15 text-rejected',
  APPROVED: 'bg-approved/15 text-approved',
}

export function roleBadgeClass(role: Role): string {
  return `badge-role ${ROLE_STYLES[role]}`
}

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role]
}

export function statusBadgeClass(status: CourseStatus | ApplicationStatus): string {
  return `badge-status ${STATUS_STYLES[status]}`
}
