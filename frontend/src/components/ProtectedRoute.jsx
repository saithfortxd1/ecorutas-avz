import { Link, Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import FullScreenLoader from './FullScreenLoader.jsx'
import { canAccessPath } from '../utils/rbac.js'

function ForbiddenPanel({ pathname }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <ShieldAlert size={24} aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-slate-800">Sección no disponible</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tu cuenta no tiene acceso a <code className="rounded bg-slate-100 px-1">{pathname}</code>.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/experiencias" className="rounded-lg bg-eco-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-eco-700">
            Ir a experiencias
          </Link>
          <Link to="/" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * Bloquea rutas no autorizadas.
 *
 * - Sin sesión: redirige a /login conservando el origen.
 * - `requireResource` (por defecto true): la ruta exige un recurso RBAC del
 *   usuario (p. ej. /admin/*, /experiencias). Si no lo tiene, muestra un
 *   bloqueo limpio sin cerrar sesión.
 * - `requireResource=false`: la ruta solo exige sesión (p. ej. /mis-reservas),
 *   accesible para cualquier usuario autenticado (incluido Turista).
 * - Si los recursos aún no están disponibles (array vacío), se deja pasar para
 *   no producir falsos negativos mientras carga el perfil.
 */
export default function ProtectedRoute({ children, requireResource = true }) {
  const { isAuthenticated, loading, recursos } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireResource && recursos.length > 0 && !canAccessPath(recursos, location.pathname)) {
    return <ForbiddenPanel pathname={location.pathname} />
  }

  return children
}
