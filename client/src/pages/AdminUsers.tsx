import { listUsers } from '../api'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'
import { Skeleton } from '../components/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'
import { roleBadgeClass, roleLabel } from '../lib/badges'
import { formatDate } from '../lib/format'

export function AdminUsers() {
  const { data, loading, error, reload } = useAsyncData(listUsers)

  return (
    <PageTransition>
      <SectionBar
        title="Usuarios"
        subtitle="Todos los usuarios registrados en la plataforma"
      />

      <div className="mx-auto max-w-4xl px-4 pb-16">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="No hay usuarios" />
        ) : (
          <ul className="space-y-3">
            {data.map((user) => (
              <li
                key={user.id}
                className="card flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {user.nombre} {user.apellidos}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.correo}
                    {user.profesion ? ` · ${user.profesion}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">
                    {formatDate(user.createdAt)}
                  </span>
                  <span className={roleBadgeClass(user.role)}>
                    {roleLabel(user.role)}
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
