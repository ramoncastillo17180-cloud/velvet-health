import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, getCourse } from '../api'
import type { CourseDetail as CourseDetailData } from '../api'
import { InstructionsList } from '../components/InstructionsList'
import { PageTransition } from '../components/PageTransition'
import { ProgressCircle } from '../components/ProgressCircle'
import { SectionBar } from '../components/SectionBar'

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
  const instructionsRef = useRef<HTMLDivElement>(null)

  const [course, setCourse] = useState<CourseDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    let active = true
    getCourse(slug)
      .then((data) => {
        if (active) setCourse(data)
      })
      .catch((error: unknown) => {
        if (active && error instanceof ApiError && error.status === 404) {
          setNotFound(true)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [slug])

  function scrollToInstructions() {
    instructionsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <PageTransition>
        <SectionBar title="Curso Seleccionado" />
        <p className="mx-auto max-w-7xl px-4 text-gray-500">Cargando curso…</p>
      </PageTransition>
    )
  }

  if (notFound || !course) {
    return (
      <PageTransition>
        <SectionBar title="Curso Seleccionado" />
        <div className="mx-auto max-w-7xl px-4 pb-12 text-center">
          <p className="mb-4 text-gray-600">No se encontró este curso.</p>
          <Link to="/practicas" className="btn-primary">
            Ver todos los cursos
          </Link>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <SectionBar title="Curso Seleccionado" />

      <div className="mx-auto max-w-7xl px-4">
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
                className="fa-solid fa-heart-pulse text-red-500"
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
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-outline"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={scrollToInstructions}
                className="btn-primary"
              >
                Siguiente
              </button>
            </div>
          </section>
        </div>

        <div ref={instructionsRef} className="pt-6">
          <SectionBar title="Instrucciones" />
          <div className="card p-6">
            <InstructionsList instructions={course.instructions} />
          </div>
        </div>

        <div className="flex justify-center pb-16 pt-10">
          <Link
            to={`/cursos/${course.slug}/examen`}
            className="btn-light"
          >
            Realizar Examen
          </Link>
        </div>
      </div>
    </PageTransition>
  )
}
