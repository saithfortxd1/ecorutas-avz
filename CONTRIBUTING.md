# Contribuir a EcoRutas

Gracias por contribuir. Este documento describe el flujo de trabajo, las
convenciones de ramas/commits y el proceso de Pull Request.

## Requisitos previos

- Python 3.12+ y el entorno virtual del backend (`venv/`).
- Node.js 18+ para el frontend (`frontend/`).
- Backend en `http://127.0.0.1:8011/api/` y frontend Vite en `http://localhost:5173/`.

## Ramas

| Rama | Proposito |
|------|-----------|
| `main` | Rama estable e integrable. Solo recibe cambios via PR. |
| `feature/<descripcion>` | Nuevas funcionalidades o mejoras. |
| `fix/<descripcion>` | Correccion de bugs. |
| `docs/<descripcion>` | Cambios solo de documentacion. |
| `refactor/<descripcion>` | Cambios internos sin alterar comportamiento. |
| `chore/<descripcion>` | Mantenimiento (dependencias, limpieza, tooling). |

Reglas:
- Parte siempre de `main` actualizado: `git switch main && git pull`.
- Usa nombres en minusculas, sin tildes ni espacios: `fix/rbac-control-acceso`, `feature/exportar-experiencias`.
- Una rama = un objetivo. Manten los cambios acotados.

## Convencion de commits (Conventional Commits)

Formato:

```
<tipo>(<alcance opcional>): <descripcion en imperativo>
```

Tipos permitidos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `build`, `ci`.

Ejemplos:

```
feat(usuarios): agregar endpoint de perfil
fix(rbac): impedir cierre de sesion ante 403
test(usuarios): cubrir permisos de turista y administrador
docs: agregar CHANGELOG de la version 1.1.0
```

Prohibido: mensajes vagos como `cambios`, `final`, `arreglo`, `ahora-si`.

## Proceso de Pull Request

1. Crea la rama desde `main` y haz commits atomicos.
2. Verifica localmente antes de abrir el PR:
   - Backend: `python manage.py check` y `python manage.py test`.
   - Frontend: `cd frontend && npm run build`.
3. Abre el PR hacia `main` con:
   - Titulo en formato Conventional Commits.
   - Descripcion: que cambia y por que, issue relacionado (`Closes #N`).
   - Instrucciones de verificacion y evidencia (salida de tests/build).
4. Requiere al menos 1 revision. No mergear con checks en rojo.
5. Integra con merge (sin `--force`) y elimina la rama.

## Reglas basicas

- No subas `.env`, `db.sqlite3`, `venv/`, `node_modules/` ni `dist/`.
- No expongas `SECRET_KEY` ni credenciales; usa `.env` (ver `.env.example`).
- Compara rutas/permisos, no nombres con tildes, en el RBAC.
- Todo cambio funcional debe incluir pruebas o justificar su ausencia.
- Manten el estilo del codigo existente y evita duplicar logica.