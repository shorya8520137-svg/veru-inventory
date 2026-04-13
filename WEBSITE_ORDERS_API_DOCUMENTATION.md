# Order API Documentation

## Overview
This document provides comprehensive documentation for the Order Management API used in the Gift Gala e-commerce backend system.

## Base URL
```
https://54.169.31.95:8443/api/website
```

## Authentication
All order-related endpoints require user authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Order Data Structure

### Order Object
```javascript
{
id: "string",                    // Unique order identifier
userId: "string",                // User who placed the order
orderNumber: "string",           // Human-readable order number (e.g., "ORD-2026-001")
status: "string",                // Order status (pending, confirmed, processing, shipped, delivered, cancelled)
totalAmount: number,             // Total order amount
currency: "string",              // Currency code (e.g., "USD", "INR")
paymentStatus: "string",         // Payment status (pending, paid, failed, refunded)
paymentMethod: "string",         // Payment method used
shippingAddress: {
name: "string",
phone: "string",
email: "string",
addressLine1: "string",
addressLine2: "string",
city: "string",
state: "string",
postalCode: "string",
country: "string"
},
billingAddress: {
name: "string",
phone: "string",
email: "string",
addressLine1: "string",
addressLine2: "string",
city: "string",
state: "string",
postalCode: "string",
country: "string"
},
items: [{
productId: "string",
productName: "string",
productImage: "string",
quantity: number,
unitPrice: number,
totalPrice: number,
customization: {
text: "string",
color: "string",
size: "string"
}
}],
orderDate: "ISO 8601 date string",
estimatedDelivery: "ISO 8601 date string",
actualDelivery: "ISO 8601 date string",
trackingNumber: "string",
notes: "string",
createdAt: "ISO 8601 date string",
updatedAt: "ISO 8601 date string"
}
```

---

## API Endpoints

### 1. Create Order
**POST** `/orders`

Creates a new order from cart items.

#### Request Body
```javascript
{
cartItems: [{
productId: "string",
quantity: number,
customization: {
text: "string",
color: "string",
size: "string"
}
}],
shippingAddress: {
name: "string",
phone: "string",
email: "string",
addressLine1: "string",
addressLine2: "string",
city: "string",
state: "string",
postalCode: "string",
country: "string"
},
billingAddress: {
// Same structure as shippingAddress
},
paymentMethod: "string",
notes: "string"
}
```

#### Response
```javascript
{
success: true,
data: {
orderId: "string",
orderNumber: "string",
totalAmount: number,
status: "pending",
estimatedDelivery: "ISO 8601 date string"
}
}
```

### 2. Get User Orders
**GET** `/orders`

Retrieves all orders for the authenticated user.

#### Query Parameters
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of orders per page (default: 10)
- `status` (optional): Filter by order status
- `sortBy` (optional): Sort field (orderDate, totalAmount, status)
- `sortOrder` (optional): Sort order (asc, desc)

#### Response
```javascript
{
success: true,
data: {
orders: [Order],
pagination: {
currentPage: number,
totalPages: number,
totalOrders: number,
hasNext: boolean,
hasPrev: boolean
}
}
}
```

### 3. Get Order Details
**GET** `/orders/{orderId}`

Retrieves detailed information for a specific order.

#### Response
```javascript
{
success: true,
data: Order
}
```

### 4. Update Order Status
**PUT** `/orders/{orderId}/status`

Updates the status of an order (Admin only).

#### Request Body
```javascript
{
status: "string",           // New status
trackingNumber: "string",   // Optional tracking number
notes: "string"            // Optional status update notes
}
```

#### Response
```javascript
{
success: true,
data: {
orderId: "string",
status: "string",
updatedAt: "ISO 8601 date string"
}
}
```

### 5. Cancel Order
**PUT** `/orders/{orderId}/cancel`

Cancels an order (only if status is pending or confirmed).

#### Request Body
```javascript
{
reason: "string"  // Cancellation reason
}
```

#### Response
```javascript
{
success: true,
data: {
orderId: "string",
status: "cancelled",
refundStatus: "string",
cancelledAt: "ISO 8601 date string"
}
}
```

### 6. Track Order
**GET** `/orders/{orderId}/tracking`

Gets tracking information for an order.

#### Response
```javascript
{
success: true,
data: {
orderId: "string",
orderNumber: "string",
status: "string",
trackingNumber: "string",
trackingUrl: "string",
estimatedDelivery: "ISO 8601 date string",
trackingHistory: [{
status: "string",
description: "string",
location: "string",
timestamp: "ISO 8601 date string"
}]
}
}
```

---

## Order Status Flow
```
pending → confirmed → processing → shipped → delivered
↓
cancelled (only from pending/confirmed)
```

### Status Descriptions
- **pending**: Order placed, awaiting confirmation
- **confirmed**: Order confirmed, payment verified
- **processing**: Order being prepared/manufactured
- **shipped**: Order dispatched, tracking available
- **delivered**: Order successfully delivered
- **cancelled**: Order cancelled by user or admin

---

## Payment Integration

### Payment Status Flow
```
pending → paid → completed
↓
failed → retry_pending → paid
↓
refunded (from paid status)
```

### Supported Payment Methods
- Credit/Debit Cards
- Digital Wallets (PayPal, Google Pay, Apple Pay)
- Bank Transfer
- Cash on Delivery (COD)

---

## Error Handling

### Common Error Responses
```javascript
{
success: false,
error: {
code: "string",
message: "string",
details: "string"
}
}
```

### Error Codes
- `ORDER_NOT_FOUND`: Order with given ID not found
- `INVALID_ORDER_STATUS`: Invalid status transition
- `PAYMENT_FAILED`: Payment processing failed
- `INSUFFICIENT_STOCK`: Product out of stock
- `INVALID_ADDRESS`: Shipping address validation failed
- `UNAUTHORIZED`: User not authorized for this order
- `ORDER_CANNOT_BE_CANCELLED`: Order status doesn't allow cancellation

---

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
id VARCHAR(255) PRIMARY KEY,
user_id VARCHAR(255) NOT NULL,
order_number VARCHAR(50) UNIQUE NOT NULL,
status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
total_amount DECIMAL(10,2) NOT NULL,
currency VARCHAR(3) DEFAULT 'USD',
payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
payment_method VARCHAR(50),
shipping_address JSON NOT NULL,
billing_address JSON NOT NULL,
order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
estimated_delivery DATE,
actual_delivery DATE,
tracking_number VARCHAR(100),
notes TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
INDEX idx_user_id (user_id),
INDEX idx_status (status),
INDEX idx_order_date (order_date)
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
id VARCHAR(255) PRIMARY KEY,
order_id VARCHAR(255) NOT NULL,
product_id VARCHAR(255) NOT NULL,
product_name VARCHAR(255) NOT NULL,
product_image VARCHAR(500),
quantity INT NOT NULL,
unit_price DECIMAL(10,2) NOT NULL,
total_price DECIMAL(10,2) NOT NULL,
customization JSON,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
INDEX idx_order_id (order_id),
INDEX idx_product_id (product_id)
);
```

---

## Usage Examples

### Frontend Integration

#### Creating an Order
```javascript
const createOrder = async (orderData) => {
try {
const response = await fetch(`${API_BASE_URL}/orders`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`
},
body: JSON.stringify(orderData)
});

const result = await response.json();
if (result.success) {
// Redirect to order success page
router.push(`/order-success?orderId=${result.data.orderId}`);
}
} catch (error) {
console.error('Order creation failed:', error);
}
};
```

#### Fetching User Orders
```javascript
const fetchUserOrders = async (page = 1, status = '') => {
try {
const params = new URLSearchParams({
page: page.toString(),
limit: '10',
...(status && { status })
});

const response = await fetch(`${API_BASE_URL}/orders?${params}`, {
headers: {
'Authorization': `Bearer ${token}`
}
});

const result = await response.json();
return result.data;
} catch (error) {
console.error('Failed to fetch orders:', error);
}
};
```

---

## Security Considerations
1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Users can only access their own orders
3. **Input Validation**: All input data is validated and sanitized
4. **Rate Limiting**: API calls are rate-limited to prevent abuse
5. **Data Encryption**: Sensitive data is encrypted in transit and at rest
6. **Audit Logging**: All order operations are logged for security auditing

---

## Performance Optimization
1. **Database Indexing**: Proper indexes on frequently queried fields
2. **Caching**: Order data cached for faster retrieval
3. **Pagination**: Large order lists are paginated
4. **Lazy Loading**: Order details loaded on demand
5. **Connection Pooling**: Database connections are pooled for efficiency

---

## Testing

### Test Cases
1. Order creation with valid data
2. Order creation with invalid data
3. Fetching orders with pagination
4. Order status updates
5. Order cancellation scenarios
6. Payment integration testing
7. Error handling validation

### Sample Test Data
```javascript
const sampleOrder = {
cartItems: [{
productId: "prod_123",
quantity: 2,
customization: {
text: "Happy Birthday",
color: "blue",
size: "medium"
}
}],
shippingAddress: {
name: "John Doe",
phone: "+1234567890",
email: "john@example.com",
addressLine1: "123 Main St",
city: "New York",
state: "NY",
postalCode: "10001",
country: "USA"
},
paymentMethod: "credit_card",
notes: "Please handle with care"
};
```

This documentation provides a complete reference for implementing and using the Order API in the Gift Gala e-commerce system.