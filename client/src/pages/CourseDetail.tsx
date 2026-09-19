import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCourse } from '../api'
import { ErrorState } from '../components/ErrorState'
import { InstructionsList } from '../components/InstructionsList'
import { PageTransition } from '../components/PageTransition'
import { ProgressCircle } from '../components/ProgressCircle'
import { SectionBar } from '../components/SectionBar'
import { Skeleton } from '../components/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'

// Legacy editorial copy, keyed by the fixed course slugs.
const questionTitle: Record<string, string> = {
  rcp: '¿Qué es la RCP?',
  hemorragias: '¿Cómo detener una hemorragia?',
  heimlich: '¿Qué es la Maniobra de Heimlich?',
}

const motivational: Record<string, string> = {
  rcp: 'Aprender RCP puede marcar la diferencia entre la vida y la muerte. ¡Cualquiera puede salvar una vida con el conocimiento adecuado!',
  hemorragias:
    'Aplicar presión directa y mantener la calma puede salvar una vida en situaciones críticas.',
  heimlich: 'Es una acción simple que puede salvar vidas en segundos.',
}

const FALLBACK_MOTIVATIONAL =
  'Aprender primeros auxilios puede marcar la diferencia entre la vida y la muerte.'

export function CourseDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const { data: course, loading, error, reload } = useAsyncData(
    () => getCourse(slug ?? ''),
    [slug],
  )

  if (loading && !course) {
    return (
      <PageTransition>
        <SectionBar title="Curso" />
        <div className="mx-auto max-w-7xl px-4">
          <Skeleton className="mb-8 h-48 w-full" />
          <Skeleton className="mb-4 h-8 w-72" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <SectionBar title="Curso" />
        <div className="mx-auto max-w-3xl px-4">
          <ErrorState error={error} onRetry={reload} />
        </div>
      </PageTransition>
    )
  }

  if (!course) return null

  const hasModules = course.modules.length > 0

  return (
    <PageTransition>
      <SectionBar title="Curso" />

      <div className="mx-auto max-w-7xl px-4 pb-16">
        {/* Hero card */}
        <div className="card flex flex-col gap-8 p-6 md:flex-row md:items-center md:gap-12">
          <aside className="flex flex-col items-center text-center md:shrink-0">
            <h2 className="mb-6 text-2xl font-semibold text-gray-800">
              {course.title}
            </h2>
            <ProgressCircle
              value={0}
              image={`/images/${course.image}`}
              imageAlt={course.title}
              label={`Progreso del curso ${course.title}`}
            />
          </aside>

          <section className="flex-1">
            <h3 className="mb-4 flex items-center gap-2 text-2xl text-gray-800">
              <i
                className="fa-solid fa-heart-pulse text-danger"
                aria-hidden="true"
              />
              {questionTitle[course.slug] ?? `¿Qué es ${course.title}?`}
            </h3>
            <p className="mb-4 text-lg leading-relaxed text-gray-600">
              {course.description}
            </p>
            <p className="mb-6 italic text-gray-500">
              {motivational[course.slug] ?? FALLBACK_MOTIVATIONAL}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-primary">
                <i className="fa-solid fa-clock" aria-hidden="true" />
                {course.minutes} minutos
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-primary">
                <i className="fa-solid fa-percent" aria-hidden="true" />
                Aprueba con {course.passThreshold}%
              </span>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-outline"
              >
                Atrás
              </button>
              {hasModules && (
                <Link
                  to={`/cursos/${course.slug}/aprender`}
                  className="btn-primary"
                >
                  Comenzar a aprender
                </Link>
              )}
            </div>
          </section>
        </div>

        {/* Lesson list */}
        {hasModules ? (
          <div className="pt-10">
            <SectionBar title="Contenido del curso" />
            <div className="space-y-6">
              {course.modules.map((module) => (
                <div key={module.id} className="card p-6">
                  <h3 className="mb-1 text-lg font-semibold text-primary-dark">
                    {module.title}
                  </h3>
                  {module.description && (
                    <p className="mb-4 text-sm text-gray-500">
                      {module.description}
                    </p>
                  )}
                  <ul className="space-y-2">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          to={`/cursos/${course.slug}/aprender`}
                          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-surface px-4 py-3 transition-colors hover:border-green-300 hover:bg-green-50"
                        >
                          <i
                            className="fa-solid fa-circle-play text-success"
                            aria-hidden="true"
                          />
                          <span className="flex-1 font-medium text-gray-700">
                            {lesson.title}
                          </span>
                          {lesson.durationMinutes != null && (
                            <span className="text-sm text-gray-400">
                              {lesson.durationMinutes} min
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="pt-6">
            <SectionBar title="Instrucciones" />
            <div className="card p-6">
              <InstructionsList instructions={course.instructions} />
            </div>
          </div>
        )}

        {/* Exam CTA */}
        <div className="flex justify-center pb-4 pt-12">
          <Link to={`/cursos/${course.slug}/examen`} className="btn-light">
            Realizar Examen
          </Link>
        </div>
      </div>
    </PageTransition>
  )
}
