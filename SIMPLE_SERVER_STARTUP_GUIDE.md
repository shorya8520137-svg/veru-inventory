# Simple Server Startup Guide

## 🎯 ONE-COMMAND SOLUTION

No more directory confusion! Just run ONE of these commands from ANYWHERE:

### For Linux/Mac:
```bash
# Make executable (only needed once)
chmod +x /home/ubuntu/inventoryfullstack/start-server.sh

# Start server (run this anytime)
/home/ubuntu/inventoryfullstack/start-server.sh
```

### For Windows:
```cmd
# Start server (run this anytime)
C:\path\to\inventoryfullstack\start-server.cmd
```

## 🔧 What These Scripts Do Automatically

1. **Navigate to correct directory** - No more "cd" confusion
2. **Pull latest changes** - Always get the newest fixes
3. **Run emergency fix** - Applies API key context fix if needed
4. **Start server** - Launches the application

## 📍 No More Directory Issues!

The scripts automatically:
- Find the project root directory
- Verify `server.js` exists
- Handle all navigation for you

## 🌐 After Server Starts

Your API will be available at:
- **Local**: `http://localhost:3001`
- **Production**: `https://54.169.31.95:8443/api/website/orders`

## 🎉 Frontend Integration

Once the server is running, your frontend at `https://frontend-sigma-two-47.vercel.app` can successfully create orders using:

```javascript
fetch('https://54.169.31.95:8443/api/website/orders', {
    method: 'POST',
    headers: {
        'X-API-Key': 'wk_live_3c6930a44febffade97a5e1a00e4db23a0dc552e3bf8a55800c1f3fd1f03de37',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
});
```

## 🚨 Emergency Commands

If you need to run commands manually:

```bash
# Navigate to project root
cd /home/ubuntu/inventoryfullstack

# Run emergency fix
node emergency-fix-api-key.js

# Start server
node server.js
```

But the startup scripts handle all of this automatically! 🎯