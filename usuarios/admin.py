from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role_names', 'estado_verificacion', 'is_staff')
    list_filter = ('estado_verificacion', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Información Adicional', {'fields': ('documento_identidad', 'estado_verificacion')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Adicional', {'fields': ('documento_identidad', 'estado_verificacion')}),
    )
    search_fields = ('username', 'email', 'first_name', 'last_name', 'documento_identidad')
    ordering = ('username',)

    @admin.display(description='Roles')
    def role_names(self, obj):
        return ', '.join(obj.roles.values_list('nombre', flat=True)) or 'Sin rol'
