# SSL Certificate Fix Guide for New Server

## Issue
Your application is trying to connect to `https://54.169.31.95:8443` but getting `ERR_CERT_AUTHORITY_INVALID` error.

## Solution Steps

### Step 1: Accept SSL Certificate in Browser
1. Open a new browser tab
2. Navigate directly to: `https://54.169.31.95:8443`
3. You'll see a security warning about the certificate
4. Click "Advanced" or "Show Details"
5. Click "Proceed to 54.169.31.95 (unsafe)" or "Accept Risk and Continue"
6. This will add the certificate to your browser's accepted certificates

### Step 2: Test API Endpoint
After accepting the certificate, test the API endpoint:
1. Go to: `https://54.169.31.95:8443/api/auth/login`
2. You should see a JSON response instead of a 404 error

### Step 3: Verify Application
1. Go back to your application: `https://inventoryfullstack-one.vercel.app`
2. Try logging in again
3. The SSL error should be resolved

## Current Configuration Status ✅
- API Base URL: `https://54.169.31.95:8443` ✅ Updated
- Environment: Production ✅ Configured
- HTTPS: Enabled ✅ As requested
- Port: 8443 ✅ Correct

## If Still Having Issues
1. Check if nginx is running on the new server
2. Verify SSL certificate is properly configured in nginx
3. Ensure the API server is running on port 8443
4. Check firewall settings for port 8443

## Test Commands for Server
```bash
# Check if nginx is running
sudo systemctl status nginx

# Check if API server is running on port 8443
sudo netstat -tlnp | grep 8443

# Test API endpoint from server
curl -k https://localhost:8443/api/auth/login
```