/**
 * Caché en memoria con TTL para peticiones repetidas.
 *
 * Guarda el *promise* resultante, de modo que:
 *  - respuestas ya cacheadas se resuelven al instante (lectura O(1) en el Map),
 *  - peticiones idénticas concurrentes se deduplican en una sola llamada de red.
 *
 * Los fallos no se cachean (se eliminan de la entrada).
 */
const store = new Map()

export const cache = {
  /**
   * @param {string} key
   * @param {() => Promise<any>} factory
   * @param {{ ttl?: number, force?: boolean }} [options]
   */
  getOrSet(key, factory, { ttl = 60_000, force = false } = {}) {
    const now = Date.now()
    const hit = store.get(key)

    if (!force && hit && hit.expires > now) {
      return hit.value
    }

    const value = Promise.resolve().then(factory)
    const entry = { value, expires: now + ttl }
    store.set(key, entry)

    value.catch(() => {
      // No cachear errores: permite reintentar la próxima vez.
      if (store.get(key) === entry) store.delete(key)
    })

    return value
  },

  /** Elimina todas las entradas cuya clave empiece por `prefix`. */
  invalidatePrefix(prefix) {
    for (const key of Array.from(store.keys())) {
      if (key.startsWith(prefix)) store.delete(key)
    }
  },

  clear() {
    store.clear()
  },

  /** Tamaño actual (útil para depuración/tests). */
  get size() {
    return store.size
  },
}
