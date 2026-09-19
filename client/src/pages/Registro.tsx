import { Link } from 'react-router-dom'
import { PageTransition } from '../components/PageTransition'
import { RegisterForm } from '../components/RegisterForm'
import { SectionBar } from '../components/SectionBar'

export function Registro() {
  return (
    <PageTransition>
      <SectionBar
        title="Crear cuenta"
        subtitle="Únete a Velvet Health y empieza a aprender"
      />
      <div className="mx-auto max-w-md px-4 pb-12">
        <div className="card p-8">
          <RegisterForm />
          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  )
}
