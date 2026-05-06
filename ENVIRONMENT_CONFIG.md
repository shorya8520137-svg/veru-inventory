# Environment Configuration Guide

## Overview

This project uses different environment files for different deployment targets:

```
.env.local        → Local development (your machine)
.env.production   → Old GiftGala server (13.212.202.137)
.env.insora       → New Insora server (13.51.162.72)
```

---

## Environment Files Comparison

### `.env.local` (Local Development)
```env
NEXT_PUBLIC_API_BASE=https://api.giftgala.in
DB_HOST=api.giftgala.in          # Remote database
DB_USER=inventory_user
DB_PASSWORD=StrongPass@123
DB_NAME=inventory_db
```
**Use Case**: Development on your local machine, connecting to remote database

---

### `.env.production` (Old Server - GiftGala)
```env
NEXT_PUBLIC_API_BASE=https://api.giftgala.in
DB_HOST=api.giftgala.in          # Domain pointing to 13.212.202.137
DB_USER=inventory_user
DB_PASSWORD=StrongPass@123
DB_NAME=inventory_db
```
**Use Case**: Production deployment on old server (13.212.202.137)

---

### `.env.insora` (New Server - Insora) ⭐ NEW
```env
NEXT_PUBLIC_API_BASE=http://13.51.162.72:3000
DB_HOST=localhost                 # Local database on same server
DB_USER=inventory_user
DB_PASSWORD=StrongPass@123
DB_NAME=inventory_db
PORT=3000
```
**Use Case**: Production deployment on new Ubuntu server (13.51.162.72)

---

## Key Differences

| Setting | Local | Old Server | New Server |
|---------|-------|------------|------------|
| **API Base** | https://api.giftgala.in | https://api.giftgala.in | http://13.51.162.72:3000 |
| **DB Host** | api.giftgala.in (remote) | api.giftgala.in (local) | localhost |
| **Server IP** | N/A | 13.212.202.137 | 13.51.162.72 |
| **User** | N/A | root | ubuntu |
| **Key** | N/A | Password/root | insora.pem |

---

## Deployment Workflow

### For New Insora Server

**1. Migrations (Database Setup)**
```powershell
# Uses .env.insora internally
.\deploy-migrations-insora.ps1
```

**2. Backend Deployment**
```powershell
# Will upload .env.insora as .env.local on server
.\deploy-backend-insora.ps1
```

**3. Frontend Deployment (Vercel)**
```bash
# Update Vercel environment variables
NEXT_PUBLIC_API_BASE=http://13.51.162.72:3000
```

---

## Environment Variables Explained

### Database Configuration
```env
DB_HOST=localhost              # Database server address
DB_USER=inventory_user         # MySQL username
DB_PASSWORD=StrongPass@123     # MySQL password
DB_NAME=inventory_db           # Database name
DB_PORT=3306                   # MySQL port (default)
```

### API Configuration
```env
NEXT_PUBLIC_API_BASE=http://13.51.162.72:3000  # Backend API URL
NODE_ENV=production                             # Environment mode
NEXT_PUBLIC_API_TIMEOUT=30000                   # Request timeout (ms)
```

### Server Configuration
```env
PORT=3000                      # Express server port
HOST=0.0.0.0                   # Listen on all interfaces
```

### Cloudinary (Image Storage)
```env
CLOUDINARY_URL=cloudinary://...
CLOUDINARY_API_KEY=873182261586762
CLOUDINARY_API_SECRET=0Q9-fP9ujOZ5ZB2BmglJI6cujXI
CLOUDINARY_CLOUD_NAME=df3l7ppo6
```

### Security (Production Only)
```env
JWT_SECRET=your-super-secret-jwt-key-change-this
SESSION_SECRET=your-session-secret-change-this
```

⚠️ **IMPORTANT**: Change these secrets in production!

---

## Migration Strategy

### Phase 1: Setup New Server (Current)
- Deploy to Insora server (13.51.162.72)
- Use `.env.insora` configuration
- Test everything works

### Phase 2: Parallel Running
- Old server (GiftGala) still active
- New server (Insora) running in parallel
- Frontend can switch between servers

### Phase 3: Full Migration
- Update DNS: api.giftgala.in → 13.51.162.72
- Update `.env.production` to point to new server
- Decommission old server

---

## Security Best Practices

### 1. Never Commit Secrets
```bash
# .gitignore should include:
.env*
!.env.example
```

### 2. Use Strong Passwords
```env
# BAD
DB_PASSWORD=password123

# GOOD
DB_PASSWORD=StrongPass@123!#$%
```

### 3. Rotate Secrets Regularly
- Change JWT_SECRET every 90 days
- Change DB_PASSWORD every 180 days
- Update API keys when compromised

### 4. Use Environment-Specific Secrets
- Different secrets for dev/staging/production
- Never use production secrets in development

---

## Troubleshooting

### "Cannot connect to database"
```bash
# Check DB_HOST is correct
# On server: use "localhost"
# From local: use server IP or domain

# Test connection
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME
```

### "API endpoint not found"
```bash
# Check NEXT_PUBLIC_API_BASE matches backend URL
# Frontend: http://13.51.162.72:3000
# Backend: Should listen on 0.0.0.0:3000
```

### "Environment variables not loading"
```bash
# Check file name
ls -la .env*

# Check file is in correct location
# Backend: /home/ubuntu/inventory-app/.env.local
# Frontend: Vercel dashboard → Environment Variables
```

---

## Quick Reference

### Local Development
```powershell
# Use .env.local (already configured)
npm run dev
```

### Deploy to Insora Server
```powershell
# Migrations
.\deploy-migrations-insora.ps1

# Backend (future)
.\deploy-backend-insora.ps1

# Frontend (Vercel)
git push origin main
```

### Check Environment on Server
```bash
ssh -i C:\insora.pem ubuntu@13.51.162.72
cd /home/ubuntu/inventory-app
cat .env.local
```

---

## Files Summary

| File | Purpose | Location |
|------|---------|----------|
| `.env.local` | Local development | Your machine |
| `.env.production` | Old server config | Old server (GiftGala) |
| `.env.insora` | New server config | New server (Insora) |
| `.env.example` | Template (no secrets) | Git repository |

---

**Current Status**: `.env.insora` created and ready for deployment! ✅
