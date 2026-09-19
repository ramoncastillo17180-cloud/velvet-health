import { Link, NavLink } from 'react-router-dom'
import type { NavLinkRenderProps } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { roleDashboardPath } from '../lib/badges'
import { DecorSquares } from './DecorSquares'
import { ProfileDropdown } from './ProfileDropdown'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/practicas', label: 'Cursos', end: false },
]

function navLinkClassName({ isActive }: NavLinkRenderProps): string {
  return `relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-green-50 text-primary'
      : 'text-gray-600 hover:bg-green-50 hover:text-primary'
  }`
}

export function Header() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 border-b border-green-100 bg-white/85 shadow-header backdrop-blur-md">
      <DecorSquares variant="header" />
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2"
          aria-label="Velvet Health — Inicio"
        >
          <img
            src="/images/logo2.png"
            alt="Velvet Health"
            className="h-12 w-auto sm:h-14"
          />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Principal">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={navLinkClassName}
            >
              {item.label}
            </NavLink>
          ))}
          {user && (
            <NavLink
              to={roleDashboardPath(user.role)}
              end={false}
              className={navLinkClassName}
            >
              Mi panel
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {!user && (
            <Link
              to="/registro"
              className="hidden rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-accent-hover sm:inline-flex"
            >
              Comenzar
            </Link>
          )}
          <ProfileDropdown />
        </div>
      </div>
    </header>
  )
}
