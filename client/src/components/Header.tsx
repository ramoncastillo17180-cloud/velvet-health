import { Link } from 'react-router-dom'
import { DecorSquares } from './DecorSquares'
import { ProfileDropdown } from './ProfileDropdown'

export function Header() {
  return (
    <header className="relative overflow-hidden border-b border-gray-200 bg-white shadow-header">
      <DecorSquares variant="header" />
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center"
          aria-label="Velvet Health — Inicio"
        >
          <img
            src="/images/logo2.png"
            alt="Velvet Health"
            className="h-12 w-auto sm:h-14"
          />
        </Link>
        <ProfileDropdown />
      </div>
    </header>
  )
}
