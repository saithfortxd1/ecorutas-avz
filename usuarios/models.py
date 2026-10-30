from django.contrib.auth.models import AbstractUser
from django.db import models


class Rol(models.Model):
    id = models.BigAutoField(primary_key=True, db_column='Rol_ID')
    nombre = models.CharField(max_length=80, unique=True, db_column='Rol_nombre')

    class Meta:
        db_table = 'rol'
        ordering = ('nombre',)

    def __str__(self):
        return self.nombre


class Recurso(models.Model):
    id = models.BigAutoField(primary_key=True, db_column='idrecurso')
    nombre = models.CharField(max_length=100, unique=True)
    path = models.CharField(max_length=255, blank=True, db_index=True)
    icono = models.CharField(max_length=80, blank=True)
    # Lista de patrones de endpoint permitidos, por ejemplo ["/api/catalogo/experiencias/"]
    permisos = models.JSONField(default=list, blank=True)
    roles = models.ManyToManyField(Rol, through='RolRecurso', related_name='recursos', blank=True)

    class Meta:
        db_table = 'recurso'
        ordering = ('nombre',)

    def __str__(self):
        return self.nombre


class Usuario(AbstractUser):
    ESTADO_VERIFICACION_CHOICES = [('pendiente', 'Pendiente'), ('aprobado', 'Aprobado'), ('rechazado', 'Rechazado')]

    id = models.BigAutoField(primary_key=True, db_column='Usua_ID')
    first_name = models.CharField(max_length=150, blank=True, db_column='Usua_nombre')
    email = models.EmailField(blank=True, max_length=254, db_column='Usua_email')
    documento_identidad = models.CharField(max_length=50, blank=True, null=True, verbose_name='Documento de Identidad')
    estado_verificacion = models.CharField(max_length=20, choices=ESTADO_VERIFICACION_CHOICES, default='pendiente', blank=True, verbose_name='Estado de Verificación')
    telefono = models.CharField(max_length=30, blank=True, db_column='Usua_telefono')
    direccion = models.CharField(max_length=255, blank=True, db_column='Usua_direccion')
    roles = models.ManyToManyField(Rol, through='UsuarioRol', related_name='usuarios', blank=True)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        db_table = 'usuario'

    def __str__(self):
        return f'{self.username} ({self.email})'

    @property
    def rol(self):
        """Slug compatible con la API, derivado exclusivamente de roles M:N."""
        if not self.pk:
            return None
        # .all() también aprovecha el prefetch cacheado por las vistas de perfil.
        nombres = {rol.nombre for rol in self.roles.all()}
        if 'Administrador' in nombres:
            return 'administrador'
        if 'Anfitrión' in nombres:
            return 'anfitrion'
        if 'Turista' in nombres:
            return 'turista'
        return None

    def get_rol_display(self):
        return {'administrador': 'Administrador', 'anfitrion': 'Anfitrión', 'turista': 'Turista'}.get(self.rol, 'Sin rol')


class UsuarioRol(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, db_column='Usua_ID')
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='Rol_ID')

    class Meta:
        db_table = 'usuario_has_rol'
        constraints = [models.UniqueConstraint(fields=('usuario', 'rol'), name='uq_usuario_rol')]


class RolRecurso(models.Model):
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='Rol_ID')
    recurso = models.ForeignKey(Recurso, on_delete=models.CASCADE, db_column='idrecurso')

    class Meta:
        db_table = 'rol_has_recurso'
        constraints = [models.UniqueConstraint(fields=('rol', 'recurso'), name='uq_rol_recurso')]
