# FilterFive Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. VPS Requirements
- **OS**: Ubuntu 20.04+ or Debian 11+
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+

### 2. Domain & DNS
- Domain pointed to VPS IP address
- SSL certificate (Let's Encrypt recommended)
- Firewall configured (ports 80, 443, 22)

### 3. Third-Party Services
- Twilio account with verified Messaging Service
- Resend account with verified domain
- Stripe account (for future billing)

---

## 🚀 Initial VPS Setup

### 1. Connect to VPS
```bash
ssh root@your-vps-ip
```

### 2. Update System
```bash
apt update && apt upgrade -y
```

### 3. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 4. Install Docker Compose
```bash
apt install docker-compose-plugin -y
```

### 5. Create Application User
```bash
adduser filterfive
usermod -aG docker filterfive
su - filterfive
```

---

## 📦 Application Deployment

### 1. Clone Repository
```bash
cd ~
git clone <your-repo-url> filterfive-app
cd filterfive-app
```

### 2. Create Production Environment File
```bash
cp .env.example .env.production
nano .env.production
```

**Required Environment Variables:**
```bash
# Node Environment
NODE_ENV=production
PORT=3000

# Database (CHANGE THESE!)
DB_NAME=filterfive_prod
DB_USER=filterfive_prod_user
DB_PASSWORD=<STRONG_RANDOM_PASSWORD>

# Application
APP_URL=https://yourdomain.com
SESSION_SECRET=<STRONG_RANDOM_SECRET_64_CHARS>

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
TWILIO_MESSAGING_SERVICE_SID=MG...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=info@yourdomain.com

# Stripe (when ready)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Generate Strong Secrets:**
```bash
# Generate SESSION_SECRET
openssl rand -hex 32

# Generate DB_PASSWORD
openssl rand -base64 32
```

### 3. Build and Start Production Containers
```bash
# Using production docker-compose
docker-compose -f docker-compose.prod.yml up -d --build
```

### 4. Verify Containers are Running
```bash
docker ps
```

Expected output:
```
CONTAINER ID   IMAGE                    STATUS         PORTS
xxx            filterfive_app_prod      Up 2 minutes   0.0.0.0:3000->3000/tcp
xxx            postgres:15-alpine       Up 2 minutes   0.0.0.0:5433->5432/tcp
```

### 5. Run Database Migrations
```bash
docker exec filterfive_app_prod npm run db:migrate
```

### 6. Set Super Admin
```bash
docker exec filterfive_app_prod npm run set:superadmin
```

### 7. Verify Application is Running
```bash
curl http://localhost:3000
```

---

## 🔒 Nginx Reverse Proxy Setup

### 1. Install Nginx
```bash
sudo apt install nginx -y
```

### 2. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/filterfive
```

**Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Force HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Logging
    access_log /var/log/nginx/filterfive_access.log;
    error_log /var/log/nginx/filterfive_error.log;
}
```

### 3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/filterfive /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Install SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔄 Updating the Application

### 1. Pull Latest Code
```bash
cd ~/filterfive-app
git pull origin main
```

### 2. Rebuild and Restart
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. Run Any New Migrations
```bash
docker exec filterfive_app_prod npm run db:migrate
```

---

## 📊 Monitoring & Logs

### View Application Logs
```bash
# All logs
docker-compose -f docker-compose.prod.yml logs -f

# App only
docker logs -f filterfive_app_prod

# Database only
docker logs -f filterfive_db_prod
```

### Check Container Health
```bash
docker ps
docker stats
```

### Database Backup
```bash
# Create backup
docker exec filterfive_db_prod pg_dump -U filterfive_prod_user filterfive_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
cat backup_file.sql | docker exec -i filterfive_db_prod psql -U filterfive_prod_user -d filterfive_prod
```

---

## 🛡️ Security Hardening

### 1. Firewall Configuration
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. Fail2Ban (Prevent Brute Force)
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Auto-Updates
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 🔧 Troubleshooting

### Application Won't Start
```bash
# Check logs
docker logs filterfive_app_prod

# Check environment variables
docker exec filterfive_app_prod env

# Restart containers
docker-compose -f docker-compose.prod.yml restart
```

### Database Connection Issues
```bash
# Check database is running
docker exec filterfive_db_prod pg_isready -U filterfive_prod_user

# Access database shell
docker exec -it filterfive_db_prod psql -U filterfive_prod_user -d filterfive_prod
```

### Disk Space Issues
```bash
# Clean up old Docker images
docker system prune -a

# Check disk usage
df -h
```

---

## 📞 Support Contacts

- **Technical Issues**: your-email@domain.com
- **Infrastructure**: devops@domain.com
- **Emergency Hotline**: +1 (XXX) XXX-XXXX

---

## 📝 Deployment Checklist

- [ ] VPS provisioned and secured
- [ ] Docker and Docker Compose installed
- [ ] .env.production file configured with strong secrets
- [ ] Application deployed with docker-compose.prod.yml
- [ ] Database migrated
- [ ] Super admin account created
- [ ] Nginx configured as reverse proxy
- [ ] SSL certificate installed
- [ ] Firewall rules configured
- [ ] Monitoring and backup scripts in place
- [ ] DNS records pointing to VPS
- [ ] Application accessible via HTTPS
- [ ] Email alerts tested (Resend)
- [ ] SMS functionality tested (Twilio)
- [ ] First test tenant created and verified

---

**Last Updated**: November 2025
**Version**: 1.0.0
