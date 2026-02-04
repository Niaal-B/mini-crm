from rest_framework import viewsets, status, permissions, views
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import authenticate, login
from .models import Organization, Contact, Product, SizePrice, Order, OrderItem, User
from .serializers import (
    OrganizationSerializer, ContactSerializer, ProductSerializer, 
    SizePriceSerializer, OrderSerializer, UserSerializer
)
from .logic import calculate_item_price, apply_offer, generate_order_number, get_normalized_items
from django.db import transaction

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            return Response(UserSerializer(user).data)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def sizes(self, request, pk=None):
        product = self.get_object()
        serializer = SizePriceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        # Expecting data: { "contact": id, "items": [{ "product_id": id, "size_name": "", "qty": 1, "extras": {}, "customization": "" }] }
        data = request.data
        contact_id = data.get('contact')
        items_data = data.get('items', [])

        if not contact_id or not items_data:
            return Response({'error': 'Contact and items are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Apply cart merge rules
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
                    
                    order_item = OrderItem.objects.create(
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
                    'order_no': order.order_no,
                    'items': created_items,
                    'order_total': float(order_total)
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AdminStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

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
        return Response({
            "status": "ok",
            "app": "mini_crm",
            "version": "0.1"
        })
