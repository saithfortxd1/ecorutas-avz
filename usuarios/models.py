from django.db import models
from django.contrib.auth.models import AbstractUser


class Usuario(AbstractUser):
    ROL_CHOICES = [
        ('turista', 'Turista'),
        ('anfitrion', 'Anfitrión'),
    ]
    
    ESTADO_VERIFICACION_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    ]

    rol = models.CharField(
        max_length=20,
        choices=ROL_CHOICES,
        default='turista',
        verbose_name='Rol'
    )
    
    documento_identidad = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Documento de Identidad'
    )
    
    estado_verificacion = models.CharField(
        max_length=20,
        choices=ESTADO_VERIFICACION_CHOICES,
        default='pendiente',
        blank=True,
        verbose_name='Estado de Verificación'
    )

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"

    def save(self, *args, **kwargs):
        if self.rol != 'anfitrion':
            self.documento_identidad = None
            self.estado_verificacion = 'pendiente'
        super().save(*args, **kwargs)