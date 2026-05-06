# AWS Server Requirements for Veru Inventory System

## 📋 Project Overview
- **Type**: Full-stack inventory management system
- **Frontend**: Next.js 16 (React 18)
- **Backend**: Node.js + Express
- **Database**: MariaDB/MySQL
- **Architecture**: Monolithic (Frontend + Backend in same codebase)

---

## 🖥️ Recommended AWS EC2 Instance Specifications

### **Option 1: Production (Recommended)**
**Instance Type**: `t3.medium` or `t3a.medium`

| Specification | Details |
|--------------|---------|
| **vCPUs** | 2 vCPUs |
| **RAM** | 4 GB |
| **Storage** | 30-50 GB SSD (gp3) |
| **Network** | Up to 5 Gbps |
| **Cost** | ~$30-35/month (t3.medium) |
| **Use Case** | 50-200 concurrent users |

**Why this spec?**
- Next.js build requires 2-3 GB RAM
- Node.js backend needs 512 MB - 1 GB
- MariaDB needs 1-2 GB RAM
- OS + overhead: 512 MB
- **Total**: ~4 GB minimum

---

### **Option 2: Small Business/Startup**
**Instance Type**: `t3.small` or `t3a.small`

| Specification | Details |
|--------------|---------|
| **vCPUs** | 2 vCPUs |
| **RAM** | 2 GB |
| **Storage** | 20-30 GB SSD (gp3) |
| **Network** | Up to 5 Gbps |
| **Cost** | ~$15-18/month |
| **Use Case** | 10-50 concurrent users |

**⚠️ Limitations:**
- May struggle during Next.js builds
- Need to add swap space (4 GB recommended)
- Database queries might be slower with large datasets

---

### **Option 3: Development/Testing**
**Instance Type**: `t3.micro` or `t3a.micro`

| Specification | Details |
|--------------|---------|
| **vCPUs** | 2 vCPUs |
| **RAM** | 1 GB |
| **Storage** | 10-20 GB SSD (gp3) |
| **Network** | Up to 5 Gbps |
| **Cost** | ~$7-9/month |
| **Use Case** | Testing only, 1-5 users |

**⚠️ Not Recommended for Production:**
- Will crash during Next.js build without swap
- Very slow database operations
- Cannot handle concurrent users

---

### **Option 4: High Traffic/Enterprise**
**Instance Type**: `t3.large` or `c6i.large`

| Specification | Details |
|--------------|---------|
| **vCPUs** | 2-4 vCPUs |
| **RAM** | 8 GB |
| **Storage** | 50-100 GB SSD (gp3) |
| **Network** | Up to 10 Gbps |
| **Cost** | ~$60-75/month |
| **Use Case** | 200-500 concurrent users |

---

## 💾 Storage Requirements

### **Breakdown:**
```
Operating System (Ubuntu 22.04):     3 GB
Node.js + npm packages:              2 GB
Next.js build files:                 1-2 GB
Database (MariaDB):                  5-10 GB (grows with data)
Logs:                                1-2 GB
User uploads (images, files):        5-10 GB
Swap space (if RAM < 4GB):           4 GB
Buffer/Free space:                   5 GB
-------------------------------------------
TOTAL MINIMUM:                       25-30 GB
RECOMMENDED:                         50 GB
```

### **Storage Type:**
- **gp3 SSD** (Recommended): Best price/performance
- **gp2 SSD**: Older generation, slightly more expensive
- **io1/io2**: Overkill for this application

---

## 🗄️ Database Options

### **Option A: Same Server (Current Setup)**
- MariaDB/MySQL on same EC2 instance
- **Pros**: Simple, no extra cost
- **Cons**: Shares resources with app
- **Minimum RAM**: 4 GB total (2 GB for DB)

### **Option B: AWS RDS (Recommended for Production)**
**Instance Type**: `db.t3.micro` or `db.t3.small`

| Specification | Details |
|--------------|---------|
| **Instance** | db.t3.micro |
| **RAM** | 1 GB |
| **Storage** | 20 GB SSD |
| **Cost** | ~$15-20/month |
| **Benefits** | Automated backups, scaling, monitoring |

**Total Cost**: EC2 (t3.small $15) + RDS (db.t3.micro $15) = **$30/month**

---

## 🌐 Network & Security

### **Inbound Rules (Security Group):**
```
Port 22   (SSH)         - Your IP only
Port 80   (HTTP)        - 0.0.0.0/0
Port 443  (HTTPS)       - 0.0.0.0/0
Port 3306 (MySQL)       - EC2 instance IP only (if using RDS)
Port 5000 (Backend API) - 0.0.0.0/0 (or behind Nginx)
```

### **Outbound Rules:**
```
All traffic - 0.0.0.0/0 (default)
```

---

## 📦 Software Requirements

### **Operating System:**
- **Ubuntu 22.04 LTS** (Recommended)
- **Amazon Linux 2023** (Alternative)

### **Required Software:**
```bash
Node.js:        v18.x or v20.x (LTS)
npm:            v9.x or v10.x
PM2:            Latest (process manager)
Nginx:          Latest (reverse proxy)
MariaDB:        11.x or MySQL 8.x
Git:            Latest
Certbot:        Latest (for SSL)
```

---

## 💰 Cost Breakdown (Monthly)

### **Scenario 1: Budget Setup**
```
EC2 t3.small (2GB RAM):              $15
Storage 30GB gp3:                    $3
Data Transfer (100GB):               $9
-------------------------------------------
TOTAL:                               $27/month
```

### **Scenario 2: Recommended Production**
```
EC2 t3.medium (4GB RAM):             $35
Storage 50GB gp3:                    $5
Data Transfer (200GB):               $18
Elastic IP:                          $0 (if attached)
-------------------------------------------
TOTAL:                               $58/month
```

### **Scenario 3: Separate Database**
```
EC2 t3.small (2GB RAM):              $15
RDS db.t3.micro (1GB RAM):           $15
Storage 30GB gp3 (EC2):              $3
Storage 20GB gp3 (RDS):              $2
Data Transfer (150GB):               $14
-------------------------------------------
TOTAL:                               $49/month
```

### **Scenario 4: Enterprise**
```
EC2 t3.large (8GB RAM):              $70
RDS db.t3.small (2GB RAM):           $30
Storage 100GB gp3 (EC2):             $10
Storage 50GB gp3 (RDS):              $5
Data Transfer (500GB):               $45
Load Balancer (optional):            $20
-------------------------------------------
TOTAL:                               $180/month
```

---

## 🚀 Performance Expectations

### **t3.small (2GB RAM):**
- **Build Time**: 3-5 minutes
- **Startup Time**: 10-15 seconds
- **Concurrent Users**: 10-50
- **API Response**: 100-300ms
- **Database Queries**: 50-200ms

### **t3.medium (4GB RAM):**
- **Build Time**: 2-3 minutes
- **Startup Time**: 5-10 seconds
- **Concurrent Users**: 50-200
- **API Response**: 50-150ms
- **Database Queries**: 20-100ms

### **t3.large (8GB RAM):**
- **Build Time**: 1-2 minutes
- **Startup Time**: 3-5 seconds
- **Concurrent Users**: 200-500
- **API Response**: 30-100ms
- **Database Queries**: 10-50ms

---

## 📊 Scaling Recommendations

### **When to Upgrade:**

**From t3.small to t3.medium:**
- CPU usage consistently > 70%
- RAM usage > 80%
- Slow page loads (> 3 seconds)
- More than 50 concurrent users

**From t3.medium to t3.large:**
- CPU usage consistently > 80%
- RAM usage > 85%
- More than 200 concurrent users
- Complex reports timing out

**Consider Load Balancer + Multiple Instances:**
- More than 500 concurrent users
- Need zero-downtime deployments
- Geographic distribution required

---

## 🔧 Optimization Tips

### **For 2GB RAM (t3.small):**
```bash
# Add swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize Node.js memory
export NODE_OPTIONS="--max-old-space-size=1536"

# Use PM2 with memory limits
pm2 start server.js --max-memory-restart 1G
```

### **For 4GB RAM (t3.medium):**
```bash
# Optimize Node.js
export NODE_OPTIONS="--max-old-space-size=3072"

# PM2 cluster mode
pm2 start server.js -i 2
```

---

## ✅ Final Recommendation

### **For Your Project:**

**Best Choice**: **t3.medium (4GB RAM, 2 vCPUs)**

**Reasons:**
1. Your app has Next.js (memory-intensive builds)
2. Express backend + MariaDB on same server
3. Multiple features (inventory, orders, permissions, etc.)
4. File uploads (images, CSVs)
5. Real-time features (customer support, notifications)

**Cost**: ~$35-40/month (EC2) + ~$15-20/month (bandwidth) = **$50-60/month total**

**Alternative**: Start with **t3.small + 4GB swap** ($15-20/month) and upgrade if needed.

---

## 📞 Current Server Status

Your current server at `13.62.99.152` appears to be running. Check specs:

```bash
ssh -i "C:\Users\singh\.ssh\insora.pem" ubuntu@13.62.99.152 "free -h && df -h && nproc"
```

This will show:
- Available RAM
- Disk space
- CPU cores

---

## 🎯 Quick Decision Guide

**Choose t3.small if:**
- Budget < $25/month
- < 50 users
- Can tolerate slower builds
- Willing to add swap space

**Choose t3.medium if:**
- Budget $50-60/month
- 50-200 users
- Need reliable performance
- Production environment

**Choose t3.large if:**
- Budget $100+/month
- 200+ users
- High traffic expected
- Enterprise requirements

---

**Need help deciding? Run the deployment script and monitor performance for a week, then adjust!**
