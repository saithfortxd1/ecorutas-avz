import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import FullScreenLoader from './FullScreenLoader.jsx'

/**
 * Bloquea rutas no autorizadas: si no hay sesión, redirige a /login
 * conservando el origen para volver tras iniciar sesión.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader />
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}
