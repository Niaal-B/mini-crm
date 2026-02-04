from rest_framework import generics, status, permissions, views
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Organization, Contact, Product, SizePrice, Order, OrderItem
from .serializers import (
    OrganizationSerializer, ContactSerializer, ProductSerializer, 
    SizePriceSerializer, OrderSerializer, UserSerializer
)
from .logic import calculate_item_price, apply_offer, generate_order_number, get_normalized_items
from django.db import transaction

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth import authenticate
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class OrganizationListCreateView(generics.ListCreateAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer

class OrganizationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer

class ContactListCreateView(generics.ListCreateAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer

class ContactRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer

class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class SizePriceCreateView(generics.CreateAPIView):
    serializer_class = SizePriceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        product_pk = self.kwargs.get('pk')
        product = generics.get_object_or_404(Product, pk=product_pk)
        serializer.save(product=product)

class OrderListCreateView(generics.ListCreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        contact_id = data.get('contact')
        items_data = data.get('items', [])

        if not contact_id or not items_data:
            return Response({'error': 'Contact and items are required'}, status=status.HTTP_400_BAD_REQUEST)

        normalized_items = get_normalized_items(items_data)

        try:
            with transaction.atomic():
                order = Order.objects.create(
                    order_no=generate_order_number(),
                    contact_id=contact_id
                )
                
                order_total = 0
                created_items = []

                for item in normalized_items:
                    product = Product.objects.get(id=item['product_id'])
                    size_name = item['size_name']
                    qty = item.get('qty', 1)
                    
                    unit_price = calculate_item_price(product, size_name)
                    unit_price_after_offer = apply_offer(unit_price, product.offer_percent)
                    line_total = qty * unit_price_after_offer
                    
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        size_name=size_name,
                        qty=qty,
                        unit_price=unit_price_after_offer,
                        line_total=line_total,
                        extras=item.get('extras', {}),
                        customization=item.get('customization', '')
                    )
                    
                    order_total += line_total
                    created_items.append({
                        'product_name': product.name,
                        'unit_price': float(unit_price_after_offer),
                        'qty': qty,
                        'line_total': float(line_total)
                    })

                return Response({
                    'id': order.id,
                    'order_no': order.order_no,
                    'items': created_items,
                    'order_total': float(order_total)
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class OrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class AdminStatsView(views.APIView):
    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        stats = {
            'total_organizations': Organization.objects.count(),
            'total_contacts': Contact.objects.count(),
            'total_products': Product.objects.count(),
            'total_orders': Order.objects.count(),
        }
        return Response(stats)

class HealthCheckView(views.APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        return Response({"status": "ok", "app": "mini_crm", "version": "0.1"})
