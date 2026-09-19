import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPassword() {
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const email = correo.trim()
    if (!email) {
      setError('El correo es obligatorio')
      return
    }
    if (!EMAIL_PATTERN.test(email)) {
      setError('Ingresa un correo válido')
      return
    }

    setSubmitting(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <SectionBar title="Recuperar contraseña" />
      <div className="mx-auto max-w-md px-4 pb-12">
        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl text-primary">
                <i className="fa-solid fa-envelope-circle-check" aria-hidden="true" />
              </span>
              <h2 className="mb-2 text-lg font-semibold text-gray-800">
                Revisa tu correo
              </h2>
              <p className="mb-6 text-sm text-gray-600">
                Si el correo existe en nuestra plataforma, recibirás
                instrucciones para restablecer tu contraseña.
              </p>
              <Link to="/login" className="btn-primary w-full">
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <p className="text-sm text-gray-600">
                Escribe tu correo y te enviaremos un enlace para restablecer tu
                contraseña.
              </p>
              <div>
                <label htmlFor="forgot-correo" className="field-label">
                  Correo electrónico
                </label>
                <input
                  id="forgot-correo"
                  type="email"
                  className="field-input"
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  value={correo}
                  onChange={(event) => setCorreo(event.target.value)}
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
                {submitting ? 'Enviando…' : 'Enviar instrucciones'}
              </button>

              <p className="text-center text-sm text-gray-500">
                <Link
                  to="/login"
                  className="font-semibold text-primary hover:underline"
                >
                  Volver a iniciar sesión
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
