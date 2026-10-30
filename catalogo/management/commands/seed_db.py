import random
from decimal import Decimal
from datetime import date, time, timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from faker import Faker

from catalogo.models import Categoria, Experiencia, FotoExperiencia, Disponibilidad, ExperienciaTraduccion
from usuarios.models import Recurso, Rol

Usuario = get_user_model()

fake = Faker('es_ES')


class Command(BaseCommand):
    help = 'Poblar la base de datos con datos de prueba (Categorías, Usuarios, Experiencias, Fotos, Disponibilidades, Traducciones)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Permitir la ejecución aunque DEBUG=False (puede borrar datos reales).',
        )
        parser.add_argument(
            '--clean',
            action='store_true',
            help='Eliminar datos existentes antes de poblar',
        )
        parser.add_argument(
            '--categorias',
            type=int,
            default=10,
            help='Número de categorías a crear',
        )
        parser.add_argument(
            '--usuarios',
            type=int,
            default=20,
            help='Número de usuarios a crear',
        )
        parser.add_argument(
            '--experiencias',
            type=int,
            default=50,
            help='Número de experiencias a crear',
        )
        parser.add_argument(
            '--disponibilidades',
            type=int,
            default=100,
            help='Número de disponibilidades a crear',
        )

    def handle(self, *args, **options):
        # Salvaguarda: este comando puede borrar usuarios y catálogo reales.
        if not settings.DEBUG and not options.get('force'):
            raise CommandError(
                'seed_db está deshabilitado cuando DEBUG=False porque puede '
                'borrar datos reales. Ejecuta con --force solo si es intencional.'
            )

        clean = options['clean']
        n_categorias = options['categorias']
        n_usuarios = options['usuarios']
        n_experiencias = options['experiencias']
        n_disponibilidades = options['disponibilidades']

        self.crear_rbac()

        if clean:
            self.stdout.write(self.style.WARNING('Eliminando datos existentes...'))
            Disponibilidad.objects.all().delete()
            FotoExperiencia.objects.all().delete()
            ExperienciaTraduccion.objects.all().delete()
            Experiencia.objects.all().delete()
            Categoria.objects.all().delete()
            Usuario.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS('Datos eliminados.'))

        self.stdout.write(self.style.NOTICE('Creando categorías...'))
        categorias = self.crear_categorias(n_categorias)

        self.stdout.write(self.style.NOTICE('Creando usuarios...'))
        usuarios = self.crear_usuarios(n_usuarios)

        anfitriones = [u for u in usuarios if u.rol == 'anfitrion']
        if not anfitriones:
            self.stdout.write(self.style.ERROR('No hay anfitriones. Creando al menos uno...'))
            anfitrion = Usuario.objects.create_user(
                username='anfitrion_test',
                email='anfitrion@test.com',
                password='testpass123',
                first_name='Juan',
                last_name='Pérez',
                documento_identidad='12345678A',
                estado_verificacion='aprobado'
            )
            anfitrion.roles.add(Rol.objects.get(nombre='Anfitrión'))
            anfitriones = [anfitrion]

        self.stdout.write(self.style.NOTICE('Creando experiencias...'))
        experiencias = self.crear_experiencias(n_experiencias, categorias, anfitriones)

        self.stdout.write(self.style.NOTICE('Creando fotos...'))
        self.crear_fotos(experiencias)

        self.stdout.write(self.style.NOTICE('Creando traducciones...'))
        self.crear_traducciones(experiencias)

        self.stdout.write(self.style.NOTICE('Creando disponibilidades...'))
        self.crear_disponibilidades(n_disponibilidades, experiencias)

        self.stdout.write(self.style.SUCCESS(
            f'\n[OK] Base de datos poblada exitosamente:'
            f'\n  - {len(categorias)} categorias'
            f'\n  - {len(usuarios)} usuarios ({len(anfitriones)} anfitriones)'
            f'\n  - {len(experiencias)} experiencias'
            f'\n  - {n_disponibilidades} disponibilidades'
            f'\n  - Fotos y traducciones asociadas'
        ))

    def crear_rbac(self):
        self.stdout.write(self.style.NOTICE('Configurando roles y recursos RBAC...'))
        roles = {name: Rol.objects.get_or_create(nombre=name)[0] for name in ('Administrador', 'Anfitrión', 'Turista')}
        recurso, _ = Recurso.objects.update_or_create(
            nombre='Catálogo',
            defaults={
                'path': '/experiencias',
                'icono': 'map',
                'permisos': [
                    {'path': '/api/catalogo/experiencias/', 'methods': ['get', 'post', 'put', 'patch', 'delete']},
                    {'path': '/api/catalogo/categorias/', 'methods': ['get', 'post', 'put', 'patch', 'delete']},
                    {'path': '/api/catalogo/disponibilidades/', 'methods': ['get', 'post', 'put', 'patch', 'delete']},
                ],
            },
        )
        gestion_usuarios, _ = Recurso.objects.update_or_create(
            nombre='Gestión de Usuarios',
            defaults={'path': '/admin/usuarios', 'icono': 'users', 'permisos': [{'path': '/api/usuarios/admin/', 'methods': ['get', 'post', 'put', 'patch', 'delete']}]},
        )
        gestion_roles, _ = Recurso.objects.update_or_create(
            nombre='Gestión de Roles',
            defaults={'path': '/admin/roles', 'icono': 'shield', 'permisos': [{'path': '/api/usuarios/roles/', 'methods': ['get', 'post', 'put', 'patch', 'delete']}]},
        )
        gestion_recursos, _ = Recurso.objects.update_or_create(
            nombre='Gestión de Recursos',
            defaults={'path': '/admin/recursos', 'icono': 'grid', 'permisos': [{'path': '/api/usuarios/recursos/', 'methods': ['get', 'post', 'put', 'patch', 'delete']}]},
        )
        roles['Administrador'].recursos.add(recurso, gestion_usuarios, gestion_roles, gestion_recursos)
        roles['Anfitrión'].recursos.add(recurso)
        roles['Turista'].recursos.add(recurso)
        # Asigna el rol dinámico equivalente a los usuarios preexistentes y nuevos.
        for user in Usuario.objects.all().iterator():
            role_name = 'Administrador' if user.is_staff or user.rol == 'administrador' else ('Anfitrión' if user.rol == 'anfitrion' else 'Turista')
            user.roles.add(roles[role_name])

    def crear_categorias(self, n):
        nombres_categorias = [
            'Senderismo', 'Ciclismo', 'Observación de aves', 'Kayak', 'Escalada',
            'Rutas a caballo', 'Fotografía de naturaleza', 'Camping', 'Rafting', 'Pesca deportiva',
            'Espeleología', 'Barranquismo', 'Parapente', 'Buceo', 'Surf',
            'Nordic Walking', 'Orientación', 'Geocaching', 'Rutas 4x4', 'Astronomía'
        ]
        categorias = []
        for i in range(min(n, len(nombres_categorias))):
            cat, created = Categoria.objects.get_or_create(nombre=nombres_categorias[i])
            categorias.append(cat)
        return categorias

    def crear_usuarios(self, n):
        usuarios = []
        for i in range(n):
            rol = random.choice(['turista', 'anfitrion'])
            username = fake.unique.user_name()
            email = fake.unique.email()
            first_name = fake.first_name()
            last_name = fake.last_name()

            user = Usuario.objects.create_user(
                username=username,
                email=email,
                password='testpass123',
                first_name=first_name,
                last_name=last_name,
            )
            role_name = 'Anfitrión' if rol == 'anfitrion' else 'Turista'
            user.roles.add(Rol.objects.get(nombre=role_name))

            if rol == 'anfitrion':
                user.documento_identidad = fake.unique.bothify(text='??########')
                user.estado_verificacion = random.choice(['aprobado', 'pendiente', 'aprobado', 'aprobado'])
                user.save()

            usuarios.append(user)
        return usuarios

    def crear_experiencias(self, n, categorias, anfitriones):
        experiencias = []
        titulos_base = [
            'Ruta por el valle', 'Ascensión al pico', 'Paseo en kayak', 'Avistamiento de fauna',
            'Ruta en bicicleta de montaña', 'Caminata nocturna', 'Taller de fotografía',
            'Acampada bajo las estrellas', 'Descenso de barrancos', 'Vuelo en parapente',
            'Inmersión en arrecife', 'Clase de surf', 'Ruta a caballo al atardecer',
            'Exploración de cuevas', 'Pesca en río', 'Senderismo familiar',
            'Ruta geológica', 'Observación astronómica', 'Nordic walking costero',
            'Ruta en 4x4 por la sierra'
        ]

        for i in range(n):
            anfitrion = random.choice(anfitriones)
            categoria = random.choice(categorias)
            titulo = f"{random.choice(titulos_base)} {fake.word().capitalize()} {i+1}"

            exp = Experiencia.objects.create(
                anfitrion=anfitrion,
                categoria=categoria,
                titulo=titulo,
                descripcion=fake.paragraph(nb_sentences=5),
                precio_unitario=Decimal(random.uniform(25, 200)).quantize(Decimal('0.01')),
                latitud=Decimal(random.uniform(-90, 90)).quantize(Decimal('0.000001')),
                longitud=Decimal(random.uniform(-180, 180)).quantize(Decimal('0.000001')),
                estado=random.choice(['Activa', 'Activa', 'Activa', 'Inactiva', 'Borrador']),
            )
            experiencias.append(exp)
        return experiencias

    def crear_fotos(self, experiencias):
        urls_fotos = [
            'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4',
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
            'https://images.unsplash.com/photo-1551632811-561732d1e306',
            'https://images.unsplash.com/photo-1433086966358-54859d0ed716',
            'https://images.unsplash.com/photo-1472214103451-9374bd1c798e',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
            'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d',
            'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
            'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        ]

        for exp in experiencias:
            num_fotos = random.randint(1, 4)
            for j in range(num_fotos):
                FotoExperiencia.objects.create(
                    experiencia=exp,
                    url_foto=random.choice(urls_fotos) + f'?w=800&q=80&sig={random.randint(1,1000)}',
                    es_principal=(j == 0),
                )

    def crear_traducciones(self, experiencias):
        idiomas = ['en', 'fr', 'de', 'it', 'pt']
        for exp in experiencias:
            num_traducciones = random.randint(1, 3)
            for idioma in random.sample(idiomas, num_traducciones):
                ExperienciaTraduccion.objects.create(
                    experiencia=exp,
                    idioma=idioma,
                    titulo_traducido=fake.sentence(nb_words=6).rstrip('.'),
                    descripcion_traducida=fake.paragraph(nb_sentences=3),
                )

    def crear_disponibilidades(self, n, experiencias):
        hoy = date.today()
        for _ in range(n):
            exp = random.choice(experiencias)
            dias_futuros = random.randint(1, 180)
            fecha = hoy + timedelta(days=dias_futuros)

            hora_inicio = time(random.randint(8, 14), 0)
            duracion = random.randint(2, 8)
            hora_fin = time(min(23, hora_inicio.hour + duracion), 0)

            Disponibilidad.objects.create(
                experiencia=exp,
                fecha=fecha,
                hora_inicio=hora_inicio,
                hora_fin=hora_fin,
                cupos_totales=random.randint(5, 30),
            )
