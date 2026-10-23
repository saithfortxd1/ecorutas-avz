# EcoRutas Backend

Backend API + interfaz web para la aplicación EcoRutas, construida con Django y Django REST Framework.

## Tecnologías

- Python 3.12+ (desarrollado y probado con Python 3.14)
- Django 6.1.2
- Django REST Framework 3.18.3
- SimpleJWT (Autenticación JWT)
- drf-yasg (Documentación Swagger UI / Redoc)
- python-dotenv (Variables de entorno)
- Faker (Generación de datos de prueba)
- SQLite (desarrollo) / PostgreSQL (opcional vía `DB_ENGINE`)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/saithfortxd1/ecorutas-backend.git
cd ecorutas-backend

# Crear entorno virtual
py -3.12 -m venv venv   # O bien: python -m venv venv

# Activar entorno virtual
# En macOS/Linux:
source venv/bin/activate

# En Windows (PowerShell):
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass  # Ejecutar si Windows bloquea scripts
.\venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt
```

## Configuración

### Variables de Entorno

Copia el archivo de plantilla y configura tus variables:

```bash
cp .env.example .env
# Edita .env con tus valores
```

Variables principales en `.env`:
- `SECRET_KEY` - Clave secreta de Django. Obligatoria cuando `DEBUG=False`; en desarrollo (`DEBUG=True`) se usa una clave por defecto.
- `DEBUG` - `True`/`False` (por defecto `False` por seguridad).
- `ALLOWED_HOSTS` - Lista de hosts permitidos separados por comas.
- `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` - Configuración de base de datos (por defecto SQLite). Las rutas relativas de SQLite se anclan a la raíz del proyecto.

### Migraciones y Superusuario

1. Ejecuta las migraciones:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
2. Crea un superusuario (opcional):
   ```bash
   python manage.py createsuperuser
   ```

### Poblar Base de Datos (Datos de Prueba)

El proyecto incluye un comando personalizado para generar datos de prueba masivos:

```bash
# Opción básica (limpia datos previos y crea 10 cat, 20 users, 50 exp, 100 disp)
python manage.py seed_db --clean

# Opción personalizada
python manage.py seed_db --categorias 15 --usuarios 30 --experiencias 80 --disponibilidades 200
```

> El comando está deshabilitado cuando `DEBUG=False` (para evitar borrar datos reales). Para
> forzarlo explícitamente usa `--force`.

Este comando crea:
- Categorías de actividades outdoor
- Usuarios (turistas y anfitriones con documentos de identidad)
- Experiencias con precios, geolocalización, estados
- Fotos (Unsplash), traducciones (EN/FR/DE/IT/PT), disponibilidades futuras

## Ejecución

```bash
python manage.py runserver
```

El servidor estará disponible en `http://localhost:8000/`

## Interfaz Web (Frontend)

Cliente web (HTML/JS) incluido para autenticación y gestión según el rol:

- `GET /` - Formulario de Login (guarda los tokens JWT en `localStorage`).
- `GET /registro/` - Formulario de Registro con selección de rol (Turista / Anfitrión).
- `GET /experiencias/` - Panel de experiencias con RBAC: botones de crear/editar/eliminar visibles solo para el anfitrión propietario; bloqueo de la ruta si no hay sesión.

## Roles y Permisos (RBAC)

| Acción | Turista | Anfitrión | Anfitrión propietario | Staff |
|---|---|---|---|---|
| Ver catálogo (categorías, experiencias, disponibilidades) | ✅ | ✅ | ✅ | ✅ |
| Crear/editar experiencias y disponibilidades | ❌ | ✅ | ✅ | ✅ |
| Editar/eliminar una experiencia o disponibilidad concreta | ❌ | ❌ | ✅ | ✅ |
| Gestionar categorías (escritura) | ❌ | ❌ | ❌ | ✅ |

- Un anfitrión con `estado_verificacion = 'rechazado'` pierde los permisos de escritura.
- El anfitrión de una experiencia se asigna automáticamente desde el usuario autenticado (no es editable por el cliente).

## Documentación API

- Swagger UI: `http://localhost:8000/docs/`
- Redoc: `http://localhost:8000/redoc/`
- Browsable API (login por sesión): `http://localhost:8000/api-auth/`

## Endpoints Principales

### Autenticación y Usuarios
- `POST /api/usuarios/registro/` - Registro de nuevos usuarios (Turista/Anfitrión)
- `GET /api/usuarios/me/` - Perfil del usuario autenticado (incluye `rol` y `perfil_anfitrion`)
- `POST /api/login/` - Obtención de tokens JWT (access y refresh) — limitado a 10/min
- `POST /api/login/refresh/` - Renovación del token de acceso — limitado a 10/min

### Catálogo de Experiencias
- `GET/POST /api/catalogo/categorias/` - Lectura pública; escritura solo staff
- `GET/POST /api/catalogo/experiencias/` - Lectura pública; creación/edición solo anfitrión propietario (soporta `?search=` y `?ordering=`)
- `GET/POST /api/catalogo/disponibilidades/` - Lectura pública; gestión solo anfitrión propietario de la experiencia

## Estructura del Proyecto

```text
ecorutas-backend/
├── core/                      # Configuración principal de Django y URLs globales
│   ├── settings.py            # Configuración con variables de entorno y REST_FRAMEWORK
│   └── urls.py                # Rutas del frontend, API, JWT y documentación
├── catalogo/                  # App del catálogo de experiencias
│   ├── models.py              # Modelos (Categoria, Experiencia, Disponibilidad, etc.)
│   ├── views.py               # ViewSets CRUD con permisos RBAC
│   ├── serializers.py         # Serializers DRF (con relaciones anidadas)
│   ├── urls.py                # Rutas de la API de catálogo
│   └── management/
│       └── commands/
│           └── seed_db.py     # Comando para poblar BD con datos de prueba
├── usuarios/                  # App de gestión de usuarios y autenticación
│   ├── models.py              # Modelo personalizado de Usuario (AbstractUser)
│   ├── permissions.py         # Permisos custom: IsAnfitrion, IsTurista, IsOwnerOrReadOnly
│   ├── views.py               # Registro, /me y vistas JWT con throttling
│   ├── serializers.py         # Serializers de registro y perfil
│   └── urls.py                # Rutas del módulo de usuarios
├── templates/                 # Plantillas del frontend (login, registro, experiencias)
├── static/                    # CSS y JS del frontend (cliente API + RBAC)
├── manage.py
├── requirements.txt
├── .gitignore
├── .env                       # Variables de entorno (NO commitear)
└── .env.example               # Plantilla de variables de entorno
```

## Licencia

Proyecto privado - EcoRutas