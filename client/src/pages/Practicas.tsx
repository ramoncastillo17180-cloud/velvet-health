import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCourses } from '../api'
import type { Course } from '../api'
import { CourseCard } from '../components/CourseCard'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'

export function Practicas() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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

  return (
    <PageTransition>
      <SectionBar title="Cursos" />
      <div className="mx-auto max-w-7xl px-4 pb-12">
        {loading ? (
          <p className="text-gray-500">Cargando cursos…</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                variant="catalog"
                course={course}
                onStart={() => navigate(`/cursos/${course.slug}`)}
              />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
