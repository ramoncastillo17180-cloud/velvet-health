import { Link, useNavigate } from 'react-router-dom'
import { getCourses } from '../api'
import { CourseCard } from '../components/CourseCard'
import { DecorSquares } from '../components/DecorSquares'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'
import { Skeleton } from '../components/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'

const FEATURES = [
  {
    icon: 'fa-graduation-cap',
    title: 'Cursos interactivos',
    description:
      'Contenido estructurado en módulos y lecciones, diseñado por profesionales de la salud.',
  },
  {
    icon: 'fa-clipboard-check',
    title: 'Exámenes certificados',
    description:
      'Evalúa tu conocimiento con exámenes corregidos al instante y obtén tu puntaje.',
  },
  {
    icon: 'fa-heart-pulse',
    title: 'Salva vidas',
    description:
      'Domina técnicas de primeros auxilios que pueden marcar la diferencia en una emergencia.',
  },
]

export function Landing() {
  const navigate = useNavigate()
  const { data: courses, loading, error, reload } = useAsyncData(getCourses)

  return (
    <PageTransition>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-green-100 bg-gradient-to-b from-green-50 to-transparent">
        <DecorSquares variant="header" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 text-center sm:py-24">
          <p className="mb-5 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-primary shadow-sm">
            Primeros auxilios · Educación certificada
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-primary-dark sm:text-6xl">
            Aprende a salvar vidas
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
            Velvet Health te prepara para actuar ante emergencias con cursos
            interactivos, exámenes certificados y el respaldo de instructores
            expertos.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/registro" className="btn-primary px-8 py-3.5 text-lg">
              Comenzar gratis
            </Link>
            <Link to="/practicas" className="btn-outline px-8 py-3.5 text-lg">
              Explorar cursos
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="card flex flex-col items-center p-8 text-center"
            >
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-primary">
                <i className={`fa-solid ${feature.icon}`} aria-hidden="true" />
              </span>
              <h3 className="mb-2 text-xl font-semibold text-primary-dark">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Published catalog */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <SectionBar
          title="Cursos publicados"
          subtitle="Elige un curso y comienza a aprender hoy mismo"
        />

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="skeleton-card" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !courses || courses.length === 0 ? (
          <EmptyState
            title="Aún no hay cursos"
            description="Pronto publicaremos nuevos cursos de primeros auxilios."
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
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-primary-dark">
        <DecorSquares variant="footer" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            ¿Listo para marcar la diferencia?
          </h2>
          <p className="mt-3 text-lg text-green-100">
            Únete a Velvet Health y conviértete en alguien preparado para salvar
            vidas.
          </p>
          <Link
            to="/registro"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-lg font-bold text-primary-dark shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            Crear mi cuenta
          </Link>
        </div>
      </section>
    </PageTransition>
  )
}
