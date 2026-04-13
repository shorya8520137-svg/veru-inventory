# 🔐 Google OAuth API Endpoints

## Base URL
```
https://api.giftgala.in
```

---

## 📍 Public Endpoints (No Authentication Required)

### 1. Start Google Login
**Endpoint:** `GET /auth/google`

**Description:** Initiates Google OAuth flow. Redirects user to Google login page.

**Usage:**
```html
<!-- HTML Button -->
<a href="https://api.giftgala.in/auth/google">Login with Google</a>

<!-- JavaScript -->
window.location.href = 'https://api.giftgala.in/auth/google';
```

**Response:** Redirects to Google login page

---

### 2. Google OAuth Callback
**Endpoint:** `GET /auth/google/callback`

**Description:** Google redirects here after authentication. Automatically handled by backend.

**Success Redirect:**
```
https://giftgala.in/dashboard?token=JWT_TOKEN_HERE
```

**Error Redirect:**
```
https://giftgala.in/login?error=auth_failed
```

**You don't call this directly** - Google calls it automatically.

---

### 3. Check OAuth Status
**Endpoint:** `GET /auth/google/status`

**Description:** Check if Google OAuth is properly configured.

**Request:**
```bash
curl https://api.giftgala.in/auth/google/status
```

**Response:**
```json
{
  "success": true,
  "message": "Google OAuth is configured",
  "clientId": "Set",
  "clientSecret": "Set",
  "callbackURL": "https://api.giftgala.in/auth/google/callback"
}
```

---

## 🔒 Protected Endpoints (JWT Required)

### 4. Get User Profile
**Endpoint:** `GET /api/profile`

**Description:** Get authenticated user's profile information.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://api.giftgala.in/api/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "google_id": "1234567890",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_login": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 5. Protected Route Example
**Endpoint:** `GET /api/protected`

**Description:** Example protected route to test JWT authentication.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://api.giftgala.in/api/protected
```

**Response:**
```json
{
  "success": true,
  "message": "You have access to this protected route!",
  "user": {
    "id": 123,
    "email": "john@example.com",
    "role": "customer"
  }
}
```

---

## 🎯 Frontend Integration Examples

### React Component
```jsx
import React from 'react';

const GoogleLoginButton = () => {
    const handleGoogleLogin = () => {
        // Redirect to Google OAuth
        window.location.href = 'https://api.giftgala.in/auth/google';
    };

    return (
        <button onClick={handleGoogleLogin} className="google-login-btn">
            <img src="/google-icon.svg" alt="Google" />
            Login with Google
        </button>
    );
};

export default GoogleLoginButton;
```

### Extract Token on Dashboard
```javascript
// pages/dashboard.js or useEffect in Dashboard component

useEffect(() => {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        // Store token in localStorage
        localStorage.setItem('authToken', token);
        
        // Clean URL (remove token from address bar)
        window.history.replaceState({}, document.title, '/dashboard');
        
        // Fetch user profile
        fetchUserProfile(token);
    }
}, []);

const fetchUserProfile = async (token) => {
    try {
        const response = await fetch('https://api.giftgala.in/api/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('User profile:', data.data);
            // Update your state with user data
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
};
```

### Make Authenticated API Calls
```javascript
// Helper function for authenticated requests
const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`https://api.giftgala.in${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
    
    return response.json();
};

// Usage
const getUserProfile = () => apiCall('/api/profile');
const getProtectedData = () => apiCall('/api/protected');
```

---

## 🔑 JWT Token Details

**Payload:**
```json
{
  "userId": 123,
  "email": "user@example.com",
  "role": "customer",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Expiry:** 7 days

**Storage:** Store in `localStorage` or secure cookie

---

## 🧪 Testing Flow

### Step 1: Check Configuration
```bash
curl https://api.giftgala.in/auth/google/status
```

### Step 2: Test Login
Open in browser:
```
https://api.giftgala.in/auth/google
```

### Step 3: After Login
You'll be redirected to:
```
https://giftgala.in/dashboard?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Test Protected Route
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.giftgala.in/api/protected
```

---

## ⚠️ Error Responses

### Invalid Token
```json
{
  "success": false,
  "message": "Invalid or expired token."
}
```

### No Token Provided
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Authentication Failed
Redirects to:
```
https://giftgala.in/login?error=auth_failed
```

---

## 📦 Installation Commands

On your server:
```bash
# Navigate to project
cd /home/ubuntu/inventoryfullstack

# Pull latest code
git pull origin main

# Install packages
npm install passport passport-google-oauth20

# Restart server
pm2 restart all
```

---

## 🎨 Complete Frontend Example

```jsx
// LoginPage.jsx
import React, { useEffect, useState } from 'react';

const LoginPage = () => {
    const [error, setError] = useState('');

    useEffect(() => {
        // Check for error in URL
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        
        if (errorParam === 'auth_failed') {
            setError('Google authentication failed. Please try again.');
        }
    }, []);

    const handleGoogleLogin = () => {
        window.location.href = 'https://api.giftgala.in/auth/google';
    };

    return (
        <div className="login-page">
            <h1>Welcome to GiftGala</h1>
            
            {error && <div className="error">{error}</div>}
            
            <button onClick={handleGoogleLogin} className="google-btn">
                <img src="/google-icon.svg" alt="Google" />
                Continue with Google
            </button>
        </div>
    );
};

// Dashboard.jsx
import React, { useEffect, useState } from 'react';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Extract token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
            // Store token
            localStorage.setItem('authToken', token);
            
            // Clean URL
            window.history.replaceState({}, document.title, '/dashboard');
        }

        // Fetch user profile
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            window.location.href = '/login';
            return;
        }

        try {
            const response = await fetch('https://api.giftgala.in/api/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.data);
            } else {
                // Token invalid, redirect to login
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="dashboard">
            <h1>Welcome, {user?.name}!</h1>
            <p>Email: {user?.email}</p>
        </div>
    );
};

export { LoginPage, Dashboard };
```

---

## ✅ Ready to Use!

All endpoints are ready. Just:
1. Install packages on server
2. Restart server
3. Test with the HTML file provided
4. Integrate into your frontend

**Test File:** `test-google-oauth.html`
