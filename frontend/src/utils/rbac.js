/**
 * Utilidades RBAC compartidas por el frontend.
 *
 * Regla de oro: se comparan RUTAS y METODOS, nunca nombres con tildes, para
 * evitar fallos de codificacion. Cuando hace falta comparar texto se usa
 * `normalizeText`, que quita acentos y pasa a minusculas.
 */

const WRITE_METHODS = new Set(['post', 'put', 'patch', 'delete'])

/** Normaliza texto (minusculas, sin acentos) para comparaciones tolerantes. */
export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function stripTrailingSlash(value) {
  return String(value ?? '').replace(/\/+$/, '')
}

/** Paths de API declarados por un recurso (campo `permisos`). */
export function resourceApiPaths(recurso) {
  const permisos = Array.isArray(recurso?.permisos) ? recurso.permisos : []
  return permisos.map((permiso) => stripTrailingSlash(permiso?.path)).filter(Boolean)
}

/** true si el recurso corresponde a la ruta de frontend indicada. */
export function resourceMatchesFrontendPath(recurso, pathname) {
  const base = stripTrailingSlash(recurso?.path)
  if (!base) return false
  const target = stripTrailingSlash(pathname)
  return target === base || target.startsWith(`${base}/`)
}

/** true si el recurso declara el endpoint de API indicado. */
export function resourceMatchesApiPath(recurso, apiPath) {
  const target = stripTrailingSlash(apiPath)
  if (!target) return false
  return resourceApiPaths(recurso).some((path) => target === path || target.startsWith(`${path}/`))
}

/** true si el usuario (por sus recursos) puede abrir la ruta de frontend. */
export function canAccessPath(recursos, pathname) {
  return (recursos ?? []).some((recurso) => resourceMatchesFrontendPath(recurso, pathname))
}

/** Recurso asociado a una ruta de frontend (o null). */
export function findResourceByPath(recursos, pathname) {
  return (recursos ?? []).find((recurso) => resourceMatchesFrontendPath(recurso, pathname)) ?? null
}

/** Recurso asociado a un endpoint de API (o null). */
export function findResourceByApiPath(recursos, apiPath) {
  return (recursos ?? []).find((recurso) => resourceMatchesApiPath(recurso, apiPath)) ?? null
}

/** true si el recurso permite operaciones de escritura (POST/PUT/PATCH/DELETE). */
export function resourceCanWrite(recurso) {
  const permisos = Array.isArray(recurso?.permisos) ? recurso.permisos : []
  return permisos.some((permiso) => {
    const methods = Array.isArray(permiso?.methods) ? permiso.methods : []
    return methods.some((method) => WRITE_METHODS.has(String(method).toLowerCase()))
  })
}

/** true si el usuario puede abrir la ruta y ademas gestionarla (escritura). */
export function canManagePath(recursos, pathname) {
  const recurso = findResourceByPath(recursos, pathname)
  return Boolean(recurso) && resourceCanWrite(recurso)
}
