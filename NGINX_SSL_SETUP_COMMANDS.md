# Nginx + SSL Setup Commands

Run these commands on your server to set up Nginx with SSL:

## Step 1: Connect to Server
```bash
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.51.162.72
```

## Step 2: Update System and Install Nginx
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

## Step 3: Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/api.giftgala.in
```

Paste this configuration:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.giftgala.in;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.giftgala.in;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    client_max_body_size 10M;
}
```

Save and exit (Ctrl+X, Y, Enter)

## Step 4: Enable the Site
```bash
sudo ln -sf /etc/nginx/sites-available/api.giftgala.in /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

## Step 5: Test Nginx Configuration
```bash
sudo nginx -t
```

## Step 6: Start Nginx
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 7: Configure Firewall
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Step 8: Get SSL Certificate
```bash
sudo certbot --nginx -d api.giftgala.in --non-interactive --agree-tos --email admin@giftgala.in --redirect
```

## Step 9: Reload Nginx
```bash
sudo systemctl reload nginx
```

## Step 10: Test the API
```bash
curl https://api.giftgala.in/api/health
```

## Expected Output
```json
{
  "status": "OK",
  "message": "API is healthy",
  "timestamp": "2026-05-05T...",
  "database": "connected"
}
```

## Important Notes

1. **AWS Security Group**: Make sure ports 80 and 443 are open in AWS Security Group
2. **DNS**: api.giftgala.in should point to 13.51.162.72 (already configured)
3. **Backend**: Node.js server should be running on port 5000
4. **SSL Auto-Renewal**: Certbot will automatically renew the certificate

## Troubleshooting

### Check Nginx Status
```bash
sudo systemctl status nginx
```

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check Backend Server
```bash
ps aux | grep 'node server.js'
curl http://localhost:5000/api/health
```

### Restart Nginx
```bash
sudo systemctl restart nginx
```

### Check SSL Certificate
```bash
sudo certbot certificates
```

## After Setup Complete

Update Vercel environment variable:
- `NEXT_PUBLIC_API_BASE=https://api.giftgala.in`

The API will be accessible at:
- ✅ `https://api.giftgala.in/api/health`
- ✅ `https://api.giftgala.in/api/website/products`
- ✅ All other endpoints without port number
