import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Compass, Leaf } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { extractErrorMessage } from '../utils/errors.js'

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from?.pathname || '/experiencias'

  if (isAuthenticated) return <Navigate to={from} replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Ingresa tu usuario y contraseña.')
      return
    }
    setSubmitting(true)
    try {
      await login(username.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err?.response?.status === 401
          ? 'Credenciales inválidas. Verifica tu usuario y contraseña.'
          : extractErrorMessage(err),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f5ee] p-4 sm:p-8">
      <Link to="/" className="absolute left-4 top-5 z-10 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-eco-900 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600 sm:left-8 sm:top-8"><ArrowLeft size={17} aria-hidden="true" />Volver al inicio</Link>
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-16 h-80 w-80 rounded-full bg-eco-100/80 blur-3xl" />
      <div className="relative w-full max-w-md rounded-[1.75rem] border border-white bg-white/90 p-7 shadow-[0_26px_70px_-42px_rgba(20,60,43,.45)] backdrop-blur-sm sm:p-9">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-eco-800 text-white"><Leaf size={22} aria-hidden="true" /></span>
        <h1 className="mt-5 font-display text-3xl text-eco-950">Bienvenido de vuelta</h1>
        <p className="mt-2 text-sm text-stone-600">Inicia sesión para continuar explorando.</p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="username">Usuario</label>
            <input
              id="username" type="text" autoComplete="username" value={username}
              onChange={(e) => setUsername(e.target.value)}
            className="min-h-12 w-full rounded-xl border border-stone-300 bg-[#fbfaf6] px-4 py-3 text-sm focus:border-eco-600 focus:outline-none focus:ring-2 focus:ring-eco-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="password">Contraseña</label>
            <input
              id="password" type="password" autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-stone-300 bg-[#fbfaf6] px-4 py-3 text-sm focus:border-eco-600 focus:outline-none focus:ring-2 focus:ring-eco-100"
            />
          </div>

          <button
            type="submit" disabled={submitting}
            className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-eco-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-eco-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-600 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-stone-500"><Compass size={14} aria-hidden="true" />Viaja con anfitriones locales</div>

        <p className="mt-5 text-center text-sm text-slate-500">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-eco-700 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
