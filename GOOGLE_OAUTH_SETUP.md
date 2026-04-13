# Google OAuth Integration - Setup Complete

## 🎯 What Was Implemented

Google OAuth login with JWT authentication for your existing Node.js + Express backend.

## 📁 Files Created

1. **config/passport.js** - Passport Google Strategy configuration
2. **routes/googleAuthRoutes.js** - Google OAuth routes
3. **middleware/jwtAuth.js** - JWT verification middleware
4. **routes/protectedRoutes.js** - Example protected routes
5. **server.js** - Updated with Passport initialization

## 🔧 Installation

Run this command on your server:

```bash
npm install passport passport-google-oauth20
```

Or use the provided script:

```bash
bash install-google-oauth.sh
```

## 🔐 Environment Variables

Add these to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
JWT_SECRET=your-existing-jwt-secret
```

## 🚀 API Endpoints

### 1. Start Google Login
```
GET https://api.giftgala.in/auth/google
```
Redirects user to Google login page.

### 2. Google Callback (Automatic)
```
GET https://api.giftgala.in/auth/google/callback
```
Google redirects here after login. Then redirects to:
```
https://giftgala.in/dashboard?token=JWT_TOKEN
```

### 3. Check OAuth Status
```
GET https://api.giftgala.in/auth/google/status
```
Returns configuration status.

### 4. Protected Route Example
```
GET https://api.giftgala.in/api/protected
Authorization: Bearer YOUR_JWT_TOKEN
```

### 5. Get User Profile
```
GET https://api.giftgala.in/api/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🔄 User Flow

1. User clicks "Login with Google" on frontend
2. Frontend redirects to: `https://api.giftgala.in/auth/google`
3. User logs in with Google
4. Google redirects to callback URL
5. Backend creates/updates user in `website_customers` table
6. Backend generates JWT token (7 days expiry)
7. Backend redirects to: `https://giftgala.in/dashboard?token=JWT_TOKEN`
8. Frontend extracts token from URL and stores it
9. Frontend uses token for authenticated requests

## 💾 Database

Uses existing `website_customers` table:
- Checks if user exists by `google_id` or `email`
- Creates new user if doesn't exist
- Updates `google_id` and `last_login` on login

## 🔑 JWT Token

**Payload:**
```json
{
  "userId": 123,
  "email": "user@example.com",
  "role": "customer"
}
```

**Expiry:** 7 days

## 🛡️ Protected Routes

Use the `verifyJWT` middleware:

```javascript
const { verifyJWT } = require('./middleware/jwtAuth');

router.get('/my-route', verifyJWT, (req, res) => {
    // Access user info via req.user
    console.log(req.user.id);
    console.log(req.user.email);
    console.log(req.user.role);
});
```

## 🧪 Testing

### 1. Check Configuration
```bash
curl https://api.giftgala.in/auth/google/status
```

### 2. Test Login Flow
Open in browser:
```
https://api.giftgala.in/auth/google
```

### 3. Test Protected Route
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.giftgala.in/api/protected
```

## 🌐 Frontend Integration

### HTML Button
```html
<a href="https://api.giftgala.in/auth/google" class="google-login-btn">
    <img src="google-icon.png" alt="Google" />
    Login with Google
</a>
```

### React Component
```jsx
const GoogleLoginButton = () => {
    const handleGoogleLogin = () => {
        window.location.href = 'https://api.giftgala.in/auth/google';
    };

    return (
        <button onClick={handleGoogleLogin}>
            Login with Google
        </button>
    );
};
```

### Extract Token on Dashboard
```javascript
// On dashboard page load
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
    // Store token
    localStorage.setItem('authToken', token);
    
    // Clean URL
    window.history.replaceState({}, document.title, '/dashboard');
    
    // Use token for API calls
    fetch('https://api.giftgala.in/api/profile', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}
```

## 🔒 Security Notes

1. **No Session Storage** - Pure JWT, no express-session
2. **HTTPS Only** - All URLs use HTTPS
3. **Token Expiry** - 7 days, configurable
4. **CORS Enabled** - Already configured in your server
5. **Database Validation** - Checks user status before login

## 🚨 Important

After installing packages, restart your server:

```bash
# On your EC2 server
pm2 restart all
# or
npm run server
```

## 📞 Support

If you encounter any issues:
1. Check server logs for errors
2. Verify environment variables are set
3. Ensure packages are installed
4. Test the status endpoint first

## ✅ Ready to Use

Your Google OAuth is now integrated and ready to use! Just install the packages and restart the server.
