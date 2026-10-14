# EcoRutas Backend

Backend API para la aplicación EcoRutas, construida con Django y Django REST Framework.

## Tecnologías

- Python 3.12+
- Django 6.1.2
- Django REST Framework 3.18.3
- SimpleJWT (Autenticación JWT)
- drf-yasg (Documentación Swagger UI)

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

1. Ejecuta las migraciones:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
2. Crea un superusuario (opcional):
   ```bash
   python manage.py createsuperuser
   ```

## Ejecución

```bash
python manage.py runserver
```

El servidor estará disponible en `http://localhost:8000/`

## Documentación API

- Swagger UI: `http://localhost:8000/docs/`

## Endpoints Principales

### Autenticación y Usuarios
- `POST /api/usuarios/registro/` - Registro de nuevos usuarios (Turista/Anfitrión)
- `POST /api/login/` - Obtención de tokens JWT (access y refresh)
- `POST /api/login/refresh/` - Renovación del token de acceso

### Catálogo de Experiencias
- `GET/POST /api/catalogo/categorias/`
- `GET/POST /api/catalogo/experiencias/`
- `GET/POST /api/catalogo/disponibilidades/`

## Estructura del Proyecto

```text
ecorutas-backend/
├── core/                  # Configuración principal de Django y URLs globales
├── catalogo/              # App del catálogo de experiencias
│   ├── models.py          # Modelos (Categoria, Experiencia, etc.)
│   ├── views.py           # ViewSets CRUD
│   ├── serializers.py     # Serializers DRF
│   └── urls.py            # Rutas de la API de catálogo
├── usuarios/              # App de gestión de usuarios y autenticación
│   ├── models.py          # Modelo personalizado de Usuario (AbstractUser)
│   ├── views.py           # Vistas de registro de usuarios
│   ├── serializers.py     # Serializador con hashing de contraseñas
│   └── urls.py            # Rutas del módulo de usuarios
├── manage.py
├── requirements.txt
└── .gitignore
```

## Licencia

Proyecto privado - EcoRutas
