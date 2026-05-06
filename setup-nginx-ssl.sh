#!/bin/bash

echo "=========================================="
echo "Setting up Nginx + SSL for api.giftgala.in"
echo "=========================================="
echo ""

# Update system
echo "1. Updating system packages..."
sudo apt update

# Install Nginx
echo "2. Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for Let's Encrypt SSL
echo "3. Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Create Nginx configuration for api.giftgala.in
echo "4. Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/api.giftgala.in > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.giftgala.in;

    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS (will be configured after SSL)
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.giftgala.in;

    # SSL certificates (will be added by certbot)
    # ssl_certificate /etc/letsencrypt/live/api.giftgala.in/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.giftgala.in/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy settings
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
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase max body size for file uploads
    client_max_body_size 10M;
}
EOF

# Enable the site
echo "5. Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/api.giftgala.in /etc/nginx/sites-enabled/

# Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "6. Testing Nginx configuration..."
sudo nginx -t

# Start Nginx
echo "7. Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Open ports in UFW if enabled
echo "8. Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Get SSL certificate from Let's Encrypt
echo "9. Getting SSL certificate from Let's Encrypt..."
echo "   This will ask for your email and agreement to terms..."
sudo certbot --nginx -d api.giftgala.in --non-interactive --agree-tos --email admin@giftgala.in --redirect

# Reload Nginx with SSL
echo "10. Reloading Nginx with SSL..."
sudo systemctl reload nginx

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Your API is now available at:"
echo "  https://api.giftgala.in"
echo ""
echo "Testing the endpoint..."
curl -s https://api.giftgala.in/api/health | jq .
echo ""
echo "SSL certificate will auto-renew via certbot."
echo "=========================================="
