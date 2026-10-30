import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import FullScreenLoader from './components/FullScreenLoader.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Code-splitting por ruta: cada pantalla se carga bajo demanda (React.lazy).
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const RegistroPage = lazy(() => import('./pages/RegistroPage.jsx'))
const ExperienciasPage = lazy(() => import('./pages/ExperienciasPage.jsx'))
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'))

export default function App() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route
          path="/experiencias"
          element={
            <ProtectedRoute>
              <ExperienciasPage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/usuarios" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/roles" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/recursos" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
