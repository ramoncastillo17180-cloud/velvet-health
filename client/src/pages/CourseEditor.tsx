import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createCourse,
  createLesson,
  createModule,
  createQuestion,
  deleteCourse,
  deleteLesson,
  deleteModule,
  deleteQuestion,
  getMyCourse,
  submitCourseForReview,
  updateCourse,
  updateLesson,
  updateModule,
  updateQuestion,
} from '../api'
import type {
  CourseInput,
  CourseStatus,
  InstructorCourse,
  InstructorQuestion,
  Lesson,
  Module,
  QuestionInput,
} from '../api'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'
import { Skeleton } from '../components/Skeleton'
import { useAsyncData } from '../hooks/useAsyncData'
import { statusBadgeClass } from '../lib/badges'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  PUBLISHED: 'Publicado',
}

/** Dispatches create vs edit mode based on the `:id` route param. */
export function CourseEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const isEdit = id != null && id !== 'nuevo'
  if (!isEdit) {
    return (
      <CreateCourseForm
        onCreated={(course) =>
          navigate(`/instructor/cursos/${course.id}/editar`)
        }
      />
    )
  }

  return <EditCourseEditor courseId={Number(id)} />
}

// ---- Create mode ----

interface CreateCourseFormProps {
  onCreated: (course: InstructorCourse) => void
}

function CreateCourseForm({ onCreated }: CreateCourseFormProps) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    minutes: '30',
    image: 'curso.png',
    passThreshold: '70',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function update(key: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    if (!form.title.trim()) next.title = 'El título es obligatorio'
    if (!form.description.trim())
      next.description = 'La descripción es obligatoria'

    const minutes = Number(form.minutes)
    if (!Number.isInteger(minutes) || minutes <= 0)
      next.minutes = 'La duración debe ser un número positivo'

    const passThreshold = Number(form.passThreshold)
    if (!Number.isInteger(passThreshold) || passThreshold < 0 || passThreshold > 100)
      next.passThreshold = 'El mínimo debe estar entre 0 y 100'

    if (!form.image.trim()) next.image = 'La imagen es obligatoria'
    return next
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setServerError(null)

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const payload: CourseInput = {
        title: form.title.trim(),
        description: form.description.trim(),
        minutes: Number(form.minutes),
        image: form.image.trim(),
        passThreshold: Number(form.passThreshold),
      }
      const course = await createCourse(payload)
      onCreated(course)
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Error al crear el curso',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <SectionBar title="Crear curso" subtitle="Primero define los datos base" />
      <div className="mx-auto max-w-lg px-4 pb-12">
        <form onSubmit={handleSubmit} noValidate className="card space-y-5 p-8">
          <div>
            <label htmlFor="curso-titulo" className="field-label">
              Título
            </label>
            <input
              id="curso-titulo"
              type="text"
              className="field-input"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-danger">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="curso-descripcion" className="field-label">
              Descripción
            </label>
            <textarea
              id="curso-descripcion"
              className="field-input min-h-24"
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-danger">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="curso-minutos" className="field-label">
                Duración (minutos)
              </label>
              <input
                id="curso-minutos"
                type="number"
                min={1}
                className="field-input"
                value={form.minutes}
                onChange={(event) => update('minutes', event.target.value)}
              />
              {errors.minutes && (
                <p className="mt-1 text-sm text-danger">{errors.minutes}</p>
              )}
            </div>

            <div>
              <label htmlFor="curso-minimo" className="field-label">
                Mínimo para aprobar (%)
              </label>
              <input
                id="curso-minimo"
                type="number"
                min={0}
                max={100}
                className="field-input"
                value={form.passThreshold}
                onChange={(event) => update('passThreshold', event.target.value)}
              />
              {errors.passThreshold && (
                <p className="mt-1 text-sm text-danger">{errors.passThreshold}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="curso-imagen" className="field-label">
              Imagen
            </label>
            <input
              id="curso-imagen"
              type="text"
              className="field-input"
              placeholder="curso.png"
              value={form.image}
              onChange={(event) => update('image', event.target.value)}
            />
            {errors.image && (
              <p className="mt-1 text-sm text-danger">{errors.image}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">
              {serverError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/instructor')}
              className="btn-outline"
            >
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Creando…' : 'Crear curso'}
            </button>
          </div>
        </form>
      </div>
    </PageTransition>
  )
}

// ---- Edit mode ----

function EditCourseEditor({ courseId }: { courseId: number }) {
  const { data: course, loading, error, reload } = useAsyncData(
    () => getMyCourse(courseId),
    [courseId],
  )

  return (
    <PageTransition>
      <SectionBar
        title={course ? `Editar curso` : 'Curso'}
        subtitle={course?.title}
      />

      <div className="mx-auto max-w-4xl px-4 pb-16">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !course ? (
          <EmptyState title="Curso no encontrado" />
        ) : (
          <div className="space-y-10">
            <CourseFieldsForm course={course} onSaved={reload} />
            <ModulesSection
              courseId={courseId}
              modules={course.modules}
              onChanged={reload}
            />
            <QuestionsSection
              courseId={courseId}
              questions={course.questions}
              onChanged={reload}
            />
            <ReviewSection
              courseId={courseId}
              status={course.status}
              onChanged={reload}
            />
          </div>
        )}
      </div>
    </PageTransition>
  )
}

// ---- Course fields (edit) ----

function CourseFieldsForm({
  course,
  onSaved,
}: {
  course: InstructorCourse
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    title: course.title,
    description: course.description,
    minutes: String(course.minutes),
    image: course.image,
    passThreshold: String(course.passThreshold),
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function update(key: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    const minutes = Number(form.minutes)
    const passThreshold = Number(form.passThreshold)
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !Number.isInteger(minutes) ||
      minutes <= 0 ||
      !Number.isInteger(passThreshold) ||
      passThreshold < 0 ||
      passThreshold > 100
    ) {
      setError('Revisa los campos: título, descripción, duración y mínimo.')
      return
    }

    setSaving(true)
    try {
      await updateCourse(course.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        minutes,
        image: form.image.trim(),
        passThreshold,
      })
      setMessage('Cambios guardados.')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card space-y-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-primary">Datos del curso</h2>
        <span className={statusBadgeClass(course.status)}>
          {STATUS_LABEL[course.status] ?? course.status}
        </span>
      </div>

      <div>
        <label htmlFor="editar-titulo" className="field-label">
          Título
        </label>
        <input
          id="editar-titulo"
          type="text"
          className="field-input"
          value={form.title}
          onChange={(event) => update('title', event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="editar-descripcion" className="field-label">
          Descripción
        </label>
        <textarea
          id="editar-descripcion"
          className="field-input min-h-24"
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="editar-minutos" className="field-label">
            Minutos
          </label>
          <input
            id="editar-minutos"
            type="number"
            min={1}
            className="field-input"
            value={form.minutes}
            onChange={(event) => update('minutes', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="editar-minimo" className="field-label">
            Mínimo (%)
          </label>
          <input
            id="editar-minimo"
            type="number"
            min={0}
            max={100}
            className="field-input"
            value={form.passThreshold}
            onChange={(event) => update('passThreshold', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="editar-imagen" className="field-label">
            Imagen
          </label>
          <input
            id="editar-imagen"
            type="text"
            className="field-input"
            value={form.image}
            onChange={(event) => update('image', event.target.value)}
          />
        </div>
      </div>

      {message && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-primary">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}

// ---- Modules + lessons ----

function ModulesSection({
  courseId,
  modules,
  onChanged,
}: {
  courseId: number
  modules: Module[]
  onChanged: () => void
}) {
  const [adding, setAdding] = useState(false)

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-primary">Módulos</h2>
        <button
          type="button"
          onClick={() => setAdding((value) => !value)}
          className="btn-outline"
        >
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Añadir módulo
        </button>
      </div>

      {adding && (
        <ModuleForm
          courseId={courseId}
          order={modules.length + 1}
          onDone={() => {
            setAdding(false)
            onChanged()
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {modules.length === 0 && !adding ? (
        <EmptyState
          title="Sin módulos"
          description="Añade un módulo para organizar las lecciones del curso."
        />
      ) : (
        <div className="space-y-4">
          {modules.map((module) => (
            <ModuleItem
              key={module.id}
              courseId={courseId}
              module={module}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ModuleItem({
  courseId,
  module,
  onChanged,
}: {
  courseId: number
  module: Module
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [addingLesson, setAddingLesson] = useState(false)

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-800">{module.title}</p>
          {module.description && (
            <p className="text-sm text-gray-500">{module.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="btn-outline px-4 py-1.5 text-sm"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={async () => {
              await deleteModule(courseId, module.id)
              onChanged()
            }}
            className="rounded-full border-2 border-red-200 bg-white px-4 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>

      {editing && (
        <ModuleForm
          courseId={courseId}
          initial={module}
          order={module.order}
          onDone={() => {
            setEditing(false)
            onChanged()
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* Lessons */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-600">Lecciones</p>
          <button
            type="button"
            onClick={() => setAddingLesson((value) => !value)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            + Añadir lección
          </button>
        </div>

        {addingLesson && (
          <LessonForm
            courseId={courseId}
            moduleId={module.id}
            order={module.lessons.length + 1}
            onDone={() => {
              setAddingLesson(false)
              onChanged()
            }}
            onCancel={() => setAddingLesson(false)}
          />
        )}

        {module.lessons.length === 0 ? (
          <p className="text-sm text-gray-400">Sin lecciones.</p>
        ) : (
          <ul className="space-y-2">
            {module.lessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                courseId={courseId}
                moduleId={module.id}
                lesson={lesson}
                onChanged={onChanged}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ModuleForm({
  courseId,
  initial,
  order,
  onDone,
  onCancel,
}: {
  courseId: number
  initial?: Module
  order: number
  onDone: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('El título del módulo es obligatorio.')
      return
    }
    setSaving(true)
    try {
      const input = { title: title.trim(), description, order }
      if (initial) await updateModule(courseId, initial.id, input)
      else await createModule(courseId, input)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el módulo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mb-4 space-y-3 rounded-xl border border-green-100 bg-surface p-4"
    >
      <input
        type="text"
        className="field-input"
        placeholder="Título del módulo"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <input
        type="text"
        className="field-input"
        placeholder="Descripción (opcional)"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-outline px-4 py-1.5 text-sm">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="btn-primary px-4 py-1.5 text-sm">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

function LessonItem({
  courseId,
  moduleId,
  lesson,
  onChanged,
}: {
  courseId: number
  moduleId: number
  lesson: Lesson
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)

  return (
    <li className="rounded-xl border border-gray-100 bg-surface px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="flex-1 truncate text-sm font-medium text-gray-700">
          {lesson.title}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={async () => {
              await deleteLesson(courseId, moduleId, lesson.id)
              onChanged()
            }}
            className="text-sm font-semibold text-danger hover:underline"
          >
            Eliminar
          </button>
        </div>
      </div>

      {editing && (
        <LessonForm
          courseId={courseId}
          moduleId={moduleId}
          initial={lesson}
          order={lesson.order}
          onDone={() => {
            setEditing(false)
            onChanged()
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </li>
  )
}

function LessonForm({
  courseId,
  moduleId,
  initial,
  order,
  onDone,
  onCancel,
}: {
  courseId: number
  moduleId: number
  initial?: Lesson
  order: number
  onDone: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [duration, setDuration] = useState(
    initial?.durationMinutes != null ? String(initial.durationMinutes) : '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!title.trim() || !content.trim()) {
      setError('El título y el contenido son obligatorios.')
      return
    }
    setSaving(true)
    try {
      const durationMinutes =
        duration.trim() && Number(duration) > 0 ? Number(duration) : null
      const input = {
        title: title.trim(),
        content,
        order,
        durationMinutes,
      }
      if (initial) await updateLesson(courseId, moduleId, initial.id, input)
      else await createLesson(courseId, moduleId, input)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la lección')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-2 space-y-3 rounded-xl border border-green-100 bg-white p-4"
    >
      <input
        type="text"
        className="field-input"
        placeholder="Título de la lección"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <textarea
        className="field-input min-h-20"
        placeholder="Contenido de la lección"
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <input
        type="number"
        min={1}
        className="field-input"
        placeholder="Duración en minutos (opcional)"
        value={duration}
        onChange={(event) => setDuration(event.target.value)}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-outline px-4 py-1.5 text-sm">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="btn-primary px-4 py-1.5 text-sm">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

// ---- Questions ----

function QuestionsSection({
  courseId,
  questions,
  onChanged,
}: {
  courseId: number
  questions: InstructorQuestion[]
  onChanged: () => void
}) {
  const [adding, setAdding] = useState(false)

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-primary">Preguntas del examen</h2>
        <button
          type="button"
          onClick={() => setAdding((value) => !value)}
          className="btn-outline"
        >
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Añadir pregunta
        </button>
      </div>

      {adding && (
        <QuestionForm
          courseId={courseId}
          order={questions.length + 1}
          onDone={() => {
            setAdding(false)
            onChanged()
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {questions.length === 0 && !adding ? (
        <EmptyState
          title="Sin preguntas"
          description="Añade preguntas para armar el examen del curso."
        />
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionItem
              key={question.id}
              courseId={courseId}
              question={question}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function QuestionItem({
  courseId,
  question,
  onChanged,
}: {
  courseId: number
  question: InstructorQuestion
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="font-semibold text-gray-800">{question.prompt}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="btn-outline px-4 py-1.5 text-sm"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={async () => {
              await deleteQuestion(courseId, question.id)
              onChanged()
            }}
            className="rounded-full border-2 border-red-200 bg-white px-4 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-red-50"
          >
            Eliminar
          </button>
        </div>
      </div>

      {editing ? (
        <QuestionForm
          courseId={courseId}
          initial={question}
          order={question.order}
          onDone={() => {
            setEditing(false)
            onChanged()
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <ul className="space-y-1">
          {question.options.map((option) => (
            <li
              key={option.id}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <i
                className={`fa-solid ${
                  option.isCorrect ? 'fa-circle-check text-success' : 'fa-circle text-gray-300'
                }`}
                aria-hidden="true"
              />
              {option.text}
              {option.isCorrect && (
                <span className="text-xs font-semibold text-success">(correcta)</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function QuestionForm({
  courseId,
  initial,
  order,
  onDone,
  onCancel,
}: {
  courseId: number
  initial?: InstructorQuestion
  order: number
  onDone: () => void
  onCancel: () => void
}) {
  const [prompt, setPrompt] = useState(initial?.prompt ?? '')
  const [options, setOptions] = useState<
    { text: string; isCorrect: boolean }[]
  >(
    initial
      ? initial.options.map((option) => ({
          text: option.text,
          isCorrect: option.isCorrect,
        }))
      : [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateOptionText(index: number, text: string) {
    setOptions((previous) =>
      previous.map((option, optionIndex) =>
        optionIndex === index ? { ...option, text } : option,
      ),
    )
  }

  function markCorrect(index: number) {
    setOptions((previous) =>
      previous.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === index,
      })),
    )
  }

  function addOption() {
    setOptions((previous) => [...previous, { text: '', isCorrect: false }])
  }

  function removeOption(index: number) {
    setOptions((previous) => previous.filter((_, optionIndex) => optionIndex !== index))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!prompt.trim()) {
      setError('El enunciado es obligatorio.')
      return
    }
    const filled = options.filter((option) => option.text.trim())
    if (filled.length < 2) {
      setError('Cada pregunta requiere al menos 2 opciones.')
      return
    }
    if (filled.filter((option) => option.isCorrect).length !== 1) {
      setError('Debe haber exactamente una opción correcta.')
      return
    }

    setSaving(true)
    try {
      const input: QuestionInput = {
        prompt: prompt.trim(),
        order,
        options: filled.map((option) => ({
          text: option.text.trim(),
          isCorrect: option.isCorrect,
        })),
      }
      if (initial) await updateQuestion(courseId, initial.id, input)
      else await createQuestion(courseId, input)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la pregunta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-3 rounded-xl border border-green-100 bg-surface p-4"
    >
      <input
        type="text"
        className="field-input"
        placeholder="Enunciado de la pregunta"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
      />

      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <label className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center">
              <input
                type="radio"
                name={`opcion-correcta-${initial?.id ?? 'nueva'}`}
                checked={option.isCorrect}
                onChange={() => markCorrect(index)}
                className="sr-only"
              />
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  option.isCorrect
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 text-transparent'
                }`}
              >
                <i className="fa-solid fa-check text-[10px]" aria-hidden="true" />
              </span>
            </label>
            <input
              type="text"
              className="field-input"
              placeholder={`Opción ${index + 1}`}
              value={option.text}
              onChange={(event) => updateOptionText(index, event.target.value)}
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              disabled={options.length <= 2}
              aria-label="Quitar opción"
              className="text-gray-400 transition-colors hover:text-danger disabled:opacity-40"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addOption}
        className="text-sm font-semibold text-primary hover:underline"
      >
        + Añadir opción
      </button>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-outline px-4 py-1.5 text-sm">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="btn-primary px-4 py-1.5 text-sm">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

// ---- Publish + delete ----

function ReviewSection({
  courseId,
  status,
  onChanged,
}: {
  courseId: number
  status: CourseStatus
  onChanged: () => void
}) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setMessage(null)
    setError(null)
    setSubmitting(true)
    try {
      await submitCourseForReview(courseId)
      setMessage('Curso enviado a revisión.')
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar a revisión')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    setMessage(null)
    setError(null)
    setDeleting(true)
    try {
      await deleteCourse(courseId)
      navigate('/instructor')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el curso')
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <section className="card space-y-4 p-6">
      <h2 className="text-xl font-semibold text-primary">Publicación</h2>

      {message && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-primary">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {status === 'DRAFT' ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            Cuando esté listo, envía el curso para que un administrador lo revise.
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Enviando…' : 'Enviar a revisión'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          Estado actual:{' '}
          <span className={statusBadgeClass(status)}>
            {STATUS_LABEL[status] ?? status}
          </span>
        </p>
      )}

      <div className="border-t border-gray-100 pt-4">
        {confirmingDelete ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-danger">
              ¿Seguro que quieres eliminar este curso? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="btn-outline px-4 py-1.5 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full bg-danger px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                {deleting ? 'Eliminando…' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="text-sm font-semibold text-danger hover:underline"
          >
            Eliminar curso
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        <Link
          to="/instructor"
          className="font-semibold text-primary hover:underline"
        >
          Volver al panel de instructor
        </Link>
      </p>
    </section>
  )
}
