import axios from 'axios'
import { toast } from 'sonner'

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

const api = axios.create({
  baseURL: 'http://127.0.0.1:8011/api',
  headers: { 'Content-Type': 'application/json' },
})

// --- Interceptor de petición: adjunta Bearer <access_token> ---
api.interceptors.request.use((config) => {
  const access = tokenStore.getAccess()
  if (access && !config.skipAuth) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

// --- Renovación automática del token (single-flight) ---
let refreshPromise = null

async function refreshAccessToken() {
  const refresh = tokenStore.getRefresh()
  if (!refresh) throw new Error('No hay refresh token')
  const { data } = await axios.post(`${api.defaults.baseURL}/login/refresh/`, { refresh })
  tokenStore.set(data.access, null)
  return data.access
}

// --- Interceptor de respuesta: reintenta una vez tras refrescar ante un 401 ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    if (status === 403) {
      toast.error('No tienes permisos para realizar esta acción.')
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
      tokenStore.clear()
      window.dispatchEvent(new Event('ecorutas:logout'))
      return Promise.reject(refreshError)
    }
  },
)

export default api
