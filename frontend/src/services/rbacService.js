import api from '../api/axiosClient.js'
import { cache } from '../utils/cache.js'
import { invalidateMenu } from './authService.js'

const ADMIN_LIST_TTL = 15_000

function list(key, path) {
  return cache.getOrSet(`rbac:${key}:list`, () => api.get(path).then(({ data }) => data), { ttl: ADMIN_LIST_TTL })
}

async function mutate(request, invalidations) {
  const response = await request
  invalidations.forEach((key) => cache.invalidatePrefix(`rbac:${key}:`))
  invalidateMenu()
  return response.data
}

export const usuariosAdmin = {
  list: () => list('usuarios', '/usuarios/admin/'),
  create: (payload) => mutate(api.post('/usuarios/admin/', payload), ['usuarios']),
  update: (id, payload) => mutate(api.put(`/usuarios/admin/${id}/`, payload), ['usuarios']),
  remove: (id) => mutate(api.delete(`/usuarios/admin/${id}/`), ['usuarios']),
}

export const rolesAdmin = {
  list: () => list('roles', '/usuarios/roles/'),
  create: (payload) => mutate(api.post('/usuarios/roles/', payload), ['roles']),
  update: (id, payload) => mutate(api.put(`/usuarios/roles/${id}/`, payload), ['roles']),
  remove: (id) => mutate(api.delete(`/usuarios/roles/${id}/`), ['roles']),
}

export const recursosAdmin = {
  list: () => list('recursos', '/usuarios/recursos/'),
  create: (payload) => mutate(api.post('/usuarios/recursos/', payload), ['recursos', 'roles']),
  update: (id, payload) => mutate(api.put(`/usuarios/recursos/${id}/`, payload), ['recursos', 'roles']),
  remove: (id) => mutate(api.delete(`/usuarios/recursos/${id}/`), ['recursos', 'roles']),
}
