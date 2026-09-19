import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCourses, getResults } from '../api'
import type { Course, ExamResult } from '../api'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../lib/format'

export function Perfil() {
  const { user } = useAuth()

  const [results, setResults] = useState<ExamResult[]>([])
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      getResults(),
      getCourses().catch(() => [] as Course[]),
    ])
      .then(([res, courses]) => {
        if (!active) return
        setResults(res)
        const map: Record<string, string> = {}
        for (const course of courses) map[course.slug] = course.title
        setTitles(map)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <PageTransition>
      <SectionBar title="Mi perfil" />

      <div className="mx-auto max-w-3xl px-4 pb-12">
        <div className="card mb-8 flex flex-col gap-1 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-primary">
              <i className="fa-solid fa-user" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {user?.nombre ?? 'Usuario'}
              </h2>
              <p className="text-sm text-gray-500">
                {user?.correo ?? ''}
              </p>
            </div>
          </div>
          <Link to="/practicas" className="btn-outline">
            Ir a los cursos
          </Link>
        </div>

        <h3 className="mb-4 text-xl font-semibold text-primary">
          Historial de exámenes
        </h3>

        {loading ? (
          <p className="text-gray-500">Cargando historial…</p>
        ) : results.length === 0 ? (
          <div className="card p-8 text-center text-gray-600">
            <p className="mb-2">
              Aún no has presentado ningún examen.
            </p>
            <p className="text-sm text-gray-500">
              Comienza un curso y realiza su examen para ver tu progreso aquí.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {results.map((result) => (
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
                        : 'bg-red-50 text-red-600'
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
