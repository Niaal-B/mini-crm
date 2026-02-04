# Project Architecture

## High-Level Design
The project follows a decoupled architecture where the Backend (Django DRF) acts as a headless API and the Frontend (Vanilla JS) acts as a Single Page Application (SPA).

## Data Model
- **User**: Custom user with roles (`admin`, `manager`).
- **Organization**: Master container for contacts.
- **Contact**: Individual entities linked to organizations.
- **Product**: Goods with `base_price` and `offer_percent`.
- **SizePrice**: One-to-Many relationship with Product for size-specific pricing.
- **Order**: Container for order items with state and generated IDs.
- **OrderItem**: Line items containing snapshot of price and metadata.

## Business Logic
1. **Price Fallback**: System checks `SizePrice` table; if not found, it uses `Product.base_price`.
2. **Offer Calculation**: Discount applied after size selection.
3. **Cart Merge**: Items are merged if `product`, `size`, `extras`, and `customization` are identical.
4. **Order ID**: Generated using `ORD-YYYYMMDD-HEX` format for uniqueness and readability.

## Scalability Considerations
- **PostgreSQL**: Used for transactions and reliable data storage.
- **JWT**: Stateless authentication allows horizontal scaling.
- **JSONField**: Used in `OrderItem` for flexible metadata storage without schema changes.
