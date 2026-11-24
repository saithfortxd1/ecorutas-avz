# Changelog

Todas las modificaciones relevantes de EcoRutas. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y el versionado
semantico [SemVer](https://semver.org/lang/es/).

## [1.1.0] - 2026-11-24

### Agregado
- Pruebas de integracion del RBAC en `usuarios/tests.py` (turista vs administrador,
  acceso a recursos/roles/usuarios y contenido de `/api/usuarios/me/`).
- Documentacion de contribucion (`CONTRIBUTING.md`) y este `CHANGELOG.md`.
- Base de la API del frontend configurable por entorno (`VITE_API_URL`), con
  fallback a `http://127.0.0.1:8011/api`.

### Cambiado
- El cliente Axios deja de tener la URL hardcodeada y respeta la variable de entorno.
- El Control de Acceso (`AdminPage`) carga solo la pestana activa y calcula los
  permisos por ruta/endpoint (RBAC), ocultando acciones no permitidas.

### Corregido
- Un `403` ya no cierra la sesion ni expulsa al usuario; solo un token invalido o
  expirado (401 sin refresh valido) cierra sesion.
- `ProtectedRoute` valida con los `recursos` del usuario y muestra un bloqueo limpio
  en lugar de una redireccion forzada.
- Eliminada la copia duplicada anidada `ecorutas-backend/frontend/` (incluia artefactos
  de build) que inflaba el repositorio.

## [1.0.0] - 2026-11-04

### Agregado
- Backend Django/DRF con JWT (login, refresh, registro), CORS y Swagger.
- RBAC relacional (Usuario <-> Rol <-> Recurso) con `/api/usuarios/me/` y
  `/api/usuarios/menu/` exponiendo los recursos del usuario.
- Modulo de catalogo (categorias, experiencias, disponibilidades, traducciones, fotos).
- Frontend React + Vite + Tailwind con landing, login, registro y catalogo.
- Asignacion del recurso "Gestion de Recursos" al rol Turista.

### Corregido
- Limpieza de recursos residuales y coherencia de permisos por rol.