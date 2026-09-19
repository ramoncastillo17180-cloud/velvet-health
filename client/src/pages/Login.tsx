import { Link, useLocation } from 'react-router-dom'
import { LoginForm } from '../components/LoginForm'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'

export function Login() {
  const location = useLocation()
  const registered = Boolean(
    (location.state as { registered?: boolean } | null)?.registered,
  )

  return (
    <PageTransition>
      <SectionBar
        title="Iniciar sesión"
        subtitle="Bienvenido de nuevo a Velvet Health"
      />
      <div className="mx-auto max-w-md px-4 pb-12">
        <div className="card p-8">
          {registered && (
            <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-primary">
              Cuenta creada correctamente. Inicia sesión para continuar.
            </p>
          )}
          <LoginForm />
          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link
              to="/registro"
              className="font-semibold text-primary hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  )
}
