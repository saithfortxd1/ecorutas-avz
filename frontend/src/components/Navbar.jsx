import { Link, useNavigate } from 'react-router-dom'
import { Compass, LayoutGrid, Leaf, Map as MapIcon, RefreshCw, Route as RouteIcon, ShieldCheck, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext.jsx'
import { fullName } from '../models/Usuario.js'
import { prefetchRoute } from '../utils/routePrefetch.js'

const ICONS = {
  map: MapIcon,
  compass: Compass,
  leaf: Leaf,
  route: RouteIcon,
  users: Users,
  shield: ShieldCheck,
  grid: LayoutGrid,
}

/**
 * Barra superior con RBAC:
 * - Muestra el usuario y su rol.
 * - El botón "Crear Experiencia" solo aparece para rol 'anfitrion'.
 */
export default function Navbar({ onNew }) {
  const { user, menu, menuRefreshing, refreshMenu, isAnfitrion, isAdministrador, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleRefreshMenu = async () => {
    try {
      await refreshMenu()
      toast.success('Menú y permisos actualizados')
    } catch {
      toast.error('No pudimos actualizar tus permisos. Intenta de nuevo.')
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/15 bg-eco-800/80 text-white shadow-lg backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-tight">
          EcoRutas
        </Link>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <nav aria-label="Navegación principal" className="flex flex-wrap items-center gap-2">
            {menu.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onMouseEnter={() => prefetchRoute(item.path).catch(() => {})}
                onFocus={() => prefetchRoute(item.path).catch(() => {})}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/15 hover:text-white"
              >
                {(() => {
                  const Icon = ICONS[String(item.icono || '').toLowerCase()] || Compass
                  return <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                })()}
                {item.nombre}
              </Link>
            ))}
          </nav>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight">{fullName(user)}</p>
            <p className="text-xs text-eco-100">{user?.email}</p>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
              isAnfitrion ? 'bg-amber-300 text-amber-900' : isAdministrador ? 'bg-lime-200 text-emerald-950' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {user?.rolDisplay || (isAnfitrion ? 'Anfitrión' : 'Turista')}
          </span>

          <button
            type="button"
            onClick={handleRefreshMenu}
            disabled={menuRefreshing}
            aria-label="Actualizar menú y permisos"
            title="Actualizar menú y permisos"
            className="rounded-lg border border-white/20 p-2 text-white/90 transition hover:bg-white/15 disabled:opacity-60"
          >
            <RefreshCw size={16} className={menuRefreshing ? 'animate-spin' : ''} aria-hidden="true" />
          </button>

          {(isAnfitrion || isAdministrador) && (
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
