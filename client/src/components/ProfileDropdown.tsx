import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { roleBadgeClass, roleLabel } from '../lib/badges'

export function ProfileDropdown() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de perfil"
        className="focus-ring flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-primary transition-transform hover:scale-105"
      >
        <i className="fa-solid fa-user text-lg" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-12 z-20 w-72 rounded-card-lg bg-white p-4 text-center shadow-card"
          >
            {user ? (
              <div className="space-y-3">
                <div>
                  <p className="truncate font-semibold text-primary">
                    {user.nombre}
                  </p>
                  <p className="truncate text-sm text-gray-500">
                    {user.correo}
                  </p>
                  <span className={`mt-2 ${roleBadgeClass(user.role)}`}>
                    {roleLabel(user.role)}
                  </span>
                </div>
                <Link
                  to="/perfil"
                  onClick={() => setOpen(false)}
                  className="btn-pill-primary"
                >
                  Mi perfil
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-pill-outline"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="btn-pill-primary"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registro"
                  onClick={() => setOpen(false)}
                  className="btn-pill-outline"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
