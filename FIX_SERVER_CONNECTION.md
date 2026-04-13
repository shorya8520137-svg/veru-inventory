# Fix Server Connection - ERR_CONNECTION_REFUSED

## Error: 18.143.133.96 refused to connect

This means:
1. Nginx is not running
2. Port 443 is blocked
3. Backend server is not running

## Run These Commands on Server

```bash
ssh ubuntu@18.143.133.96
```

### Step 1: Check What's Running
```bash
# Check Nginx status
sudo systemctl status nginx

# Check PM2 processes
pm2 status

# Check what's listening on ports
sudo netstat -tlnp | grep -E ':(80|443|8080|8443)'
```

### Step 2: Start Nginx
```bash
# Start Nginx
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Step 3: Check Nginx Configuration
```bash
# Test Nginx config
sudo nginx -t

# View Nginx config
sudo cat /etc/nginx/sites-available/default
```

### Step 4: Check Firewall
```bash
# Check UFW status
sudo ufw status

# Allow necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp

# Check again
sudo ufw status
```

### Step 5: Check AWS Security Group
In AWS Console:
- Go to EC2 → Security Groups
- Find your instance's security group
- Inbound Rules should have:
  - HTTP: Port 80, Source: 0.0.0.0/0
  - HTTPS: Port 443, Source: 0.0.0.0/0
  - Custom TCP: Port 8080, Source: 0.0.0.0/0

### Step 6: Start Backend Server
```bash
cd /home/ubuntu/inventoryfullstack

# Check if running
pm2 status

# If not running, start it
pm2 start server.js --name backend
pm2 start npm --name nextjs -- start

# Save PM2 config
pm2 save
pm2 startup
```

### Step 7: Check Nginx Logs
```bash
# Error logs
sudo tail -f /var/log/nginx/error.log

# Access logs
sudo tail -f /var/log/nginx/access.log
```

## Nginx Configuration Template

If Nginx config is missing, create it:

```bash
sudo nano /etc/nginx/sites-available/default
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name 18.143.133.96;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 18.143.133.96;

    # SSL Configuration (adjust paths if needed)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Or if using Let's Encrypt:
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # API Backend (Node.js on port 8080)
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (Next.js on port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then:
```bash
# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## If SSL Certificate is Missing

### Option 1: Create Self-Signed Certificate
```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/key.pem \
  -out /etc/nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=18.143.133.96"
```

### Option 2: Use Let's Encrypt (Requires Domain)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

## Quick Test Commands

```bash
# Test if backend is running
curl http://localhost:8080/

# Test if Nginx is working
curl http://localhost/

# Test from outside
curl https://18.143.133.96/ -k
```

## Expected Output

After fixing, you should see:
```bash
pm2 status
# Should show processes running

sudo systemctl status nginx
# Should show "active (running)"

curl http://localhost:8080/
# Should return HTML or JSON

curl https://18.143.133.96/ -k
# Should return your app
```

## Still Not Working?

### Check if ports are actually open:
```bash
# From your local machine
telnet 18.143.133.96 443
# Should connect

nc -zv 18.143.133.96 443
# Should show "succeeded"
```

### Check server logs:
```bash
# Backend logs
pm2 logs --lines 100

# Nginx logs
sudo tail -100 /var/log/nginx/error.log

# System logs
sudo journalctl -xe
```

## Summary of Required Services

1. **Backend API** - Node.js on port 8080
   ```bash
   pm2 start server.js --name backend
   ```

2. **Frontend** - Next.js on port 3000
   ```bash
   pm2 start npm --name nextjs -- start
   ```

3. **Nginx** - Reverse proxy on ports 80/443
   ```bash
   sudo systemctl start nginx
   ```

All three must be running for the app to work!
