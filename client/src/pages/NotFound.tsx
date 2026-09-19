import { Link } from 'react-router-dom'
import { PageTransition } from '../components/PageTransition'
import { SectionBar } from '../components/SectionBar'

export function NotFound() {
  return (
    <PageTransition>
      <SectionBar title="Página no encontrada" />
      <div className="mx-auto max-w-md px-4 pb-12 text-center">
        <p className="mb-4 text-gray-600">
          La página que buscas no existe o fue movida.
        </p>
        <Link to="/" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    </PageTransition>
  )
}
