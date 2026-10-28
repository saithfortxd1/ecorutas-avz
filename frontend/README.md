# EcoRutas Frontend

Aplicación **SPA desacoplada** para la API de EcoRutas, construida con **React + Vite + Tailwind CSS**.
Es un proyecto **independiente** del backend Django: consume la API REST por HTTP (JWT) y no comparte código con ella.

## Tecnologías

- React 18
- Vite 5 (code-splitting / `React.lazy`)
- Tailwind CSS 3
- react-router-dom 6 (SPA / enrutamiento)
- axios (peticiones HTTP + interceptores JWT)

## Requisitos previos

- Node.js 18+ y npm
- El backend de EcoRutas corriendo en `http://127.0.0.1:8000`

## Instalación y ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. (Opcional) Configurar la URL de la API
cp .env.example .env
#   Edita VITE_API_BASE_URL si tu backend no está en http://127.0.0.1:8000/api

# 3. Levantar el servidor de desarrollo
npm run dev
```

La app quedará disponible en `http://localhost:5173`.

### Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Previsualiza el build de producción |

## Conexión con el backend (CORS)

El backend ya incluye `django-cors-headers` configurado para permitir esta SPA
(`CORS_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']` en `core/settings.py`),
y `CorsMiddleware` está registrado antes de `CommonMiddleware`.

> **Alternativa sin CORS:** en `vite.config.js` está comentado un proxy `/api`. Descoméntalo y
> define `VITE_API_BASE_URL=/api` en tu `.env` para que Vite reenvíe las peticiones al backend
> (mismo origen, sin configurar CORS).

## Rutas de la aplicación

| Ruta | Pantalla | Endpoints consumidos |
|---|---|---|
| `/` | **Landing page** pública (qué es EcoRutas + CTA) | — |
| `/login` | Inicio de sesión | `POST /api/login/` |
| `/registro` | Registro con selector de rol | `POST /api/usuarios/registro/` |
| `/experiencias` | Catálogo de experiencias (protegida) | `GET /api/catalogo/experiencias/` y `GET /api/catalogo/categorias/` |

El botón **Explorar Experiencias** de la landing lleva a `/experiencias`; si el usuario no tiene
sesión, la ruta protegida lo redirige a `/login`.

## Arquitectura por capas

El código de `src/` está separado en capas con responsabilidades claras:

```
src/
├── api/          # Transporte: instancia axios + interceptores JWT (sin lógica de negocio)
├── services/     # Acceso a datos por entidad (encapsula las llamadas Axios)
├── models/       # Mapeadores/adaptadores: respuesta de la API <-> modelo de UI
├── utils/        # Utilidades transversales (errores, caché)
├── context/      # Estado global de React (sesión y rol)
├── components/   # Componentes de presentación reutilizables
└── pages/        # Vistas desligadas de la lógica de red
```

- **Servicios** (`src/services/`): `authService.js`, `experienciaService.js`, `categoriaService.js`.
  Las páginas nunca llaman a `axios` directamente; solo invocan servicios.
- **Modelos** (`src/models/`): `Usuario.js`, `Categoria.js`, `Experiencia.js` normalizan las
  respuestas de la API a objetos de UI limpios (`normalizeExperiencia`, `normalizeUsuario`, …) y
  convierten de vuelta al payload de la API (`experienciaToPayload`).

## Rendimiento

- **Caché en memoria** (`src/utils/cache.js`): guarda el *promise* de cada consulta con TTL
  (categorías 5 min, experiencias 30 s). Las peticiones repetidas se resuelven al instante
  (lectura O(1) en un `Map`, sin red) y las consultas idénticas concurrentes se deduplican.
  Las mutaciones invalidan la caché de la entidad afectada.
- **Carga perezosa** (`React.lazy` + `<Suspense>` en `src/App.jsx`): cada pantalla se descarga
  bajo demanda, reduciendo el bundle inicial y acelerando el primer renderizado.

## Autenticación JWT

- Los tokens `access` y `refresh` se guardan en `localStorage`.
- Un **interceptor de petición** de Axios adjunta `Authorization: Bearer <access_token>` en cada llamada.
- Un **interceptor de respuesta** detecta el `401`, renueva el token con `POST /api/login/refresh/`
  y reintenta la petición original una sola vez (con *single-flight*). Si el refresh falla, se
  limpia la sesión y se vuelve a `/login`.

Archivo: `src/api/axiosClient.js`.

## Control de Accesos por Rol (RBAC)

- Al iniciar (y tras el login) se consulta `GET /api/usuarios/me/` y el perfil se guarda en un
  **contexto global** de React (`src/context/AuthContext.jsx`), incluyendo `rol`.
- El botón **"+ Crear Experiencia"** (Navbar) solo se muestra si el rol es `anfitrion`.
- Los botones **Editar** / **Eliminar** de cada tarjeta solo aparecen si el usuario es `anfitrion`
  **y** es el propietario del registro (`isOwner(experiencia, user)`).
- La ruta `/experiencias` está protegida: sin sesión redirige a `/login` (ver `ProtectedRoute`).

> La autorización real es la del backend; el frontend solo oculta/muestra acciones.

## Estructura del proyecto

```text
ecorutas-frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx                     # Router con React.lazy + Suspense
    ├── index.css
    ├── api/
    │   └── axiosClient.js          # Instancia axios + interceptores JWT y refresh
    ├── services/
    │   ├── authService.js          # login / registro / me / logout
    │   ├── experienciaService.js   # CRUD de experiencias (con caché)
    │   └── categoriaService.js     # categorías (con caché)
    ├── models/
    │   ├── Usuario.js
    │   ├── Categoria.js
    │   ├── Experiencia.js
    │   └── index.js
    ├── utils/
    │   ├── errors.js               # Mensajes de error de DRF
    │   └── cache.js                # Caché en memoria con TTL y deduplicación
    ├── context/
    │   └── AuthContext.jsx         # Estado global: usuario, rol, login/registro/logout
    ├── components/
    │   ├── Navbar.jsx              # Cabecera con RBAC
    │   ├── ProtectedRoute.jsx      # Bloqueo de rutas sin sesión
    │   ├── FullScreenLoader.jsx    # Fallback de Suspense
    │   ├── ExperienciaCard.jsx     # Tarjeta con Editar/Eliminar condicionales
    │   └── ExperienciaFormModal.jsx
    └── pages/
        ├── LandingPage.jsx
        ├── LoginPage.jsx
        ├── RegistroPage.jsx
        └── ExperienciasPage.jsx
```
