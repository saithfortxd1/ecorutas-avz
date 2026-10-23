from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

from rest_framework import permissions

from drf_yasg.views import get_schema_view
from drf_yasg import openapi

from usuarios.views import ThrottledTokenObtainPairView, ThrottledTokenRefreshView

schema_view = get_schema_view(
    openapi.Info(
        title="EcoRutas API",
        default_version='v1',
        description="Documentación de los endpoints del backend de EcoRutas",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # ----------------------- Frontend (RBAC) -----------------------
    path('', TemplateView.as_view(template_name='login.html'), name='frontend-login'),
    path('registro/', TemplateView.as_view(template_name='registro.html'), name='frontend-registro'),
    path('experiencias/', TemplateView.as_view(template_name='experiencias.html'), name='frontend-experiencias'),

    # --------------------------- Backend ---------------------------
    path('admin/', admin.site.urls),

    # Autenticación JWT
    path('api/login/', ThrottledTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/login/refresh/', ThrottledTokenRefreshView.as_view(), name='token_refresh'),

    # Login por sesión para la Browsable API
    path('api-auth/', include('rest_framework.urls')),

    # Módulos
    path('api/usuarios/', include('usuarios.urls')),
    path('api/catalogo/', include('catalogo.urls')),

    # Documentación
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
