/** Mapeador del perfil de usuario (endpoint /api/usuarios/me/). */
export function normalizeUsuario(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    username: raw.username,
    email: raw.email,
    firstName: raw.first_name ?? '',
    lastName: raw.last_name ?? '',
    rol: raw.rol,
    rolDisplay: raw.rol_display ?? raw.rol,
    documentoIdentidad: raw.documento_identidad ?? null,
    estadoVerificacion: raw.estado_verificacion ?? null,
    perfilAnfitrion: raw.perfil_anfitrion ?? null,
    isStaff: !!raw.is_staff,
    isSuperuser: !!raw.is_superuser,
  }
}

export function fullName(usuario) {
  if (!usuario) return ''
  const nombre = [usuario.firstName, usuario.lastName].filter(Boolean).join(' ').trim()
  return nombre || usuario.username || ''
}

export function isAnfitrion(usuario) {
  return usuario?.rol === 'anfitrion'
}
