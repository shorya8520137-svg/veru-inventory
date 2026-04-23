# Complete SSH Deployment Commands

## Full SSH Command for Deployment

```bash
ssh ubuntu@54.169.102.51 "cd ~/veru-inventory-main && git pull origin main && npm install && pm2 restart all && pm2 status"
```

## Step-by-Step Commands (if you need to run separately)

### 1. Connect to Server
```bash
ssh ubuntu@54.169.102.51
```

### 2. Navigate to Project
```bash
cd ~/veru-inventory-main
```

### 3. Pull Latest Code
```bash
git pull origin main
```

### 4. Install Dependencies (if needed)
```bash
npm install
```

### 5. Restart All PM2 Services
```bash
pm2 restart all
```

### 6. Check Status
```bash
pm2 status
```

### 7. View Logs
```bash
pm2 logs
```

## Alternative: One-Line Deployment with Logging

```bash
ssh ubuntu@54.169.102.51 "cd ~/veru-inventory-main && git pull origin main && npm install && pm2 restart all && echo '=== PM2 Status ===' && pm2 status && echo '=== Recent Logs ===' && pm2 logs --lines 50"
```

## If You Need to Rebuild Next.js

```bash
ssh ubuntu@54.169.102.51 "cd ~/veru-inventory-main && git pull origin main && npm install && npm run build && pm2 restart all && pm2 status"
```

## Quick Health Check After Deployment

```bash
ssh ubuntu@54.169.102.51 "curl -s https://api.giftgala.in/api/health || echo 'API not responding'"
```

## View Full PM2 Logs

```bash
ssh ubuntu@54.169.102.51 "pm2 logs --lines 100"
```

## Restart Specific Service

```bash
ssh ubuntu@54.169.102.51 "pm2 restart server"
```

## Kill and Restart All

```bash
ssh ubuntu@54.169.102.51 "pm2 kill && pm2 start ecosystem.config.js && pm2 status"
```

---

## What Changed in This Deployment

✅ Fixed Transfer Form dropdown logic
✅ Changed API endpoint to correct path
✅ Updated payload format for backend
✅ Added proper conditional rendering
✅ Form now works for all transfer types (W to W, W to S, S to W, S to S)

## Testing After Deployment

1. Go to https://api.giftgala.in/inventory
2. Click "Transfer Stock" button
3. Select different transfer types from dropdown
4. Verify labels change correctly
5. Test form submission
