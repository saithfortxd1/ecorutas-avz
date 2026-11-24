# Auditoría y Entregable — Semana 15 (EcoRutas)

| Campo | Valor |
|---|---|
| Proyecto | EcoRutas (backend Django/DRF + frontend React/Vite) |
| Versión | **v1.1.0** |
| Rama estable | `main` |
| Tag | `v1.1.0` (anotado) |
| Backend | `http://127.0.0.1:8011/api/` |
| Frontend | `http://localhost:5173/` (Vite) |
| Fecha | 2026-11-24 |

## Resumen de verificación (evidencia real)

| Comando | Resultado |
|---|---|
| `python manage.py check` | `System check identified no issues (0 silenced).` |
| `python manage.py test` | `Found 6 test(s)` → `OK` |
| `npm run build` (frontend) | `✓ built` (AdminPage 17.16 kB, index 267.32 kB) |

## Estado del repositorio

| Elemento | Estado |
|---|---|
| `git status` | Limpio (sin cambios pendientes) |
| Carpetas duplicadas anidadas rastreadas | **0** (eliminada `ecorutas-backend/frontend/`) |
| Archivos rastreados | 91 (antes 136) |
| Ramas | `main`, `feature/auditoria-semana15`, `fix/rbac-control-acceso-admin` |
| Tag | `v1.1.0` |

---

## Fase 1 — Hallazgos por estado

### Seguridad / configuración

| ID | Hallazgo | Estado |
|---|---|---|
| SEC-01 | `.env` no rastreado; `.gitignore` cubre `venv/`, `node_modules/`, `dist/`, `db.sqlite3`, `.env` | No aplica (correcto) |
| SEC-02 | `DEBUG` por defecto `False`; `SECRET_KEY` obligatoria fuera de desarrollo | No aplica (endurecido) |
| SEC-03 | `CORS_ALLOWED_ORIGINS` configurable (5173/5174/3000) | No aplica (correcto) |
| SEC-04 | Throttle de login `10/min` | No aplica (correcto) |
| SEC-05 | Un 403 en frontend podía cerrar sesión / expulsar | Corregido |

### Bugs / RBAC / HTTP

| ID | Hallazgo | Estado |
|---|---|---|
| BUG-01 | `AdminPage` pedía las 3 secciones con `Promise.all` → 403 en Turista | Corregido |
| BUG-02 | Toast automático en cada 403 (mensajes duplicados) | Corregido |
| BUG-03 | `ProtectedRoute` usaba `menu` y redirigía a `/` (expulsión) | Corregido |
| BUG-04 | `AuthContext` hacía logout ante cualquier error de `/me/` | Corregido |
| BUG-05 | URL de API hardcodeada; `.env.example` con `VITE_API_URL` sin uso | Corregido |

### Estructura / arquitectura

| ID | Hallazgo | Estado |
|---|---|---|
| STR-01 | Carpeta duplicada anidada con artefactos de build (51 archivos) | Corregido |
| STR-02 | `AdminPage` monolítico (200+ líneas) | Corregido (AdminList/AdminForm) |
| STR-03 | Consultas de permisos repetidas por rol | Corregido (prefetch + caché) |

### Pruebas / documentación / entorno

| ID | Hallazgo | Estado |
|---|---|---|
| TEST-01 | 0 pruebas automatizadas | Corregido (6 tests RBAC) |
| TEST-02 | `catalogo/tests.py` es un stub | Pendiente |
| DOC-01 | Faltaban `CONTRIBUTING.md` y `CHANGELOG.md` | Corregido |
| ENV-01 | `usuarios/` en la raíz del workspace sombrea la app al descubrir tests | Aceptado con riesgo (artefacto de entorno, fuera del repo; ejecutar tests desde el directorio del proyecto) |

---

## Parte 1 — Diagnóstico de deuda técnica

| ID | Deuda técnica | Impacto | Riesgo | Prioridad | Acción propuesta | Estado |
|---|---|---|---|---|---|---|
| DT-01 | Copia duplicada anidada con artefactos de build | Repo inflado y confuso | Alto | Alta | Eliminar y evitar re-commit | Corregido |
| DT-02 | URL de API hardcodeada | Rompe despliegues/cambio de puerto | Alto | Alta | `VITE_API_URL` con fallback 8011 | Corregido |
| DT-03 | Cero pruebas automatizadas | Regresiones no detectadas | Alto | Alta | Suite RBAC con `APITestCase` | Corregido |
| DT-04 | Sin `CONTRIBUTING.md`/`CHANGELOG.md` | Flujo y versionado no documentados | Medio | Media | Crear ambos | Corregido |
| DT-05 | 403 cerraba sesión / expulsaba | Falsos logouts y mala UX | Alto | Alta | Solo 401 cierra sesión; bloqueo limpio | Corregido |
| DT-06 | `catalogo/tests.py` vacío | Catálogo sin cobertura | Medio | Media | Añadir tests de catálogo | Pendiente |
| DT-07 | `usuarios/` en raíz del workspace | Falla descubrimiento de tests fuera del dir del proyecto | Bajo | Baja | Renombrar/documentar carpeta del workspace | Aceptado con riesgo |
| DT-08 | `AdminPage` monolítico | Difícil de mantener | Medio | Media | Dividir en `AdminList`/`AdminForm` | Corregido |

## Parte 2 — Issues

| ID | Tipo | Título | Descripción | Prioridad | Responsable | Criterio de aceptación | Estado |
|---|---|---|---|---|---|---|---|
| ISS-01 | Bug | Control de acceso rompía sesión (Turista) | 403 masivos y expulsión al abrir Usuarios/Roles | Alta | Backend/Frontend | Turista opera Recursos sin logout; 403 no cierra sesión | Corregido |
| ISS-02 | Mejora | API configurable por entorno | Sustituir URL hardcodeada por `VITE_API_URL` | Media | Frontend | Login funciona con y sin `.env` | Corregido |
| ISS-03 | Deuda | Falta de pruebas RBAC | Cobertura de permisos por recurso | Alta | Backend | ≥6 tests pasando | Corregido |
| ISS-04 | Deuda | Copia duplicada anidada | Duplicados + build en el repo | Alta | Release | `git ls-files` sin `ecorutas-backend/` | Corregido |
| ISS-05 | Docs | Contribución y versionado | Sin guía ni changelog | Media | Release | `CONTRIBUTING.md` y `CHANGELOG.md` presentes | Corregido |

## Parte 3 — Ramas de trabajo

| Rama | Tipo | Base | Estado |
|---|---|---|---|
| `main` | Estable | — | Activa |
| `fix/rbac-control-acceso-admin` | Corrección | `main` | Integrada (`541397b`) |
| `feature/auditoria-semana15` | Mejora | `main` | Integrada (`332decb`) |

## Parte 4 — Cambios reales implementados y pruebas

| # | Cambio | Rama | Verificación |
|---|---|---|---|
| 1 | RBAC del Control de Acceso: carga por pestaña, gating por ruta/endpoint, 403 sin logout | `fix/rbac-control-acceso-admin` | Build OK; HTTP 200/403 coherentes |
| 2 | URL de API configurable (`VITE_API_URL`) | `feature/auditoria-semana15` | Build OK |
| 3 | 6 pruebas RBAC (`usuarios/tests.py`) | `feature/auditoria-semana15` | `manage.py test` → OK |
| 4 | Eliminación de copia duplicada (51 archivos) | `feature/auditoria-semana15` | Repo −51 archivos |
| 5 | `CONTRIBUTING.md` + `CHANGELOG.md` | `feature/auditoria-semana15` | — |

## Parte 5 — Commits descriptivos

| Hash | Mensaje |
|---|---|
| `ba38e6a` | `fix: ajustar RBAC del control de acceso y evitar cierres de sesion por 403` |
| `541397b` | `merge: integrar fix/rbac-control-acceso-admin (PR local #1)` |
| `3b2a91b` | `chore: eliminar copia duplicada anidada del frontend (incluye artefactos de build)` |
| `7e71573` | `refactor(frontend): usar VITE_API_URL como base configurable de la API` |
| `a490652` | `test(usuarios): agregar pruebas de RBAC para turista y administrador` |
| `95eef10` | `docs: agregar CONTRIBUTING y CHANGELOG de la version 1.1.0` |
| `332decb` | `merge: integrar feature/auditoria-semana15 (PR local #2)` |

## Parte 6 — Pull / Merge Requests

Las integraciones a `main` se realizaron mediante **merge commits locales con `--no-ff`** (no se publicó en GitHub ni se usó `gh`). Cada merge conserva la historia de la rama y documenta la integración.

| PR local | Rama | Base | Issue | Verificación | Evidencia | Estado |
|---|---|---|---|---|---|---|
| #1 | `fix/rbac-control-acceso-admin` | `main` | ISS-01 | Build + HTTP 403/200 | `541397b` | Integrado |
| #2 | `feature/auditoria-semana15` | `main` | ISS-02/03/04/05 | tests 6 OK + build | `332decb` | Integrado |
| #3 | `docs/entregable-semana15` | `main` | DOC-01 | check/test/build | merge de este documento | Integrado |

Comandos para abrir Pull Requests reales si se publican en GitHub:

```bash
git push -u origin fix/rbac-control-acceso-admin
git push -u origin feature/auditoria-semana15
gh pr create --base main --head fix/rbac-control-acceso-admin \
  --title "fix(rbac): control de acceso para turista sin cierre de sesion" \
  --body "Closes ISS-01. Verificado con build y pruebas HTTP 403/200."
gh pr create --base main --head feature/auditoria-semana15 \
  --title "feat: pruebas RBAC, API configurable y limpieza estructural" \
  --body "Closes ISS-02, ISS-03, ISS-04, ISS-05. 6 tests OK; build OK."
```

## Parte 7 y 8 — Versión del proyecto y tag

| Versión | Justificación | Tag |
|---|---|---|
| **v1.1.0** (MINOR) | Cambios retrocompatibles: nuevas pruebas, documentación y configuración por entorno, más correcciones sin romper contratos de API. No hay cambios incompatibles (no MAJOR). No es solo PATCH porque agrega capacidades verificables. | `v1.1.0` (anotado) |

Mensaje del tag: `v1.1.0 - Auditoria Semana 15: RBAC, pruebas, API configurable y limpieza estructural`.

## Parte 9 — Documentación actualizada

| Documento | Estado |
|---|---|
| `README.md` | Vigente: qué hace, tecnologías, requisitos/instalación, ejecución (`runserver 8011`), Vite en 5173, RBAC, endpoints, comprobaciones y versión |
| `CONTRIBUTING.md` | Creado: ramas, Conventional Commits, proceso de PR, reglas |
| `CHANGELOG.md` | Creado: `1.1.0` (actual) y `1.0.0` (base) |
| `AUDITORIA_SEMANA_15.md` | Creado: este entregable (Partes 1–12 + checklist) |

## Parte 10 — Trazabilidad completa

| Issue | Problema (descripción) | Rama | Commit | PR / Merge | Integración | Versión |
|---|---|---|---|---|---|---|
| ISS-01 | Con sesión de Turista, el Control de Acceso pedía Usuarios/Roles/Recursos a la vez; los 403 cerraban la sesión y expulsaban al usuario | `fix/rbac-control-acceso-admin` | `ba38e6a` | PR local #1 | `541397b` | v1.1.0 |
| ISS-03 | No existían pruebas que garantizaran que un Turista solo accede a Recursos y un Admin a todo | `feature/auditoria-semana15` | `a490652` | PR local #2 | `332decb` | v1.1.0 |
| ISS-04 | Carpeta `ecorutas-backend/frontend/` duplicada y rastreada, con artefactos de build que inflaban el repo | `feature/auditoria-semana15` | `3b2a91b` | PR local #2 | `332decb` | v1.1.0 |
| ISS-02 | La URL de la API estaba hardcodeada en el cliente Axios, ignorando `VITE_API_URL` | `feature/auditoria-semana15` | `7e71573` | PR local #2 | `332decb` | v1.1.0 |
| ISS-05 | Faltaba documentación de contribución y de cambios entre versiones | `feature/auditoria-semana15` | `95eef10` | PR local #2 | `332decb` | v1.1.0 |

## Parte 11 — Estado actual del software

- **Versión:** `v1.1.0` en `main`.
- **Funcionalidades:** JWT (login/refresh/registro), RBAC relacional (Usuario↔Rol↔Recurso), menú/`me` con `recursos`, catálogo (categorías, experiencias, disponibilidades, traducciones, fotos), frontend React (landing, login, registro, catálogo, control de acceso), Swagger/Redoc, seed de datos.
- **Cambios realizados:** fix RBAC del control de acceso, URL de API configurable, 6 pruebas RBAC, eliminación de duplicado anidado, documentación de contribución/changelog y este informe.
- **Errores pendientes:** ninguno bloqueante; `check` y `test` limpios y build correcto.
- **Mejoras pendientes:** pruebas de `catalogo`, cobertura de componentes admin, publicación de PR reales en GitHub.
- **Deudas identificadas/corregidas:** DT-01, DT-02, DT-03, DT-04, DT-05, DT-08 → corregidas. DT-06/DT-07 → pendientes/aceptadas.

## Parte 12 — Preguntas de reflexión (10)

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | ¿Qué deuda técnica identificaste y por qué importa? | Duplicados anidados, URL hardcodeada, ausencia de tests y manejo incorrecto de 403; encarecen el mantenimiento y provocan fallos de acceso. |
| 2 | ¿Cómo priorizaste los cambios? | Primero seguridad/control de acceso (bugs que expulsaban usuarios), luego estructura y finalmente documentación. |
| 3 | ¿Cómo gestionaste el versionado? | SemVer: cambios retrocompatibles con nuevas capacidades → MINOR → `v1.1.0` con tag anotado. |
| 4 | ¿Qué papel jugaron ramas y commits? | Ramas `fix/*` y `feature/*` con commits atómicos y Conventional Commits para historial legible y reversible. |
| 5 | ¿Cómo verificaste que no se rompió el sistema? | `manage.py check`, `manage.py test` (6 OK), `npm run build` y pruebas HTTP reales 200/403. |
| 6 | ¿Qué aprendiste sobre PR y colaboración? | Integrar con merge `--no-ff` deja trazabilidad; un PR documentado (issue, verificación, evidencia) facilita la revisión. |
| 7 | ¿Cómo manejaste seguridad y permisos? | Autorización en backend por recurso/método y gating en frontend por ruta; un 403 nunca cierra sesión. |
| 8 | ¿Qué harías diferente en la próxima iteración? | Automatizar CI (check+test+build) y publicar PR reales desde el inicio. |
| 9 | ¿Cómo documentaste la evolución y por qué es relevante? | `README`, `CONTRIBUTING`, `CHANGELOG` y este informe; permiten reproducir y auditar los cambios. |
| 10 | ¿Qué impacto tiene esta entrega en la calidad del producto? | Mayor confiabilidad del RBAC, menos falsos logouts, repo más limpio y verificación automatizada repetible. |

## Checklist final — 14 mínimos del entregable

| # | Elemento | Estado |
|---|---|---|
| 1 | `README.md` completo | Cumplido |
| 2 | `CONTRIBUTING.md` (ramas, commits, PR, reglas) | Cumplido |
| 3 | `CHANGELOG.md` | Cumplido |
| 4 | Informe con Partes 1–12 | Cumplido |
| 5 | Diagnóstico de deuda (≥5) | Cumplido (8) |
| 6 | Issues (bug + mejora + deuda) | Cumplido (5) |
| 7 | Ramas `feature/*` y `fix/*` | Cumplido |
| 8 | Commits convencionales descriptivos | Cumplido |
| 9 | PR/MR documentado (descripción, issue, verificación) | Parcial — merges locales `--no-ff` documentados + comandos `gh` |
| 10 | Versión semántica justificada | Cumplido (MINOR → v1.1.0) |
| 11 | Tag de versión | Cumplido (`v1.1.0`) |
| 12 | Pruebas ejecutadas con evidencia | Cumplido (6 OK) |
| 13 | Build del frontend | Cumplido |
| 14 | Trazabilidad completa (≥2 cambios) | Cumplido (5) |

## Comandos de publicación (ejecutar manualmente)

```bash
# Publicar la rama principal y el tag de versión
git push origin main
git push origin v1.1.0

# (Opcional) publicar el historial de ramas
git push origin fix/rbac-control-acceso-admin feature/auditoria-semana15
```