import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [correo, setCorreo] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    const email = correo.trim()
    if (!email) next.correo = 'El correo es obligatorio'
    else if (!EMAIL_PATTERN.test(email)) next.correo = 'Ingresa un correo válido'
    if (!contraseña) next.contraseña = 'La contraseña es obligatoria'
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
      await login({ correo: correo.trim(), contraseña })
      const from =
        (location.state as { from?: string } | null)?.from ?? '/perfil'
      navigate(from, { replace: true })
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Error al iniciar sesión',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="login-correo" className="field-label">
          Correo electrónico
        </label>
        <input
          id="login-correo"
          type="email"
          className="field-input"
          placeholder="tu@correo.com"
          autoComplete="email"
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
        />
        {errors.correo && (
          <p className="mt-1 text-sm text-danger">{errors.correo}</p>
        )}
      </div>

      <div>
        <label htmlFor="login-contraseña" className="field-label">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="login-contraseña"
            type={showPassword ? 'text' : 'password'}
            className="field-input pr-11"
            placeholder="Contraseña"
            autoComplete="current-password"
            value={contraseña}
            onChange={(event) => setContraseña(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-primary"
          >
            <i
              className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
              aria-hidden="true"
            />
          </button>
        </div>
        {errors.contraseña && (
          <p className="mt-1 text-sm text-danger">{errors.contraseña}</p>
        )}
      </div>

      <div className="text-right">
        <Link
          to="/recuperar-contrasena"
          className="text-sm font-semibold text-primary hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
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
        {submitting ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  )
}
