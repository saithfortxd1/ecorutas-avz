import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext.jsx'
import FullScreenLoader from './FullScreenLoader.jsx'

/**
 * Bloquea rutas no autorizadas: si no hay sesión, redirige a /login
 * conservando el origen para volver tras iniciar sesión.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, menu } = useAuth()
  const location = useLocation()
  const allowed = menu.some((item) => item.path && (location.pathname === item.path || location.pathname.startsWith(`${item.path.replace(/\/$/, '')}/`)))
  useEffect(() => {
    if (isAuthenticated && !loading && !allowed) toast.error('Tu cuenta no tiene permiso para abrir esta sección.')
  }, [isAuthenticated, loading, allowed])
  if (loading) return <FullScreenLoader />
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (!allowed) return <Navigate to="/" replace state={{ forbidden: true }} />
  return children
}
