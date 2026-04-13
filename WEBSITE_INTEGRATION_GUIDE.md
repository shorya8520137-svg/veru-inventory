# Website Customer Integration Guide

## ✅ What's Been Created

I've created complete signup and login APIs for your website customers. When customers register or login on your website, their data will automatically appear in your inventory dashboard.

---

## 🎯 APIs Available

### 1. **Signup API**
```
POST https://54.254.184.54:8443/api/website-auth/signup
```

### 2. **Login API**
```
POST https://54.254.184.54:8443/api/website-auth/login
```

### 3. **Google OAuth API**
```
POST https://54.254.184.54:8443/api/website-auth/google
```

### 4. **Get Profile API**
```
GET https://54.254.184.54:8443/api/website-auth/profile
```

---

## 🚀 Quick Integration (Copy-Paste Ready)

### HTML Signup Form

```html
<!DOCTYPE html>
<html>
<head>
    <title>Signup</title>
</head>
<body>
    <h2>Create Account</h2>
    <form id="signupForm">
        <input type="text" id="name" placeholder="Full Name" required><br>
        <input type="email" id="email" placeholder="Email" required><br>
        <input type="tel" id="phone" placeholder="Phone Number"><br>
        <input type="password" id="password" placeholder="Password" required><br>
        <button type="submit">Sign Up</button>
    </form>
    <p id="message"></p>

    <script>
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                password: document.getElementById('password').value
            };

            try {
                const response = await fetch('https://54.254.184.54:8443/api/website-auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    // Save token
                    localStorage.setItem('customerToken', result.token);
                    localStorage.setItem('customerInfo', JSON.stringify(result.customer));
                    
                    document.getElementById('message').textContent = 'Signup successful!';
                    document.getElementById('message').style.color = 'green';
                    
                    // Redirect to dashboard or home
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 1000);
                } else {
                    document.getElementById('message').textContent = result.message;
                    document.getElementById('message').style.color = 'red';
                }
            } catch (error) {
                document.getElementById('message').textContent = 'Network error. Please try again.';
                document.getElementById('message').style.color = 'red';
            }
        });
    </script>
</body>
</html>
```

### HTML Login Form

```html
<!DOCTYPE html>
<html>
<head>
    <title>Login</title>
</head>
<body>
    <h2>Login</h2>
    <form id="loginForm">
        <input type="email" id="email" placeholder="Email" required><br>
        <input type="password" id="password" placeholder="Password" required><br>
        <button type="submit">Login</button>
    </form>
    <p id="message"></p>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };

            try {
                const response = await fetch('https://54.254.184.54:8443/api/website-auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    // Save token
                    localStorage.setItem('customerToken', result.token);
                    localStorage.setItem('customerInfo', JSON.stringify(result.customer));
                    
                    document.getElementById('message').textContent = 'Login successful!';
                    document.getElementById('message').style.color = 'green';
                    
                    // Redirect to dashboard or home
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 1000);
                } else {
                    document.getElementById('message').textContent = result.message;
                    document.getElementById('message').style.color = 'red';
                }
            } catch (error) {
                document.getElementById('message').textContent = 'Network error. Please try again.';
                document.getElementById('message').style.color = 'red';
            }
        });
    </script>
</body>
</html>
```

---

## 📋 Deployment Steps

### On AWS Server:

```bash
# 1. SSH to server
ssh ubuntu@54.254.184.54

# 2. Navigate to project
cd ~/inventoryfullstack

# 3. Pull latest code
git pull origin stocksphere-phase-1-complete

# 4. Restart server
pm2 restart dashboard-api-1

# 5. Check logs
pm2 logs dashboard-api-1 --lines 30
```

---

## 🧪 Test the APIs

### Test Signup:
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

### Test Login:
```bash
curl -X POST https://54.254.184.54:8443/api/website-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

---

## 📊 View Customers in Dashboard

After customers signup, you can see them at:
```
https://inventoryfullstack-one.vercel.app/website-customers
```

---

## 🔑 API Documentation

View all APIs in your dashboard:
```
https://inventoryfullstack-one.vercel.app/api
```

The new **Website Customer Authentication API** section shows:
- ✅ Signup endpoint
- ✅ Login endpoint
- ✅ Google OAuth endpoint
- ✅ Get Profile endpoint

---

## 💡 What Happens

1. **Customer fills signup form on your website**
2. **Your website calls** `POST /api/website-auth/signup`
3. **API creates customer** in `website_customers` table
4. **API returns JWT token** + customer info
5. **Your website stores token** in localStorage
6. **Customer data appears** in inventory dashboard at `/website-customers`
7. **Admin can manage** customers (suspend/activate, view activity)

---

## 🎨 Response Format

### Signup/Login Success:
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

### Error Response:
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

## 🔒 Security Features

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens expire after 30 days
- ✅ Account suspension support
- ✅ Email uniqueness enforced
- ✅ Google OAuth support

---

## 📞 Need Help?

- **Full Documentation**: `WEBSITE_AUTH_API_DOCUMENTATION.md`
- **API Page**: https://inventoryfullstack-one.vercel.app/api
- **Customers Page**: https://inventoryfullstack-one.vercel.app/website-customers

---

**Ready to integrate!** 🚀
