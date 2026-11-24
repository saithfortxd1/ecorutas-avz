import axios from 'axios'

export const ACCESS_KEY = 'ecorutas_access'
export const REFRESH_KEY = 'ecorutas_refresh'

/** Almacenamiento de tokens en localStorage. */
export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access, refresh) => {
    if (access) localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// Base de la API configurable por entorno (Vite). Fallback al puerto local 8011.
const API_BASE_URL = String(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8011/api',
).replace(/\/+$/, '')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// --- Interceptor de peticion: adjunta Bearer <access_token> ---
api.interceptors.request.use((config) => {
  const access = tokenStore.getAccess()
  if (access && !config.skipAuth) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

// --- Renovacion automatica del token (single-flight) ---
let refreshPromise = null

async function refreshAccessToken() {
  const refresh = tokenStore.getRefresh()
  if (!refresh) throw new Error('No hay refresh token')
  const { data } = await axios.post(`${api.defaults.baseURL}/login/refresh/`, { refresh })
  tokenStore.set(data.access, null)
  return data.access
}

// --- Interceptor de respuesta ---
// Politica de sesion:
//  - 403 (autenticado pero sin permiso de recurso): NUNCA se cierra la sesion.
//    Se propaga el error para que la vista muestre un bloqueo limpio.
//  - 401: se intenta refrescar el access token una sola vez y se reintenta.
//    Solo si el refresh falla (token invalido o expirado) se limpia la sesion.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    if (status === 403) {
      return Promise.reject(error)
    }

    const puedeRefrescar =
      status === 401 &&
      original &&
      !original._retry &&
      !original.skipAuth &&
      tokenStore.getRefresh()

    if (!puedeRefrescar) {
      return Promise.reject(error)
    }

    original._retry = true
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }
      const newAccess = await refreshPromise
      original.headers = original.headers || {}
      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (refreshError) {
      // Unico punto donde se cierra la sesion: token invalido/expirado.
      tokenStore.clear()
      window.dispatchEvent(new Event('ecorutas:logout'))
      return Promise.reject(refreshError)
    }
  },
)

export default api