import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as authService from '../services/authService.js'
import { isAdministrador as esAdministrador, isAnfitrion as esAnfitrion } from '../models/Usuario.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [menu, setMenu] = useState([])
  const [menuRefreshing, setMenuRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const sessionRef = useRef({ user, menu })
  sessionRef.current = { user, menu }

  const synchronizeSession = useCallback(async (expectedUserId, { fallback = null, clearOnError = true } = {}) => {
    const [profileResult, menuResult] = await Promise.allSettled([
      authService.fetchMe(),
      authService.fetchMenu({ force: true }),
    ])
    if (!expectedUserId || authService.getTokenUserId() !== expectedUserId) return null

    if (profileResult.status === 'rejected') {
      if (fallback) {
        setUser(fallback.user)
        setMenu(fallback.menu)
      } else if (clearOnError) {
        authService.logout()
        setUser(null)
        setMenu([])
      }
      setLoading(false)
      if (clearOnError && !fallback) throw profileResult.reason
      return fallback?.user ?? null
    }

    setUser(profileResult.value)
    setMenu(menuResult.status === 'fulfilled' ? menuResult.value : fallback?.menu ?? [])
    setLoading(false)
    return profileResult.value
  }, [])

  // Restaura primero el último snapshot de esta misma cuenta; perfil y menú se
  // revalidan en paralelo para que una petición lenta no congele el shell.
  useEffect(() => {
    let active = true
    const userId = authService.getTokenUserId()
    const cached = authService.getCachedSession()

    if (!authService.hasToken()) {
      setLoading(false)
    } else if (cached) {
      setUser(cached.user)
      setMenu(cached.menu)
      setLoading(false)
    }

    const init = async () => {
      if (!authService.hasToken()) return
      if (!userId) {
        authService.logout()
        setLoading(false)
        return
      }
      try {
        const session = await synchronizeSession(userId, { fallback: cached, clearOnError: !cached })
        if (active && !session && !cached) setMenu([])
      } catch {
        // Una sesión sin datos cacheados queda limpia y puede volver a iniciar sesión.
      }
    }
    init()

    const handleForceLogout = () => {
      setUser(null)
      setMenu([])
      setLoading(false)
    }
    const handleMenuInvalidation = () => {
      const currentId = authService.getTokenUserId()
      const current = sessionRef.current
      if (currentId) void synchronizeSession(currentId, { fallback: current.user ? current : null, clearOnError: false })
    }
    const handleStorage = (event) => {
      if (event.key === 'ecorutas_menu_invalidated_at') handleMenuInvalidation()
    }
    const handleFocus = () => {
      if (authService.hasToken()) {
        const currentId = authService.getTokenUserId()
        authService.fetchMenu().then((items) => {
          if (active && currentId === authService.getTokenUserId()) setMenu(items)
        }).catch(() => {})
      }
    }
    window.addEventListener('ecorutas:logout', handleForceLogout)
    window.addEventListener('ecorutas:menu-invalidated', handleMenuInvalidation)
    window.addEventListener('storage', handleStorage)
    window.addEventListener('focus', handleFocus)
    return () => {
      active = false
      window.removeEventListener('ecorutas:logout', handleForceLogout)
      window.removeEventListener('ecorutas:menu-invalidated', handleMenuInvalidation)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('focus', handleFocus)
    }
  }, [synchronizeSession])

  const login = useCallback(async (username, password) => {
    await authService.login(username, password)
    const userId = authService.getTokenUserId()
    const cached = authService.getCachedSession()
    if (cached) {
      setUser(cached.user)
      setMenu(cached.menu)
      setLoading(false)
      void synchronizeSession(userId, { fallback: cached, clearOnError: false }).catch(() => {})
      return cached.user
    }
    if (!userId) throw new Error('La respuesta de autenticación no contiene un usuario válido.')
    return synchronizeSession(userId)
  }, [synchronizeSession])

  const register = useCallback((payload) => authService.register(payload), [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    setMenu([])
  }, [])

  const refreshMenu = useCallback(async () => {
    authService.invalidateMenu({ notify: false })
    setMenuRefreshing(true)
    try {
      const [profileResult, menuResult] = await Promise.allSettled([
        authService.fetchMe(),
        authService.fetchMenu({ force: true }),
      ])
      if (profileResult.status === 'fulfilled') setUser(profileResult.value)
      if (menuResult.status === 'rejected') throw menuResult.reason
      setMenu(menuResult.value)
      return menuResult.value
    } finally {
      setMenuRefreshing(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      menu,
      menuRefreshing,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      rol: user?.rol ?? null,
      isAnfitrion: esAnfitrion(user),
      isAdministrador: esAdministrador(user),
      refreshMenu,
    }),
    [user, menu, menuRefreshing, loading, login, register, logout, refreshMenu],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
