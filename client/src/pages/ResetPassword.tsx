import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [contraseña, setContraseña] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function validate(): string | null {
    if (!contraseña) return 'La contraseña es obligatoria'
    if (contraseña.length < 8)
      return 'La contraseña debe tener al menos 8 caracteres'
    if (contraseña !== confirmacion) return 'Las contraseñas no coinciden'
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      await resetPassword(token, contraseña)
      setDone(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al restablecer la contraseña',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <SectionBar title="Restablecer contraseña" />
      <div className="mx-auto max-w-md px-4 pb-12">
        <div className="card p-8">
          {!token ? (
            <div className="text-center">
              <p className="mb-6 text-gray-600">
                El enlace de recuperación no es válido o está incompleto.
              </p>
              <Link to="/recuperar-contrasena" className="btn-primary w-full">
                Solicitar un nuevo enlace
              </Link>
            </div>
          ) : done ? (
            <div className="text-center">
              <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-primary">
                <i className="fa-solid fa-circle-check" aria-hidden="true" />
              </span>
              <h2 className="mb-2 text-lg font-semibold text-gray-800">
                Contraseña actualizada
              </h2>
              <p className="mb-6 text-sm text-gray-600">
                Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <Link to="/login" className="btn-primary w-full">
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="reset-contraseña" className="field-label">
                  Nueva contraseña
                </label>
                <input
                  id="reset-contraseña"
                  type="password"
                  className="field-input"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  value={contraseña}
                  onChange={(event) => setContraseña(event.target.value)}
                />
              </div>

              <div>
                <label htmlFor="reset-confirmacion" className="field-label">
                  Confirmar contraseña
                </label>
                <input
                  id="reset-confirmacion"
                  type="password"
                  className="field-input"
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  value={confirmacion}
                  onChange={(event) => setConfirmacion(event.target.value)}
                />
              </div>

              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? 'Guardando…' : 'Guardar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
