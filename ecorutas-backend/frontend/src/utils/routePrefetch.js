const loaders = {
  '/experiencias': () => import('../pages/ExperienciasPage.jsx'),
  '/admin/usuarios': () => import('../pages/AdminPage.jsx'),
  '/admin/roles': () => import('../pages/AdminPage.jsx'),
  '/admin/recursos': () => import('../pages/AdminPage.jsx'),
}

const pending = new Map()

export function prefetchRoute(path) {
  const load = loaders[path]
  if (!load) return Promise.resolve()
  if (!pending.has(path)) {
    const request = load().catch((error) => {
      pending.delete(path)
      throw error
    })
    pending.set(path, request)
  }
  return pending.get(path)
}
