# SSL Certificate Instructions

## Issue
The frontend is getting `ERR_CERT_AUTHORITY_INVALID` because the server uses a self-signed SSL certificate.

## Solution
Users need to accept the self-signed certificate in their browser first.

### Steps for Users:

1. **Open the backend URL directly in browser:**
   ```
   https://54.169.31.95:8443
   ```

2. **Accept the certificate warning:**
   - Chrome: Click "Advanced" → "Proceed to 54.169.31.95 (unsafe)"
   - Firefox: Click "Advanced" → "Accept the Risk and Continue"
   - Safari: Click "Show Details" → "visit this website"

3. **You should see a response like:**
   ```json
   {"success":false,"message":"Access token required","error":"NO_TOKEN"}
   ```

4. **Now the frontend will work** because the browser has accepted the certificate.

### Alternative: Get a Proper SSL Certificate

For production, you should get a proper SSL certificate:

```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Current Status
- ✅ Backend server is running with HTTPS
- ✅ Nginx is configured properly  
- ✅ 2FA system is fully functional
- ⚠️ Self-signed certificate needs user acceptance
- ✅ All APIs are working correctly

The system is production-ready, just needs proper SSL certificate for seamless user experience.