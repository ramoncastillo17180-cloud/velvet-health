import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCourse, getLessons } from '../api'
import type { CourseDetail, Lesson, Module } from '../api'
import { ErrorState } from '../components/ErrorState'
import { PageTransition } from '../components/PageTransition'
import { Skeleton } from '../components/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'

interface LessonPlayerData {
  course: CourseDetail
  modules: Module[]
}

/** Flattened lesson with its parent module id, for prev/next navigation. */
interface FlatLesson {
  moduleId: number
  lesson: Lesson
}

export function LessonPlayer() {
  const { slug } = useParams<{ slug: string }>()

  const { data, loading, error, reload } = useAsyncData<LessonPlayerData>(
    async () => {
      const [course, modules] = await Promise.all([
        getCourse(slug ?? ''),
        getLessons(slug ?? ''),
      ])
      return { course, modules }
    },
    [slug],
  )

  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)

  const flatLessons = useMemo<FlatLesson[]>(() => {
    if (!data) return []
    return data.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({ moduleId: module.id, lesson })),
    )
  }, [data])

  // Derive the active lesson during render: the user's explicit selection,
  // otherwise the first lesson of the course.
  const activeLessonId = selectedLessonId ?? flatLessons[0]?.lesson.id ?? null

  const activeIndex = flatLessons.findIndex(
    (item) => item.lesson.id === activeLessonId,
  )
  const active = activeIndex >= 0 ? flatLessons[activeIndex] : null
  const previous = activeIndex > 0 ? flatLessons[activeIndex - 1] : null
  const next =
    activeIndex >= 0 && activeIndex < flatLessons.length - 1
      ? flatLessons[activeIndex + 1]
      : null

  function selectLesson(lessonId: number) {
    setSelectedLessonId(lessonId)
  }

  if (loading && !data) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-7xl px-4 py-10">
          <Skeleton className="mb-4 h-8 w-64" />
          <div className="flex flex-col gap-6 md:flex-row">
            <Skeleton className="h-96 w-full md:w-72" />
            <Skeleton className="h-96 flex-1" />
          </div>
        </div>
      </PageTransition>
    )
  }

  if (error) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <ErrorState error={error} onRetry={reload} />
        </div>
      </PageTransition>
    )
  }

  if (!data) return null

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Link
          to={`/cursos/${data.course.slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <i className="fa-solid fa-arrow-left" aria-hidden="true" />
          Volver al curso
        </Link>

        <h1 className="mb-6 text-2xl font-semibold text-primary-dark sm:text-3xl">
          {data.course.title}
        </h1>

        {flatLessons.length === 0 ? (
          <div className="card p-8 text-center text-gray-600">
            Este curso aún no tiene lecciones publicadas.
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Module / lesson navigation */}
            <aside className="w-full shrink-0 lg:w-80">
              <nav
                className="card max-h-[70vh] overflow-y-auto p-4"
                aria-label="Contenido del curso"
              >
                {data.modules.map((module) => (
                  <div key={module.id} className="mb-2">
                    <p className="mb-1 px-3 text-sm font-semibold text-primary-dark">
                      {module.title}
                    </p>
                    <ul className="space-y-1">
                      {module.lessons.map((lesson) => {
                        const activeLesson = activeLessonId === lesson.id
                        return (
                          <li key={lesson.id}>
                            <button
                              type="button"
                              onClick={() => selectLesson(lesson.id)}
                              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                activeLesson
                                  ? 'bg-green-selected font-semibold text-primary'
                                  : 'text-gray-600 hover:bg-green-50'
                              }`}
                            >
                              <i
                                className={`fa-solid text-xs ${
                                  activeLesson ? 'fa-circle-play' : 'fa-circle'
                                }`}
                                aria-hidden="true"
                              />
                              <span>{lesson.title}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </aside>

            {/* Lesson content */}
            <section className="card flex-1 p-6 sm:p-8">
              {active && (
                <>
                  <p className="mb-1 text-sm font-semibold text-muted">
                    {data.modules.find((m) => m.id === active.moduleId)?.title ??
                      ''}
                  </p>
                  <h2 className="mb-4 text-xl font-semibold text-gray-800">
                    {active.lesson.title}
                  </h2>
                  <div className="whitespace-pre-line text-base leading-relaxed text-gray-700">
                    {active.lesson.content}
                  </div>
                </>
              )}

              <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                {previous ? (
                  <button
                    type="button"
                    onClick={() => selectLesson(previous.lesson.id)}
                    className="btn-outline"
                  >
                    <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                    Anterior
                  </button>
                ) : (
                  <span />
                )}
                {next ? (
                  <button
                    type="button"
                    onClick={() => selectLesson(next.lesson.id)}
                    className="btn-primary"
                  >
                    Siguiente
                    <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  </button>
                ) : (
                  <Link
                    to={`/cursos/${data.course.slug}/examen`}
                    className="btn-primary"
                  >
                    Ir al examen
                    <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
