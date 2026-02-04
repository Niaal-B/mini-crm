from django.test import TestCase
from .models import Organization, Contact, Product, SizePrice, Order, OrderItem
from .logic import generate_order_number, calculate_item_price, apply_offer, get_normalized_items
from decimal import Decimal

class ModelLogicTest(TestCase):
    def test_order_number_generation(self):
        order_no = generate_order_number()
        self.assertTrue(order_no.startswith('ORD-'))
        self.assertEqual(len(order_no), 22) # ORD-YYYYMMDD-XXXXXXXX

    def test_price_calculation_fallback(self):
        product = Product.objects.create(name="Test Prod", sku="TP1", base_price=Decimal('100.00'))
        SizePrice.objects.create(product=product, size_name="M", price=Decimal('120.00'))
        
        # Should use SizePrice
        price_m = calculate_item_price(product, "M")
        self.assertEqual(price_m, Decimal('120.00'))
        
        # Should fall back to base_price
        price_l = calculate_item_price(product, "L")
        self.assertEqual(price_l, Decimal('100.00'))

    def test_apply_offer(self):
        price = Decimal('100.00')
        # 10% offer
        final_price = apply_offer(price, Decimal('10.00'))
        self.assertEqual(final_price, Decimal('90.00'))
        
        # 0% offer
        no_offer_price = apply_offer(price, Decimal('0.00'))
        self.assertEqual(no_offer_price, Decimal('100.00'))

class CartMergeTest(TestCase):
    def test_cart_normalization_and_merge(self):
        items = [
            {'product_id': 1, 'size_name': 'M', 'qty': 1, 'customization': 'None'},
            {'product_id': 1, 'size_name': 'M', 'qty': 2, 'customization': 'None'}, # Should merge
            {'product_id': 1, 'size_name': 'L', 'qty': 1, 'customization': 'None'}, # Different size
            {'product_id': 2, 'size_name': 'M', 'qty': 1, 'customization': 'None'}, # Different product
        ]
        merged = get_normalized_items(items)
        self.assertEqual(len(merged), 3)
        self.assertEqual(merged[0]['qty'], 3)
        self.assertEqual(merged[0]['product_id'], 1)

class ApiTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Org 1")
        self.contact = Contact.objects.create(first_name="John", last_name="Doe", email="j@example.com", organization=self.org)
        self.product = Product.objects.create(name="Prod 1", sku="P1", base_price=Decimal('50.00'))

    def test_order_creation_flow(self):
        from rest_framework.test import APIClient
        client = APIClient()
        # Mock login/token if needed, but here testing the logic via views if needed or just unit test the view method
        # Actually testing the view logic directly to avoid complexity of JWT setup in unit tests
        from .views import OrderListCreateView
        from rest_framework.request import Request
        from django.test import RequestFactory
        
        factory = RequestFactory()
        data = {
            "contact": self.contact.id,
            "items": [
                {"product_id": self.product.id, "size_name": "M", "qty": 2}
            ]
        }
        request = factory.post('/api/orders/', data, content_type='application/json')
        view = OrderListCreateView.as_view()
        # Note: In real test, would need to force auth
