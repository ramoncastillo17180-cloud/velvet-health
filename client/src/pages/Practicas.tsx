import { useNavigate } from 'react-router-dom'
import { getCourses } from '../api'
import { CourseCard } from '../components/CourseCard'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'
import { Skeleton } from '../components/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'

export function Practicas() {
  const navigate = useNavigate()
  const { data: courses, loading, error, reload } = useAsyncData(getCourses)

  return (
    <PageTransition>
      <SectionBar
        title="Catálogo de cursos"
        subtitle="Explora todos los cursos publicados y elige por dónde empezar"
      />

      <div className="mx-auto max-w-7xl px-4 pb-16">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="skeleton-card" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !courses || courses.length === 0 ? (
          <EmptyState
            title="Aún no hay cursos disponibles"
            description="Vuelve pronto: pronto publicaremos nuevos cursos de primeros auxilios."
          />
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
