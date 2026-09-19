import { useState } from 'react'
import { approveCourse, listPendingCourses, rejectCourse } from '../api'
import type { AdminCourse } from '../api'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'
import { Skeleton } from '../components/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'

export function AdminCourses() {
  const { data, loading, error, reload } = useAsyncData(listPendingCourses)

  return (
    <PageTransition>
      <SectionBar
        title="Cursos pendientes"
        subtitle="Aprueba o rechaza los cursos enviados a revisión"
      />

      <div className="mx-auto max-w-4xl px-4 pb-16">
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-40 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="No hay cursos pendientes"
            description="Todos los cursos enviados a revisión ya fueron moderados."
          />
        ) : (
          <ul className="space-y-4">
            {data.map((course) => (
              <CourseRow key={course.id} course={course} onChanged={reload} />
            ))}
          </ul>
        )}
      </div>
    </PageTransition>
  )
}

function CourseRow({
  course,
  onChanged,
}: {
  course: AdminCourse
  onChanged: () => void
}) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setError(null)
    setBusy('approve')
    try {
      await approveCourse(course.id)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar')
      setBusy(null)
    }
  }

  async function handleReject() {
    setError(null)
    setBusy('reject')
    try {
      await rejectCourse(course.id)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar')
      setBusy(null)
    }
  }

  return (
    <li className="card p-6">
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-gray-800">{course.title}</p>
          <p className="text-sm text-gray-500">
            {course.minutes} minutos · por {course.createdBy.nombre}{' '}
            {course.createdBy.apellidos}
          </p>
        </div>
      </div>
      <p className="mb-4 text-sm text-gray-600">{course.description}</p>
      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleReject}
          disabled={busy !== null}
          className="rounded-full border-2 border-red-200 bg-white px-5 py-2 text-sm font-semibold text-danger transition-colors hover:bg-red-50 disabled:opacity-60"
        >
          {busy === 'reject' ? 'Rechazando…' : 'Rechazar'}
        </button>
        <button
          type="button"
          onClick={handleApprove}
          disabled={busy !== null}
          className="btn-primary px-5 py-2 text-sm"
        >
          {busy === 'approve' ? 'Aprobando…' : 'Aprobar'}
        </button>
      </div>
    </li>
  )
}
