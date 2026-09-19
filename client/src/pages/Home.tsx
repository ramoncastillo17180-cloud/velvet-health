import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCourses } from '../api'
import type { Course } from '../api'
import { CourseCard } from '../components/CourseCard'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'

export function Home() {
  const [courses, setCourses] = useState<Course[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getCourses()
      .then((data) => {
        if (active) setCourses(data)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function toggle(slug: string) {
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const selectedCourses = useMemo(
    () => courses.filter((course) => selected.has(course.slug)),
    [courses, selected],
  )

  return (
    <PageTransition>
      <SectionBar title="Selección de Cursos" />
      <div className="mx-auto max-w-7xl px-4 pb-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex-1 space-y-4">
            {loading ? (
              <p className="text-gray-500">Cargando cursos…</p>
            ) : (
              courses.map((course) => (
                <CourseCard
                  key={course.id}
                  variant="selectable"
                  course={course}
                  selected={selected.has(course.slug)}
                  onToggle={() => toggle(course.slug)}
                />
              ))
            )}
          </div>

          <aside className="w-full shrink-0 rounded-card-lg border border-gray-200 bg-white p-6 lg:w-80">
            <h2 className="mb-3 text-xl font-semibold text-primary">
              Cursos seleccionados
            </h2>
            {selectedCourses.length === 0 ? (
              <p className="mb-4 text-sm text-gray-500">
                Selecciona al menos un curso para comenzar.
              </p>
            ) : (
              <ul className="mb-4 space-y-2 text-gray-700">
                {selectedCourses.map((course) => (
                  <li key={course.id} className="flex items-center gap-2">
                    <i
                      className="fa-solid fa-check text-success"
                      aria-hidden="true"
                    />
                    <span>{course.title}</span>
                  </li>
                ))}
                <li className="border-t border-gray-200 pt-2 font-semibold">
                  Total {selectedCourses.length}
                </li>
              </ul>
            )}
            <Link to="/practicas" className="btn-primary w-full">
              Comenzar tus prácticas
            </Link>
          </aside>
        </div>
      </div>
    </PageTransition>
  )
}
