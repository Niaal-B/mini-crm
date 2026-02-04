from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='manager')

class Organization(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)
    gst_no = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.name

class Contact(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='contacts')

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Product(models.Model):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    offer_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    def __str__(self):
        return self.name

class SizePrice(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sizes')
    size_name = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} - {self.size_name}"

class Order(models.Model):
    order_no = models.CharField(max_length=50, unique=True)
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='orders')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.order_no

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    size_name = models.CharField(max_length=50)
    qty = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)
    extras = models.JSONField(default=dict, blank=True)
    customization = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.order.order_no} - {self.product.name}"
