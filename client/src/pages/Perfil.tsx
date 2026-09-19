import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getCourses, getResults } from '../api'
import type { Course } from '../api'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'
import { Skeleton } from '../components/Skeleton'
import { useAuth } from '../hooks/useAuth'
import { useAsyncData } from '../hooks/useAsyncData'
import { roleBadgeClass, roleLabel } from '../lib/badges'
import { formatDate } from '../lib/format'

interface ProfileData {
  results: Awaited<ReturnType<typeof getResults>>
  courses: Course[]
}

export function Perfil() {
  const { user } = useAuth()

  const { data, loading, error, reload } = useAsyncData<ProfileData>(async () => {
    const [results, courses] = await Promise.all([
      getResults(),
      getCourses().catch(() => [] as Course[]),
    ])
    return { results, courses }
  })

  const titles = useMemo(() => {
    const map: Record<string, string> = {}
    for (const course of data?.courses ?? []) map[course.slug] = course.title
    return map
  }, [data])

  const stats = useMemo(() => {
    const results = data?.results ?? []
    const total = results.length
    const approved = results.filter((result) => result.passed).length
    const average =
      total > 0
        ? Math.round(
            results.reduce((sum, result) => sum + result.score, 0) / total,
          )
        : 0
    return { total, approved, average }
  }, [data])

  return (
    <PageTransition>
      <SectionBar title="Mi perfil" />

      <div className="mx-auto max-w-3xl px-4 pb-16">
        {/* Identity card */}
        <div className="card mb-8 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-50 text-2xl font-semibold text-primary">
              {(user?.nombre ?? 'U').charAt(0).toUpperCase()}
            </span>
            <div>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
                {user?.nombre ?? 'Usuario'}
              </h2>
              <p className="text-sm text-gray-500">{user?.correo ?? ''}</p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {user && (
              <span className={roleBadgeClass(user.role)}>
                {roleLabel(user.role)}
              </span>
            )}
            <Link to="/practicas" className="btn-outline">
              Ir a los cursos
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Exámenes" value={stats.total} icon="fa-file-lines" />
          <StatCard
            label="Aprobados"
            value={stats.approved}
            icon="fa-circle-check"
          />
          <StatCard label="Promedio" value={`${stats.average}%`} icon="fa-chart-simple" />
        </div>

        <h3 className="mb-4 text-xl font-semibold text-primary">
          Historial de exámenes
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-20 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data || data.results.length === 0 ? (
          <EmptyState
            title="Aún no has presentado ningún examen"
            description="Comienza un curso y realiza su examen para ver tu progreso aquí."
            action={
              <Link to="/practicas" className="btn-primary">
                Explorar cursos
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {data.results.map((result) => (
              <li
                key={result.id}
                className="card flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {titles[result.courseSlug] ?? result.courseSlug}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(result.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      result.passed
                        ? 'bg-green-50 text-primary'
                        : 'bg-red-50 text-danger'
                    }`}
                  >
                    {result.passed ? 'Aprobado' : 'No aprobado'}
                  </span>
                  <span className="text-lg font-semibold text-gray-800">
                    {result.score}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageTransition>
  )
}

interface StatCardProps {
  label: string
  value: number | string
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
