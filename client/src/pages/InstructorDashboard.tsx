import { Link, useNavigate } from 'react-router-dom'
import { getInstructorDashboard } from '../api'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'
import { Skeleton } from '../components/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'
import { statusBadgeClass } from '../lib/badges'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  PUBLISHED: 'Publicado',
}

export function InstructorDashboard() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsyncData(getInstructorDashboard)

  const stats = data?.stats

  return (
    <PageTransition>
      <SectionBar
        title="Panel de instructor"
        subtitle="Tus cursos y su desempeño"
      />

      <div className="mx-auto max-w-5xl px-4 pb-16">
        <div className="mb-8 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/instructor/cursos/nuevo')}
            className="btn-primary"
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Crear curso
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <Skeleton key={item} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <EmptyState title="No hay datos disponibles" />
        ) : (
          <div className="space-y-10">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Cursos" value={stats?.totalCourses ?? 0} icon="fa-book" />
              <StatCard label="Borradores" value={stats?.draft ?? 0} icon="fa-pen" />
              <StatCard label="Pendientes" value={stats?.pending ?? 0} icon="fa-clock" />
              <StatCard
                label="Publicados"
                value={stats?.published ?? 0}
                icon="fa-circle-check"
              />
              <StatCard
                label="Estudiantes"
                value={stats?.totalStudents ?? 0}
                icon="fa-users"
              />
              <StatCard
                label="Resultados"
                value={stats?.totalResults ?? 0}
                icon="fa-file-lines"
              />
            </div>

            {/* Own courses */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-primary">
                Mis cursos
              </h2>
              {data.courses.length === 0 ? (
                <EmptyState
                  title="Aún no has creado cursos"
                  description="Crea tu primer curso para empezar a compartir contenido."
                  action={
                    <button
                      type="button"
                      onClick={() => navigate('/instructor/cursos/nuevo')}
                      className="btn-primary"
                    >
                      Crear curso
                    </button>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {data.courses.map((course) => (
                    <li
                      key={course.id}
                      className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          {course.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {course.minutes} minutos · {course.studentsCount}{' '}
                          estudiantes
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={statusBadgeClass(course.status)}>
                          {STATUS_LABEL[course.status] ?? course.status}
                        </span>
                        <Link
                          to={`/instructor/cursos/${course.id}/editar`}
                          className="btn-outline"
                        >
                          Editar
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </PageTransition>
  )
}

interface StatCardProps {
  label: string
  value: number
  icon: string
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-xl text-primary">
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
      </span>
      <div>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}
