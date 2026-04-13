# Website Customer Authentication API Documentation

## 🎯 Overview

These APIs allow your website customers to signup, login, and authenticate. When customers register or login, their data is saved in the `website_customers` table and visible in your inventory dashboard at `/website-customers`.

**Base URL**: `https://54.254.184.54:8443`

---

## 🔑 API Endpoints

### 1. Customer Signup

**Endpoint**: `POST /api/website-auth/signup`

**Description**: Register a new website customer

**Authentication**: ❌ Not required

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Required Fields**:
- `email` (string) - Customer email address
- `password` (string) - Customer password (min 6 characters recommended)

**Optional Fields**:
- `name` (string) - Customer full name
- `phone` (string) - Customer phone number

**Success Response** (201):
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

**Error Responses**:
- `400` - Email already registered
- `400` - Email and password are required
- `500` - Server error

---

### 2. Customer Login

**Endpoint**: `POST /api/website-auth/login`

**Description**: Login existing website customer

**Authentication**: ❌ Not required

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Required Fields**:
- `email` (string) - Customer email address
- `password` (string) - Customer password

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

**Error Responses**:
- `401` - Invalid email or password
- `403` - Account is suspended
- `400` - Email and password are required
- `500` - Server error

---

### 3. Google OAuth Login/Signup

**Endpoint**: `POST /api/website-auth/google`

**Description**: Login or signup using Google OAuth

**Authentication**: ❌ Not required

**Request Body**:
```json
{
  "google_id": "123456789",
  "email": "john@example.com",
  "name": "John Doe"
}
```

**Required Fields**:
- `google_id` (string) - Google user ID
- `email` (string) - Google account email

**Optional Fields**:
- `name` (string) - User's name from Google

**Success Response** (200 or 201):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": null
  }
}
```

**Error Responses**:
- `403` - Account is suspended
- `400` - Google ID and email are required
- `500` - Server error

---

### 4. Get Customer Profile

**Endpoint**: `GET /api/website-auth/profile`

**Description**: Get current customer profile information

**Authentication**: ✅ Required (Customer JWT token)

**Headers**:
```
Authorization: Bearer <customer_jwt_token>
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "google_id": null,
    "is_active": true,
    "created_at": "2026-02-10T10:30:00.000Z",
    "last_login": "2026-02-10T15:45:00.000Z"
  }
}
```

**Error Responses**:
- `401` - Unauthorized (invalid or missing token)
- `404` - Customer not found
- `500` - Server error

---

## 💻 Integration Examples

### JavaScript/Fetch Example

```javascript
// Signup
async function signup(name, email, password, phone) {
  const response = await fetch('https://54.254.184.54:8443/api/website-auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, password, phone })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Save token to localStorage
    localStorage.setItem('customerToken', data.token);
    console.log('Signup successful:', data.customer);
  }
  
  return data;
}

// Login
async function login(email, password) {
  const response = await fetch('https://54.254.184.54:8443/api/website-auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Save token to localStorage
    localStorage.setItem('customerToken', data.token);
    console.log('Login successful:', data.customer);
  }
  
  return data;
}

// Get Profile
async function getProfile() {
  const token = localStorage.getItem('customerToken');
  
  const response = await fetch('https://54.254.184.54:8443/api/website-auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data;
}
```

### React Example

```jsx
import { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('https://54.254.184.54:8443/api/website-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('customerToken', data.token);
        // Redirect to dashboard or home
        window.location.href = '/dashboard';
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

### cURL Examples

```bash
# Signup
curl -X POST https://54.254.184.54:8443/api/website-auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+1234567890"
  }'

# Login
curl -X POST https://54.254.184.54:8443/api/website-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get Profile
curl https://54.254.184.54:8443/api/website-auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔒 Security Notes

1. **Password Storage**: Passwords are hashed using bcrypt before storage
2. **JWT Tokens**: Tokens expire after 30 days
3. **HTTPS Only**: Always use HTTPS in production
4. **Token Storage**: Store tokens securely (localStorage or httpOnly cookies)
5. **Account Suspension**: Suspended accounts cannot login (is_active = false)

---

## 📊 Data Flow

1. **Customer signs up on your website** → API creates record in `website_customers` table
2. **Customer receives JWT token** → Store in localStorage/cookies
3. **Customer data appears in inventory dashboard** → View at `/website-customers`
4. **Admin can manage customers** → Suspend/activate accounts, view activity

---

## 🧪 Testing

### Test Signup
```bash
curl -X POST https://54.254.184.54:8443/api/website-auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "phone": "+1234567890"
  }'
```

### Test Login
```bash
curl -X POST https://54.254.184.54:8443/api/website-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

---

## 📝 Database Schema

Customers are stored in the `website_customers` table:

```sql
CREATE TABLE website_customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);
```

---

## 🚀 Quick Start

1. **Add signup form to your website**
2. **Call `/api/website-auth/signup` on form submit**
3. **Store the returned JWT token**
4. **Use token for authenticated requests**
5. **View customers in inventory dashboard at `/website-customers`**

---

## 📞 Support

For issues or questions:
- Check PM2 logs: `pm2 logs dashboard-api-1`
- View customers in dashboard: https://inventoryfullstack-one.vercel.app/website-customers
- API documentation: https://inventoryfullstack-one.vercel.app/api

---

**Last Updated**: February 10, 2026
