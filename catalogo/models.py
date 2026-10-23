from django.db import models
from django.conf import settings

class Categoria(models.Model):
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre

class Experiencia(models.Model):
    anfitrion = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    latitud = models.DecimalField(max_digits=9, decimal_places=6)
    longitud = models.DecimalField(max_digits=9, decimal_places=6)
    estado = models.CharField(max_length=20, default='Activa')
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.titulo

class ExperienciaTraduccion(models.Model):
    experiencia = models.ForeignKey(Experiencia, related_name='traducciones', on_delete=models.CASCADE)
    idioma = models.CharField(max_length=5)
    titulo_traducido = models.CharField(max_length=200)
    descripcion_traducida = models.TextField()

    def __str__(self):
        return f"{self.experiencia.titulo} ({self.idioma})"

class FotoExperiencia(models.Model):
    experiencia = models.ForeignKey(Experiencia, related_name='fotos', on_delete=models.CASCADE)
    url_foto = models.URLField(max_length=500)
    es_principal = models.BooleanField(default=False)

class Disponibilidad(models.Model):
    experiencia = models.ForeignKey(Experiencia, related_name='disponibilidades', on_delete=models.CASCADE)
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    cupos_totales = models.IntegerField()

    def __str__(self):
        return f"Disponibilidad {self.experiencia.titulo} - {self.fecha}"