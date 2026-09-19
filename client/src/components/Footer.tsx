import { DecorSquares } from './DecorSquares'

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-600">
      <DecorSquares variant="footer" />
      <div className="relative z-10 mx-auto max-w-7xl px-5">
        <p className="mb-3">
          &copy; 2025 Cursos Médicos Velvet Health. Todos los derechos
          reservados
        </p>
        <div className="mb-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-gray-600 transition-colors hover:text-primary"
          >
            <i className="fa-solid fa-file-alt text-gray-400" aria-hidden="true" />
            Términos y condiciones
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-gray-600 transition-colors hover:text-primary"
          >
            <i
              className="fa-solid fa-shield-alt text-gray-400"
              aria-hidden="true"
            />
            Política de Privacidad
          </a>
        </div>
        <p className="text-xs text-gray-400">
          Desarrollado por VelvetHealth Web Team
        </p>
      </div>
    </footer>
  )
}
