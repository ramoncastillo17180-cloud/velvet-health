import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterForm() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [profesion, setProfesion] = useState('')
  const [edad, setEdad] = useState('')
  const [correo, setCorreo] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    if (!nombre.trim()) next.nombre = 'El nombre es obligatorio'
    if (!apellidos.trim()) next.apellidos = 'Los apellidos son obligatorios'

    const email = correo.trim()
    if (!email) next.correo = 'El correo es obligatorio'
    else if (!EMAIL_PATTERN.test(email)) next.correo = 'Ingresa un correo válido'

    if (!contraseña) next.contraseña = 'La contraseña es obligatoria'
    else if (contraseña.length < 8)
      next.contraseña = 'La contraseña debe tener al menos 8 caracteres'

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
      await register({
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        profesion: profesion.trim() ? profesion.trim() : null,
        edad: edad.trim() ? Number(edad) : null,
        correo: correo.trim(),
        contraseña,
      })
      navigate('/login', { state: { registered: true } })
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Error al registrarse',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="registro-nombre" className="field-label">
            Nombre
          </label>
          <input
            id="registro-nombre"
            type="text"
            className="field-input"
            placeholder="Tu nombre"
            autoComplete="given-name"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-danger">{errors.nombre}</p>
          )}
        </div>

        <div>
          <label htmlFor="registro-apellidos" className="field-label">
            Apellidos
          </label>
          <input
            id="registro-apellidos"
            type="text"
            className="field-input"
            placeholder="Tus apellidos"
            autoComplete="family-name"
            value={apellidos}
            onChange={(event) => setApellidos(event.target.value)}
          />
          {errors.apellidos && (
            <p className="mt-1 text-sm text-danger">{errors.apellidos}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="registro-profesion" className="field-label">
            Profesión{' '}
            <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            id="registro-profesion"
            type="text"
            className="field-input"
            placeholder="Tu profesión"
            autoComplete="organization-title"
            value={profesion}
            onChange={(event) => setProfesion(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="registro-edad" className="field-label">
            Edad <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            id="registro-edad"
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
      </div>

      <div>
        <label htmlFor="registro-correo" className="field-label">
          Correo electrónico
        </label>
        <input
          id="registro-correo"
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
        <label htmlFor="registro-contraseña" className="field-label">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="registro-contraseña"
            type={showPassword ? 'text' : 'password'}
            className="field-input pr-11"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
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
        {submitting ? 'Registrando…' : 'Registrarse'}
      </button>
    </form>
  )
}
