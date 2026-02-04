import datetime
import uuid
from decimal import Decimal
from .models import SizePrice, Order

def calculate_item_price(product, size_name):
    """
    Price calculation logic:
    - If SizePrice exists for the chosen size_name, use size_price.price.
    - If no SizePrice found, fall back to product.base_price.
    """
    try:
        size_price_obj = SizePrice.objects.get(product=product, size_name=size_name)
        return size_price_obj.price
    except SizePrice.DoesNotExist:
        return product.base_price

def apply_offer(unit_price, offer_percent):
    """
    Apply offer_percent after selecting the correct price:
    price_after_offer = unit_price * (1 - offer_percent/100) - only when offer_percent > 0.
    """
    if offer_percent > 0:
        discount = Decimal(offer_percent) / Decimal(100)
        return unit_price * (Decimal(1) - discount)
    return unit_price

def generate_order_number():
    """
    Provide readable order_no e.g. ORD-20250612-0001 or UUID - consistent and unique.
    Using format: ORD-YYYYMMDD-UUID_SHORT
    """
    date_str = datetime.datetime.now().strftime('%Y%m%d')
    unique_suffix = str(uuid.uuid4())[:8].upper()
    return f"ORD-{date_str}-{unique_suffix}"

def get_normalized_items(items):
    """
    Normalizes items for cart merge rules:
    Two items should be merged into a single line only if all of the following are identical:
    - product id
    - size_name
    - extras (normalized/sorted if array)
    - customization (exact string)
    """
    merged_items = []
    
    for item in items:
        # Normalize extras (assuming it's a list or dict)
        extras = item.get('extras', {})
        if isinstance(extras, dict):
            # Sort dict by keys to ensure consistency
            normalized_extras = dict(sorted(extras.items()))
        elif isinstance(extras, list):
            # Sort list if it contains sortable items
            try:
                normalized_extras = sorted(extras)
            except TypeError:
                normalized_extras = extras
        else:
            normalized_extras = extras

        item['normalized_extras'] = normalized_extras
        
        found = False
        for m_item in merged_items:
            if (m_item['product_id'] == item['product_id'] and
                m_item['size_name'] == item['size_name'] and
                m_item['normalized_extras'] == item['normalized_extras'] and
                m_item.get('customization', '') == item.get('customization', '')):
                
                m_item['qty'] += item.get('qty', 1)
                found = True
                break
        
        if not found:
            merged_items.append(item)
            
    return merged_items
