from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrganizationViewSet, ContactViewSet, ProductViewSet, 
    OrderViewSet, LoginView, AdminStatsView, HealthCheckView
)

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet)
router.register(r'contacts', ContactViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('', include(router.urls)),
]
