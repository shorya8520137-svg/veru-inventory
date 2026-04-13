# IP Address Update Instructions

## Summary
Updated the API base URL from the old server to the new server IP: **47.129.8.24**

## Changes Made

### ✅ Completed
1. **Environment Configuration** (.env.production)
   - Updated `NEXT_PUBLIC_API_BASE` to `https://47.129.8.24:8443`
   - Committed and pushed to GitHub

### 📋 Next Steps (Run after closing all files)

2. **Update Hardcoded URLs in Source Files**
   
   Close all open files in your editor, then run:
   ```powershell
   .\update-ip-address.ps1
   ```
   
   This will update the IP address in:
   - `src/app/api/page.jsx` (API documentation page)
   - `src/app/security/page.jsx` (2FA security page)
   - `src/app/profile/page-new.jsx` (Profile page)
   - `src/app/api-keys/page.jsx` (API keys page)

3. **Commit and Push Changes**
   ```bash
   git add .
   git commit -m "chore: Update all hardcoded IP addresses to 47.129.8.24"
   git push origin stocksphere-phase-1-complete
   ```

4. **Deploy to Server**
   
   On your server (47.129.8.24), run:
   ```bash
   cd ~/inventoryfullstack
   git pull origin stocksphere-phase-1-complete
   npm install
   npm run build
   pm2 restart all
   ```

## Files Updated

### Environment Files
- `.env.production` - Main production environment configuration

### Source Files (To be updated)
- `src/app/api/page.jsx` - API documentation with example URLs
- `src/app/security/page.jsx` - 2FA security endpoints
- `src/app/profile/page-new.jsx` - Profile API calls
- `src/app/api-keys/page.jsx` - API key management

## New Server Details

- **IP Address**: 47.129.8.24
- **API Base URL**: https://47.129.8.24:8443
- **Branch**: stocksphere-phase-1-complete

## Verification

After deployment, test these endpoints:
```bash
# Health check
curl -k https://47.129.8.24:8443/

# API test
curl -k https://47.129.8.24:8443/api/website/products

# With authentication
curl -k -H "Authorization: Bearer YOUR_TOKEN" https://47.129.8.24:8443/api/website/orders
```

## Notes

- The `-k` flag in curl commands is used to skip SSL certificate verification
- Make sure your server firewall allows traffic on port 8443
- Update your frontend deployment (Vercel) environment variables if needed
