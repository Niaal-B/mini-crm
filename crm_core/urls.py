from django.urls import path
from .views import (
    OrganizationListCreateView, OrganizationRetrieveUpdateDestroyView,
    ContactListCreateView, ContactRetrieveUpdateDestroyView,
    ProductListCreateView, ProductRetrieveUpdateDestroyView,
    SizePriceCreateView, OrderListCreateView, OrderDetailView,
    LoginView, AdminStatsView, index_page
)

urlpatterns = [
    path('', index_page, name='index'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    
    path('organizations/', OrganizationListCreateView.as_view(), name='org-list'),
    path('organizations/<int:pk>/', OrganizationRetrieveUpdateDestroyView.as_view(), name='org-detail'),
    
    path('contacts/', ContactListCreateView.as_view(), name='contact-list'),
    path('contacts/<int:pk>/', ContactRetrieveUpdateDestroyView.as_view(), name='contact-detail'),
    
    path('products/', ProductListCreateView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductRetrieveUpdateDestroyView.as_view(), name='product-detail'),
    path('products/<int:pk>/sizes/', SizePriceCreateView.as_view(), name='product-sizes'),
    
    path('orders/', OrderListCreateView.as_view(), name='order-list'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]
