import api, { tokenStore } from '../api/axiosClient.js'
import { normalizeUsuario } from '../models/Usuario.js'

/** POST /api/login/ -> guarda tokens y devuelve el par access/refresh. */
export async function login(username, password) {
  const { data } = await api.post('/login/', { username, password }, { skipAuth: true })
  tokenStore.set(data.access, data.refresh)
  return data
}

/** POST /api/usuarios/registro/ -> crea la cuenta. */
export async function register(payload) {
  const { data } = await api.post('/usuarios/registro/', payload, { skipAuth: true })
  return data
}

/** GET /api/usuarios/me/ -> perfil normalizado del usuario autenticado. */
export async function fetchMe() {
  const { data } = await api.get('/usuarios/me/')
  return normalizeUsuario(data)
}

export function logout() {
  tokenStore.clear()
}

export function hasToken() {
  return !!tokenStore.getAccess()
}
