import { Link } from 'react-router-dom'
import { DecorSquares } from './DecorSquares'

const FOOTER_LINKS = [
  { to: '/practicas', label: 'Cursos' },
  { to: '/login', label: 'Iniciar sesión' },
  { to: '/registro', label: 'Crear cuenta' },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-green-100 bg-white">
      <DecorSquares variant="footer" />
      <div className="relative z-10 mx-auto max-w-7xl px-5 py-12">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-start md:justify-between md:text-left">
          {/* Brand */}
          <div className="max-w-xs">
            <img
              src="/images/logo2.png"
              alt="Velvet Health"
              className="mx-auto mb-4 h-12 w-auto md:mx-0"
            />
            <p className="text-sm text-gray-600">
              Plataforma de cursos de primeros auxilios. Aprende a salvar vidas
              con educación certificada.
            </p>
          </div>

          {/* Navigation */}
          <nav aria-label="Enlaces del sitio">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
              Navegación
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-600 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-primary"
                >
                  <i
                    className="fa-solid fa-file-alt text-gray-400"
                    aria-hidden="true"
                  />
                  Términos y condiciones
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-primary"
                >
                  <i
                    className="fa-solid fa-shield-alt text-gray-400"
                    aria-hidden="true"
                  />
                  Política de Privacidad
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-green-100 pt-6 text-center text-xs text-gray-400">
          <p>
            &copy; 2025 Cursos Médicos Velvet Health. Todos los derechos
            reservados · Desarrollado por VelvetHealth Web Team
          </p>
        </div>
      </div>
    </footer>
  )
}
