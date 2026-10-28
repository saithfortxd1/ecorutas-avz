import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-eco-50 to-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-extrabold text-eco-700">EcoRutas</h1>
        <p className="mt-1 text-sm text-slate-500">Inicia sesión para continuar</p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="username">Usuario</label>
            <input
              id="username" type="text" autoComplete="username" value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-eco-500 focus:outline-none focus:ring-2 focus:ring-eco-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="password">Contraseña</label>
            <input
              id="password" type="password" autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-eco-500 focus:outline-none focus:ring-2 focus:ring-eco-200"
            />
          </div>

          <button
            type="submit" disabled={submitting}
            className="w-full rounded-lg bg-eco-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-eco-700 disabled:opacity-50"
          >
            {submitting ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>

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
