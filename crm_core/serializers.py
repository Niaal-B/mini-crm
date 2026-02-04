from rest_framework import serializers
from .models import Organization, Contact, Product, SizePrice, Order, OrderItem, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role')

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

class ContactSerializer(serializers.ModelSerializer):
    organization_name = serializers.ReadOnlyField(source='organization.name')

    class Meta:
        model = Contact
        fields = '__all__'

class SizePriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SizePrice
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    sizes = SizePriceSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = OrderItem
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    contact_name = serializers.ReadOnlyField(source='contact.first_name') # simplified

    class Meta:
        model = Order
        fields = '__all__'
