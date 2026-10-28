import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService.js'
import { isAnfitrion as esAnfitrion } from '../models/Usuario.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaura la sesión al montar consultando /api/usuarios/me/.
  useEffect(() => {
    let active = true

    async function init() {
      if (!authService.hasToken()) {
        if (active) setLoading(false)
        return
      }
      try {
        const perfil = await authService.fetchMe()
        if (active) setUser(perfil)
      } catch {
        authService.logout()
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    init()

    const handleForceLogout = () => setUser(null)
    window.addEventListener('ecorutas:logout', handleForceLogout)
    return () => {
      active = false
      window.removeEventListener('ecorutas:logout', handleForceLogout)
    }
  }, [])

  const login = useCallback(async (username, password) => {
    await authService.login(username, password)
    const perfil = await authService.fetchMe()
    setUser(perfil)
    return perfil
  }, [])

  const register = useCallback((payload) => authService.register(payload), [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      rol: user?.rol ?? null,
      isAnfitrion: esAnfitrion(user),
    }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
