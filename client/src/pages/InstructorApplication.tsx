import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { submitInstructorApplication } from '../api'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5 MB (matches the server default)
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

export function InstructorApplication() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profesion, setProfesion] = useState('')
  const [edad, setEdad] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    const next: File[] = []
    const nextErrors: Record<string, string> = { ...errors }
    delete nextErrors.documents

    for (const file of selected) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        nextErrors.documents =
          'Tipo de archivo no permitido. Solo se admiten PDF, JPG y PNG.'
        continue
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        nextErrors.documents = 'Cada archivo debe pesar menos de 5 MB.'
        continue
      }
      next.push(file)
    }

    setFiles(next)
    setErrors(nextErrors)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeFile(index: number) {
    setFiles((previous) => previous.filter((_, fileIndex) => fileIndex !== index))
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    if (!profesion.trim()) next.profesion = 'La profesión es obligatoria'

    if (edad.trim()) {
      const value = Number(edad)
      if (!Number.isInteger(value) || value < 1 || value > 120)
        next.edad = 'La edad debe ser un número entre 1 y 120'
    }

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
      const formData = new FormData()
      formData.append('profesion', profesion.trim())
      if (edad.trim()) formData.append('edad', edad)
      for (const file of files) formData.append('documents', file)

      await submitInstructorApplication(formData)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Error al enviar la solicitud',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <PageTransition>
        <SectionBar title="Solicitud enviada" />
        <div className="mx-auto max-w-md px-4 pb-12">
          <div className="card p-8 text-center">
            <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-2xl text-primary">
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
            </span>
            <h2 className="mb-2 text-xl font-semibold text-gray-800">
              Solicitud recibida
            </h2>
            <p className="mb-6 text-gray-600">
              Un administrador revisará tu solicitud. Te notificaremos cuando
              haya una decisión.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                Volver a mi panel
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <SectionBar
        title="Convertirme en instructor"
        subtitle="Comparte tus conocimientos de primeros auxilios"
      />

      <div className="mx-auto max-w-lg px-4 pb-12">
        <form onSubmit={handleSubmit} noValidate className="card space-y-5 p-8">
          <p className="text-sm text-gray-500">
            Completa tus datos y adjunta un documento que acredite tu profesión.
            Un administrador revisará tu solicitud.
          </p>

          <div>
            <label htmlFor="aplicacion-profesion" className="field-label">
              Profesión
            </label>
            <input
              id="aplicacion-profesion"
              type="text"
              className="field-input"
              placeholder="Ej. Médico, Enfermero"
              value={profesion}
              onChange={(event) => setProfesion(event.target.value)}
            />
            {errors.profesion && (
              <p className="mt-1 text-sm text-danger">{errors.profesion}</p>
            )}
          </div>

          <div>
            <label htmlFor="aplicacion-edad" className="field-label">
              Edad <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              id="aplicacion-edad"
              type="number"
              min={1}
              max={120}
              className="field-input"
              placeholder="Tu edad"
              value={edad}
              onChange={(event) => setEdad(event.target.value)}
            />
            {errors.edad && (
              <p className="mt-1 text-sm text-danger">{errors.edad}</p>
            )}
          </div>

          <div>
            <label htmlFor="aplicacion-documentos" className="field-label">
              Documento de acreditación{' '}
              <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              ref={fileInputRef}
              id="aplicacion-documentos"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="field-input"
              onChange={handleFileChange}
            />
            <p className="mt-1 text-xs text-gray-400">
              Formatos permitidos: PDF, JPG y PNG · máximo 5 MB por archivo.
            </p>
            {errors.documents && (
              <p className="mt-1 text-sm text-danger">{errors.documents}</p>
            )}

            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-surface px-3 py-2"
                  >
                    <span className="truncate text-sm text-gray-700">
                      <i
                        className="fa-solid fa-file mr-2 text-gray-400"
                        aria-hidden="true"
                      />
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      aria-label={`Quitar ${file.name}`}
                      className="text-gray-400 transition-colors hover:text-danger"
                    >
                      <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? 'Enviando…' : 'Enviar solicitud'}
          </button>

          <p className="text-center text-sm text-gray-500">
            <Link to="/dashboard" className="font-semibold text-primary hover:underline">
              Volver a mi panel
            </Link>
          </p>
        </form>
      </div>
    </PageTransition>
  )
}
