import { Link } from 'react-router-dom'
import { getAdminDashboard } from '../api'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'
import { Skeleton } from '../components/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'

export function AdminDashboard() {
  const { data, loading, error, reload } = useAsyncData(getAdminDashboard)

  const counts = data?.counts

  return (
    <PageTransition>
      <SectionBar
        title="Panel de administración"
        subtitle="Resumen de la plataforma"
      />

      <div className="mx-auto max-w-5xl px-4 pb-16">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data ? (
          <EmptyState title="No hay datos disponibles" />
        ) : (
          <div className="space-y-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Usuarios" value={counts?.users ?? 0} icon="fa-users" />
              <StatCard
                label="Estudiantes"
                value={counts?.students ?? 0}
                icon="fa-graduation-cap"
              />
              <StatCard
                label="Instructores"
                value={counts?.instructors ?? 0}
                icon="fa-chalkboard-user"
              />
              <StatCard
                label="Administradores"
                value={counts?.admins ?? 0}
                icon="fa-shield-halved"
              />
              <StatCard
                label="Cursos publicados"
                value={counts?.publishedCourses ?? 0}
                icon="fa-circle-check"
              />
              <StatCard
                label="Resultados de exámenes"
                value={counts?.results ?? 0}
                icon="fa-file-lines"
              />
            </div>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-primary">
                Moderación
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <ModerationCard
                  to="/admin/solicitudes"
                  title="Solicitudes de instructor"
                  pending={counts?.pendingApplications ?? 0}
                  total={counts?.applications ?? 0}
                  icon="fa-id-badge"
                />
                <ModerationCard
                  to="/admin/cursos"
                  title="Cursos pendientes"
                  pending={counts?.pendingCourses ?? 0}
                  total={counts?.courses ?? 0}
                  icon="fa-book-open"
                />
                <ModerationCard
                  to="/admin/usuarios"
                  title="Usuarios"
                  pending={0}
                  total={counts?.users ?? 0}
                  icon="fa-users-gear"
                />
              </div>
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

interface ModerationCardProps {
  to: string
  title: string
  pending: number
  total: number
  icon: string
}

function ModerationCard({ to, title, pending, total, icon }: ModerationCardProps) {
  return (
    <Link
      to={to}
      className="card flex flex-col gap-3 p-5 transition-all hover:-translate-y-1 hover:shadow-card-hover"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-xl text-primary">
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
      </span>
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">
          {pending > 0 ? (
            <span className="font-semibold text-pending">
              {pending} pendiente{pending !== 1 ? 's' : ''}
            </span>
          ) : (
            `${total} en total`
          )}
        </p>
      </div>
    </Link>
  )
}
