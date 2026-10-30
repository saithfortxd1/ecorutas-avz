from rest_framework import serializers
from .models import Recurso, Rol, Usuario, UsuarioRol


class UsuarioRegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    rol = serializers.ChoiceField(choices=[('turista', 'Turista'), ('anfitrion', 'Anfitrión')], write_only=True, default='turista')

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'rol', 'documento_identidad']
        extra_kwargs = {'email': {'required': True}, 'first_name': {'required': True}, 'last_name': {'required': True}}

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Las contraseñas no coinciden.'})
        if attrs.get('rol', 'turista') == 'anfitrion' and not attrs.get('documento_identidad'):
            raise serializers.ValidationError({'documento_identidad': 'El documento es obligatorio para anfitriones.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        rol_slug = validated_data.pop('rol', 'turista')
        user = Usuario.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        role_name = {'turista': 'Turista', 'anfitrion': 'Anfitrión'}[rol_slug]
        role, _ = Rol.objects.get_or_create(nombre=role_name)
        user.roles.add(role)
        return user


class UsuarioMeSerializer(serializers.ModelSerializer):
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    roles = serializers.StringRelatedField(many=True, read_only=True)
    perfil_anfitrion = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol', 'rol_display', 'roles', 'is_staff', 'is_superuser', 'documento_identidad', 'estado_verificacion', 'perfil_anfitrion', 'date_joined']
        read_only_fields = fields

    def get_perfil_anfitrion(self, obj):
        if obj.rol != 'anfitrion':
            return None
        return {'documento_identidad': obj.documento_identidad, 'estado_verificacion': obj.estado_verificacion, 'estado_verificacion_display': obj.get_estado_verificacion_display()}


class RecursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recurso
        fields = ['id', 'nombre', 'path', 'icono', 'permisos']

    def validate_path(self, value):
        if value and (not value.startswith('/') or value.startswith('//') or '://' in value):
            raise serializers.ValidationError('La ruta del menú debe ser una ruta interna de la aplicación.')
        return value

    def validate_permisos(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Los permisos deben ser una lista de rutas y métodos.')
        allowed_methods = {'get', 'post', 'put', 'patch', 'delete'}
        normalized = []
        for index, rule in enumerate(value):
            if isinstance(rule, str):
                rule = {'path': rule}
            if not isinstance(rule, dict):
                raise serializers.ValidationError({index: 'Cada permiso debe ser una ruta o un objeto.'})
            path = rule.get('path')
            methods = rule.get('methods', ['get', 'post', 'put', 'patch', 'delete'])
            if not isinstance(path, str) or not path.startswith('/api/') or path.startswith('//') or '://' in path:
                raise serializers.ValidationError({index: 'La ruta debe ser una ruta interna que empiece por /api/.'})
            if not isinstance(methods, list) or not methods or any(not isinstance(method, str) or method.lower() not in allowed_methods for method in methods):
                raise serializers.ValidationError({index: 'Los métodos permitidos son GET, POST, PUT, PATCH y DELETE.'})
            normalized.append({'path': path.rstrip('/') + '/', 'methods': sorted({method.lower() for method in methods})})
        return normalized


class RolSerializer(serializers.ModelSerializer):
    recursos = serializers.PrimaryKeyRelatedField(many=True, queryset=Recurso.objects.all(), required=False)

    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'recursos']

    def create(self, validated_data):
        recursos = validated_data.pop('recursos', [])
        rol = super().create(validated_data)
        rol.recursos.set(recursos)
        return rol

    def update(self, instance, validated_data):
        recursos = validated_data.pop('recursos', None)
        rol = super().update(instance, validated_data)
        if recursos is not None:
            rol.recursos.set(recursos)
        return rol


class UsuarioAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    roles = serializers.PrimaryKeyRelatedField(many=True, queryset=Rol.objects.all(), required=False)

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'telefono', 'direccion', 'documento_identidad', 'estado_verificacion', 'is_active', 'password', 'roles']

    def create(self, validated_data):
        roles = validated_data.pop('roles', [])
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'La contraseña es obligatoria al crear un usuario.'})
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        user.roles.set(roles)
        return user

    def update(self, instance, validated_data):
        roles = validated_data.pop('roles', None)
        password = validated_data.pop('password', None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        if roles is not None:
            instance.roles.set(roles)
        return instance
