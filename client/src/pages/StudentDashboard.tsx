import { Link } from 'react-router-dom'
import { getStudentDashboard } from '../api'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { PageTransition } from '../components/PageTransition'
import { ProgressCircle } from '../components/ProgressCircle'
import { SectionBar } from '../components/SectionBar'
import { Skeleton } from '../components/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'
import { formatDate } from '../lib/format'

export function StudentDashboard() {
  const { data, loading, error, reload } = useAsyncData(getStudentDashboard)

  const progress = data?.progress
  const completion =
    progress && progress.totalCourses > 0
      ? Math.round((progress.coursesCompleted / progress.totalCourses) * 100)
      : 0

  return (
    <PageTransition>
      <SectionBar
        title="Mi panel"
        subtitle="Tu progreso, tus resultados y lo que sigue"
      />

      <div className="mx-auto max-w-5xl px-4 pb-16">
        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-28 w-full" />
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
            {/* Progress summary */}
            <div className="card flex flex-col items-center gap-6 p-6 md:flex-row md:gap-10">
              <div className="shrink-0">
                <ProgressCircle
                  value={completion}
                  size={150}
                  label={`Progreso general: ${completion}%`}
                />
              </div>
              <div className="grid flex-1 gap-4 sm:grid-cols-3">
                <StatCard
                  label="Cursos iniciados"
                  value={progress?.coursesStarted ?? 0}
                  icon="fa-play"
                />
                <StatCard
                  label="Cursos completados"
                  value={progress?.coursesCompleted ?? 0}
                  icon="fa-circle-check"
                />
                <StatCard
                  label="Total de cursos"
                  value={progress?.totalCourses ?? 0}
                  icon="fa-book"
                />
              </div>
            </div>

            {/* Results */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-primary">
                Mis resultados
              </h2>
              {data.results.length === 0 ? (
                <EmptyState
                  title="Aún no has presentado ningún examen"
                  description="Realiza un examen para ver tu historial aquí."
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
                          {result.courseSlug}
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
            </section>

            {/* Recommendations */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-primary">
                Recomendado para ti
              </h2>
              {data.recommendations.length === 0 ? (
                <EmptyState
                  title="¡Completaste todos los cursos!"
                  description="No quedan cursos pendientes por aprobar."
                />
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {data.recommendations.map((course) => (
                    <Link
                      key={course.id}
                      to={`/cursos/${course.slug}`}
                      className="card flex flex-col items-center p-5 text-center transition-all hover:-translate-y-1 hover:shadow-card-hover"
                    >
                      <img
                        src={`/images/${course.image}`}
                        alt={course.title}
                        className="mb-4 h-20 w-20 object-contain"
                      />
                      <p className="mb-1 font-semibold text-primary">
                        {course.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {course.minutes} minutos
                      </p>
                    </Link>
                  ))}
                </div>
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
    <div className="flex items-center gap-4 rounded-card bg-surface p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-lg text-primary">
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
      </span>
      <div>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}
