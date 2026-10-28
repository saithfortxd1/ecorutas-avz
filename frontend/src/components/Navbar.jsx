import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fullName } from '../models/Usuario.js'

/**
 * Barra superior con RBAC:
 * - Muestra el usuario y su rol.
 * - El botón "Crear Experiencia" solo aparece para rol 'anfitrion'.
 */
export default function Navbar({ onNew }) {
  const { user, isAnfitrion, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 bg-eco-700 text-white shadow">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-tight">
          EcoRutas
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight">{fullName(user)}</p>
            <p className="text-xs text-eco-100">{user?.email}</p>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
              isAnfitrion ? 'bg-amber-300 text-amber-900' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {isAnfitrion ? 'Anfitrión' : 'Turista'}
          </span>

          {isAnfitrion && (
            <button
              type="button"
              onClick={onNew}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-eco-700 transition hover:bg-eco-50"
            >
              + Crear Experiencia
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-eco-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-eco-600"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  )
}
