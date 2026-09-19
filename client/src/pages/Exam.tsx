import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, getExam, submitExam } from '../api'
import type { Answer, Exam as ExamData, ExamSubmitResult } from '../api'
import { ExamQuestion } from '../components/ExamQuestion'
import { PageTransition } from '../components/PageTransition'
import { ProgressCircle } from '../components/ProgressCircle'
import { SectionBar } from '../components/SectionBar'

export function Exam() {
  const { slug } = useParams<{ slug: string }>()

  const [exam, setExam] = useState<ExamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<ExamSubmitResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let active = true
    getExam(slug)
      .then((data) => {
        if (active) setExam(data)
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

  function selectOption(questionId: number, optionId: number) {
    setAnswers((previous) => ({ ...previous, [questionId]: optionId }))
  }

  const allAnswered =
    exam?.questions.every((question) => answers[question.id] != null) ?? false

  async function handleSubmit() {
    if (!slug || !exam) return
    setSubmitError(null)
    setSubmitting(true)
    try {
      const payload: Answer[] = exam.questions.map((question) => ({
        questionId: question.id,
        optionId: answers[question.id],
      }))
      const res = await submitExam(slug, payload)
      setResult(res)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Error al enviar el examen',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <SectionBar title="Examen" />

      <div className="mx-auto max-w-3xl px-4 pb-12">
        {loading && <p className="text-gray-500">Cargando examen…</p>}

        {notFound && (
          <div className="text-center">
            <p className="mb-4 text-gray-600">No se encontró este examen.</p>
            <Link to="/practicas" className="btn-primary">
              Volver a los cursos
            </Link>
          </div>
        )}

        {exam && !result && (
          <div className="space-y-6">
            <p className="text-gray-600">
              Responde todas las preguntas. Necesitas un 70% para aprobar.
            </p>
            {exam.questions.map((question, index) => (
              <ExamQuestion
                key={question.id}
                question={question}
                index={index}
                selectedOptionId={answers[question.id] ?? null}
                onSelect={(optionId) => selectOption(question.id, optionId)}
              />
            ))}
            {submitError && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </p>
            )}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                className="btn-primary px-10"
              >
                {submitting ? 'Enviando…' : 'Enviar examen'}
              </button>
            </div>
            {!allAnswered && (
              <p className="text-center text-sm text-gray-500">
                Responde todas las preguntas para enviar el examen.
              </p>
            )}
          </div>
        )}

        {result && (
          <div className="card p-8 text-center">
            <ProgressCircle
              value={result.score}
              size={170}
              label={`Puntaje del examen: ${result.score}%`}
            />
            <h2
              className={`mt-4 text-2xl font-semibold ${
                result.passed ? 'text-primary' : 'text-red-600'
              }`}
            >
              {result.passed ? '¡Aprobado!' : 'No aprobado'}
            </h2>
            <p className="mt-2 text-gray-600">
              Obtuviste un puntaje de{' '}
              <strong className="text-gray-800">{result.score}%</strong>.
              {result.passed
                ? ' Felicitaciones por completar el curso.'
                : ' Necesitas al menos 70% para aprobar. Inténtalo de nuevo.'}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to={`/cursos/${slug}`} className="btn-outline">
                Volver al curso
              </Link>
              {!result.passed && (
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="btn-primary"
                >
                  Reintentar examen
                </button>
              )}
              <Link to="/perfil" className="btn-primary">
                Ver mi perfil
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
