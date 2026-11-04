import api, { tokenStore } from '../api/axiosClient.js'
import { normalizeUsuario } from '../models/Usuario.js'

const MENU_KEY = 'ecorutas_menu_v1'
const MENU_KEY_PREFIX = `${MENU_KEY}:`
const USER_KEY_PREFIX = 'ecorutas_user_v1:'
const INVALIDATION_SIGNAL_KEY = 'ecorutas_menu_invalidated_at'
const MENU_TTL = 60_000
const SESSION_STALE_LIMIT = 5 * 60_000

export function getTokenUserId() {
  try {
    const encoded = tokenStore.getAccess()?.split('.')[1]
    if (!encoded) return null
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))
    return payload.user_id == null ? null : String(payload.user_id)
  } catch {
    return null
  }
}

function readStored(key, staleLimit = SESSION_STALE_LIMIT) {
  try {
    const entry = JSON.parse(localStorage.getItem(key) || 'null')
    if (!entry || !entry.savedAt || Date.now() - entry.savedAt > staleLimit) return null
    return entry
  } catch {
    try { localStorage.removeItem(key) } catch { /* almacenamiento deshabilitado */ }
    return null
  }
}

function writeStored(key, value, ttl) {
  try {
    localStorage.setItem(key, JSON.stringify({ value, savedAt: Date.now(), expires: Date.now() + ttl }))
  } catch {
    // Si el almacenamiento está lleno o deshabilitado, la sesión vive en memoria.
  }
}

/** Devuelve una sesión de presentación solo si coincide con el ID del JWT actual. */
export function getCachedSession() {
  const userId = getTokenUserId()
  if (!userId) return null
  const userEntry = readStored(`${USER_KEY_PREFIX}${userId}`)
  const menuEntry = readStored(`${MENU_KEY_PREFIX}${userId}`)
  if (!userEntry?.value || !Array.isArray(menuEntry?.value)) return null
  return { user: userEntry.value, menu: menuEntry.value }
}

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
  const user = normalizeUsuario(data)
  const userId = getTokenUserId()
  if (userId && String(user.id) === userId) writeStored(`${USER_KEY_PREFIX}${userId}`, user, SESSION_STALE_LIMIT)
  return user
}

export async function fetchMenu({ force = false } = {}) {
  const userId = getTokenUserId()
  const userMenuKey = userId ? `${MENU_KEY_PREFIX}${userId}` : MENU_KEY
  if (!force) {
    const cached = readStored(userMenuKey)
    if (cached?.expires > Date.now() && Array.isArray(cached.value)) return cached.value
  }
  const { data } = await api.get('/usuarios/menu/')
  const items = data.items ?? []
  if (Array.isArray(items)) writeStored(userMenuKey, items, MENU_TTL)
  return items
}

export function invalidateMenu({ notify = true } = {}) {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (key === MENU_KEY || key?.startsWith(MENU_KEY_PREFIX) || key?.startsWith(USER_KEY_PREFIX)) localStorage.removeItem(key)
    }
  } catch {
    // La invalidación entre pestañas se conserva mediante el evento.
  }
  if (notify) {
    window.dispatchEvent(new Event('ecorutas:menu-invalidated'))
    try { localStorage.setItem(INVALIDATION_SIGNAL_KEY, String(Date.now())) } catch { /* sesión en memoria */ }
  }
}

export function logout() {
  tokenStore.clear()
  window.dispatchEvent(new Event('ecorutas:logout'))
}

export function hasToken() {
  return !!tokenStore.getAccess()
}
