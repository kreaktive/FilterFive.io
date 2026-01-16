# MoreStars Operations Manual (OPS.md)

> **Site Reliability Engineering Guide for VPS Deployment**

This document provides essential operational procedures for managing the MoreStars production environment on a VPS.

---

## 📋 Table of Contents

- [Server Information](#-server-information)
- [Access & Authentication](#-access--authentication)
- [Application Deployment](#-application-deployment)
- [Container Management](#-container-management)
- [Log Management](#-log-management)
- [Database Operations](#-database-operations)
- [SSL Certificate Management](#-ssl-certificate-management)
- [Backup & Restore](#-backup--restore)
- [Monitoring & Health Checks](#-monitoring--health-checks)
- [Troubleshooting](#-troubleshooting)
- [Emergency Procedures](#-emergency-procedures)

---

## 🖥 Server Information

### Production Environment

| Component | Value |
|-----------|-------|
| **Server IP** | `31.97.215.238` _(Replace with YOUR_SERVER_IP)_ |
| **Hostname** | `srv1161896.hstgr.cloud` |
| **Domain** | `morestars.io` (primary)<br>`www.morestars.io` (alias) |
| **OS** | Ubuntu 22.04 LTS |
| **User** | `root` |
| **Application Directory** | `/root/MoreStars` |
| **Backup Directory** | `/root/backups` |
| **Web Server** | Nginx (reverse proxy) |
| **SSL Provider** | Let's Encrypt |

### Container Names

- **Application:** `morestars_app_prod`
- **Database:** `morestars_db_prod`

---

## 🔐 Access & Authentication

### SSH Login

```bash
# Basic SSH access
ssh root@31.97.215.238

# Or using hostname
ssh root@srv1161896.hstgr.cloud

# With specific SSH key (if configured)
ssh -i ~/.ssh/morestars_prod root@31.97.215.238
```

### Initial Setup After Login

```bash
# Navigate to application directory
cd /root/MoreStars

# Verify you're in the correct directory
pwd
# Expected output: /root/MoreStars

# Check directory contents
ls -la
```

### Key File Locations

```
/root/MoreStars/              # Application root
├── .env.production            # Production environment variables (NEVER commit!)
├── docker-compose.prod.yml    # Production Docker config
├── deploy.sh                  # Automated deployment script
├── src/                       # Application source code
└── ...

/etc/nginx/
├── sites-available/morestars.io  # Nginx configuration
└── sites-enabled/morestars.io    # Symlink to config

/root/backups/                 # Database backups
└── backup.log                 # Backup script logs

/var/log/nginx/                # Nginx logs
├── access.log
└── error.log
```

---

## 🚀 Application Deployment

### Automated Deployment (Recommended)

The `deploy.sh` script handles the entire deployment process with validation checks.

```bash
# Step 1: Navigate to app directory
cd /root/MoreStars

# Step 2: Pull latest code from GitHub
git pull origin main

# Step 3: Run automated deployment script
chmod +x deploy.sh
./deploy.sh
```

**What `deploy.sh` does:**
1. ✅ Validates `.env.production` exists and contains required variables
2. ✅ Checks Docker and Docker Compose installation
3. ✅ Stops existing containers gracefully
4. ✅ Rebuilds and starts containers with new code
5. ✅ Waits for database readiness
6. ✅ Runs database migrations automatically
7. ✅ Optionally sets super admin (user ID 1)
8. ✅ Shows container status and recent logs

### Manual Deployment Steps

If you need to deploy manually without the script:

```bash
# 1. Navigate to app directory
cd /root/MoreStars

# 2. Pull latest changes
git pull origin main

# 3. Stop existing containers
docker compose -f docker-compose.prod.yml down

# 4. Rebuild and start containers
docker compose -f docker-compose.prod.yml up -d --build

# 5. Wait for database to be ready (10-15 seconds)
sleep 10

# 6. Run database migrations
docker exec morestars_app_prod npm run db:migrate

# 7. Verify containers are running
docker ps --filter "name=morestars"

# 8. Check application logs
docker logs --tail 50 morestars_app_prod
```

### Rollback to Previous Version

```bash
# 1. Check git history
git log --oneline -10

# 2. Rollback to specific commit
git reset --hard <commit-hash>

# 3. Redeploy
./deploy.sh
```

---

## 🐳 Container Management

### View Running Containers

```bash
# List all MoreStars containers
docker ps --filter "name=morestars"

# List all containers (including stopped)
docker ps -a

# Inspect specific container
docker inspect morestars_app_prod
```

### Start/Stop/Restart Containers

```bash
# Start all containers
docker compose -f docker-compose.prod.yml up -d

# Stop all containers (graceful shutdown)
docker compose -f docker-compose.prod.yml down

# Restart all containers
docker compose -f docker-compose.prod.yml restart

# Restart specific container
docker restart morestars_app_prod
docker restart morestars_db_prod

# Stop specific container
docker stop morestars_app_prod

# Start specific container
docker start morestars_app_prod
```

### Rebuild Containers

```bash
# Rebuild and restart (after code changes)
docker compose -f docker-compose.prod.yml up -d --build

# Force rebuild without cache
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Remove Containers (Caution!)

```bash
# Stop and remove containers (keeps volumes/data)
docker compose -f docker-compose.prod.yml down

# Stop and remove containers + volumes (DELETES DATABASE!)
# ⚠️ WARNING: This will delete all data!
docker compose -f docker-compose.prod.yml down -v
```

---

## 📊 Log Management

### View Live Application Logs

```bash
# View last 100 lines and follow (live tail)
docker compose -f docker-compose.prod.yml logs -f --tail=100

# View logs for specific container
docker logs -f --tail=100 morestars_app_prod
docker logs -f --tail=100 morestars_db_prod

# View logs without following
docker logs --tail=200 morestars_app_prod
```

### View Historical Logs

```bash
# View all logs (warning: can be very large)
docker logs morestars_app_prod

# View logs with timestamps
docker logs --timestamps morestars_app_prod

# View logs from specific time range
docker logs --since 2024-01-01T10:00:00 morestars_app_prod
docker logs --until 2024-01-01T12:00:00 morestars_app_prod

# Last hour of logs
docker logs --since 1h morestars_app_prod
```

### Export Logs to File

```bash
# Export application logs
docker logs morestars_app_prod > /root/logs/app_$(date +%Y%m%d_%H%M%S).log

# Export database logs
docker logs morestars_db_prod > /root/logs/db_$(date +%Y%m%d_%H%M%S).log
```

### Nginx Logs

```bash
# View Nginx access logs (live)
tail -f /var/log/nginx/access.log

# View Nginx error logs (live)
tail -f /var/log/nginx/error.log

# View last 100 lines of access log
tail -n 100 /var/log/nginx/access.log

# Search for specific IP address
grep "31.97.215.238" /var/log/nginx/access.log

# Search for 500 errors
grep "500" /var/log/nginx/error.log
```

---

## 🗄 Database Operations

### Access Database Shell

```bash
# Using docker-compose
docker compose -f docker-compose.prod.yml exec db psql -U morestars_prod_user -d morestars_prod

# Using docker exec directly
docker exec -it morestars_db_prod psql -U morestars_prod_user -d morestars_prod

# As postgres superuser
docker exec -it morestars_db_prod psql -U postgres -d morestars_prod
```

### Useful PostgreSQL Commands

Once inside the `psql` shell:

```sql
-- List all databases
\l

-- Connect to morestars_prod database
\c morestars_prod

-- List all tables
\dt

-- Describe table structure
\d Users
\d FeedbackRequests
\d Reviews

-- View all users
SELECT id, email, "businessName", role, "subscriptionStatus", "isActive" FROM "Users";

-- Count total feedback requests
SELECT COUNT(*) FROM "FeedbackRequests";

-- Count reviews by rating
SELECT rating, COUNT(*) FROM "Reviews" GROUP BY rating ORDER BY rating;

-- View recent feedback requests
SELECT id, "customerName", phone, status, "createdAt"
FROM "FeedbackRequests"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check database size
SELECT pg_size_pretty(pg_database_size('morestars_prod'));

-- Exit psql shell
\q
```

### Run SQL from Command Line

```bash
# Execute single SQL command
docker exec morestars_db_prod psql -U morestars_prod_user -d morestars_prod -c "SELECT COUNT(*) FROM \"Users\";"

# Execute SQL file
docker exec -i morestars_db_prod psql -U morestars_prod_user -d morestars_prod < query.sql
```

### Database Migrations

```bash
# Run migrations (sync models with database)
docker exec morestars_app_prod npm run db:migrate

# Verify migration completed successfully
docker exec morestars_app_prod npm run db:migrate
```

---

## 🔒 SSL Certificate Management

### Check Certificate Status

```bash
# View certificate details
sudo certbot certificates

# Test certificate renewal (dry run)
sudo certbot renew --dry-run

# Check certificate expiration
echo | openssl s_client -servername morestars.io -connect morestars.io:443 2>/dev/null | openssl x509 -noout -dates
```

### Manual Certificate Renewal

```bash
# Stop Nginx (required for standalone renewal)
sudo systemctl stop nginx

# Renew certificate manually
sudo certbot renew

# Or renew specific certificate
sudo certbot renew --cert-name morestars.io

# Start Nginx
sudo systemctl start nginx

# Verify Nginx is running
sudo systemctl status nginx
```

### Automatic Renewal

Let's Encrypt certificates auto-renew via cron job. To verify:

```bash
# Check if certbot timer is active (Ubuntu 22.04+)
sudo systemctl status certbot.timer

# View renewal cron job (older systems)
cat /etc/cron.d/certbot

# Test automatic renewal
sudo certbot renew --dry-run
```

### Force Certificate Renewal

If auto-renewal fails or you need to renew immediately:

```bash
# Force renewal (even if not expired)
sudo certbot renew --force-renewal

# Reload Nginx to apply new certificate
sudo systemctl reload nginx
```

### Troubleshoot SSL Issues

```bash
# Test SSL configuration
curl -I https://morestars.io

# Detailed SSL test
openssl s_client -connect morestars.io:443 -servername morestars.io

# Check Nginx SSL configuration
sudo nginx -t

# View Nginx SSL config
cat /etc/nginx/sites-available/morestars.io | grep ssl
```

---

## 💾 Backup & Restore

### Automated Backups

MoreStars uses an automated backup system with Google Drive sync.

**Backup Schedule:** Daily at 2:00 AM UTC

**Locations:**
- **Local:** `/root/backups/` (7-day retention)
- **Google Drive:** `MoreStars-Backups/` (unlimited retention)

### View Backup Status

```bash
# Check recent backups
ls -lh /root/backups/

# View backup log
tail -n 50 /root/backups/backup.log

# Check cron job status
crontab -l | grep backup

# Verify last backup time
ls -lt /root/backups/ | head -n 5
```

### Manual Database Backup

```bash
# Quick backup with timestamp
docker exec -e PGPASSWORD="$DB_PASSWORD" morestars_db_prod \
  pg_dump -U morestars_prod_user morestars_prod > /root/backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip /root/backups/manual_backup_*.sql

# Backup with custom filename
docker exec -e PGPASSWORD="$DB_PASSWORD" morestars_db_prod \
  pg_dump -U morestars_prod_user morestars_prod | gzip > /root/backups/pre-deployment-backup.sql.gz

# Run automated backup script manually
/root/backup-morestars.sh
```

### Restore Database from Backup

⚠️ **WARNING:** This will overwrite the current database!

```bash
# 1. Stop the application (prevents new data during restore)
docker stop morestars_app_prod

# 2. Extract backup if compressed
gunzip /root/backups/morestars_backup_20250128_020000.sql.gz

# 3. Restore database
docker exec -i -e PGPASSWORD="$DB_PASSWORD" morestars_db_prod \
  psql -U morestars_prod_user morestars_prod < /root/backups/morestars_backup_20250128_020000.sql

# 4. Start the application
docker start morestars_app_prod

# 5. Verify restore
docker exec morestars_app_prod npm run db:migrate
docker logs --tail 50 morestars_app_prod
```

### Download Backup to Local Machine

```bash
# From your local machine (not on VPS)
scp root@31.97.215.238:/root/backups/morestars_backup_20250128_020000.sql.gz ~/Downloads/
```

### Verify Backup Integrity

```bash
# Test backup file can be read
gunzip -t /root/backups/morestars_backup_20250128_020000.sql.gz

# Check backup file size (should be > 0 bytes)
ls -lh /root/backups/morestars_backup_20250128_020000.sql.gz

# Verify backup contains data (quick check)
gunzip -c /root/backups/morestars_backup_20250128_020000.sql.gz | head -n 50
```

---

## 📈 Monitoring & Health Checks

### Container Health Check

```bash
# Check container status
docker ps --filter "name=morestars"

# Check container health (if health check configured)
docker inspect --format='{{.State.Health.Status}}' morestars_app_prod

# View container resource usage
docker stats morestars_app_prod morestars_db_prod
```

### Application Health Check

```bash
# Test application is responding
curl -I http://localhost:3000

# Test HTTPS endpoint
curl -I https://morestars.io

# Test specific endpoint
curl https://morestars.io/dashboard/login

# Check application uptime
docker inspect --format='{{.State.StartedAt}}' morestars_app_prod
```

### Database Health Check

```bash
# Quick database connectivity test
docker exec morestars_db_prod pg_isready -U morestars_prod_user -d morestars_prod

# Check database connections
docker exec morestars_db_prod psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE datname='morestars_prod';"

# View active queries
docker exec morestars_db_prod psql -U postgres -c "SELECT pid, usename, state, query FROM pg_stat_activity WHERE datname='morestars_prod';"
```

### System Resource Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top -bn1 | head -n 20

# Check Docker disk usage
docker system df

# Clean up unused Docker resources (if needed)
docker system prune -a
```

### Nginx Health Check

```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# View Nginx process
ps aux | grep nginx

# Check Nginx is listening on ports 80/443
sudo netstat -tlnp | grep nginx
```

---

## 🔧 Troubleshooting

### Application Won't Start

```bash
# 1. Check logs for errors
docker logs --tail 100 morestars_app_prod

# 2. Verify environment variables
docker exec morestars_app_prod env | grep -E "(DB_|TWILIO_|RESEND_|SESSION_)"

# 3. Check database connection
docker exec morestars_app_prod npm run db:migrate

# 4. Restart container
docker restart morestars_app_prod

# 5. Rebuild if needed
docker compose -f docker-compose.prod.yml up -d --build morestars_app_prod
```

### Database Connection Issues

```bash
# 1. Check database container is running
docker ps --filter "name=morestars_db_prod"

# 2. Test database connectivity
docker exec morestars_db_prod pg_isready

# 3. Check database logs
docker logs --tail 100 morestars_db_prod

# 4. Verify database credentials in .env.production
cat .env.production | grep -E "(DB_|POSTGRES_)"

# 5. Restart database container
docker restart morestars_db_prod

# 6. Wait 10 seconds, then restart app
sleep 10
docker restart morestars_app_prod
```

### Can't Access Website

```bash
# 1. Check Nginx is running
sudo systemctl status nginx

# 2. Test Nginx configuration
sudo nginx -t

# 3. Check Nginx logs for errors
sudo tail -n 50 /var/log/nginx/error.log

# 4. Verify application is running
curl -I http://localhost:3000

# 5. Check firewall rules
sudo ufw status

# 6. Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Errors

```bash
# 1. Check certificate status
sudo certbot certificates

# 2. Test certificate renewal
sudo certbot renew --dry-run

# 3. View Nginx SSL configuration
cat /etc/nginx/sites-available/morestars.io | grep ssl

# 4. Test SSL certificate
curl -vI https://morestars.io

# 5. Renew certificate if expired
sudo certbot renew
sudo systemctl reload nginx
```

### Out of Disk Space

```bash
# 1. Check disk usage
df -h

# 2. Find large files
du -h / | sort -rh | head -n 20

# 3. Clean Docker resources
docker system prune -a

# 4. Remove old backups (keep last 7 days)
find /root/backups -name "morestars_backup_*.sql.gz" -mtime +7 -delete

# 5. Clean package cache
apt-get clean
```

### Session/Login Issues

```bash
# 1. Check NODE_ENV is set correctly
docker exec morestars_app_prod env | grep NODE_ENV

# 2. Verify SESSION_SECRET exists
docker exec morestars_app_prod env | grep SESSION_SECRET

# 3. Check app logs for session errors
docker logs --tail 100 morestars_app_prod | grep -i session

# 4. Clear browser cookies and try again

# 5. Restart app container
docker restart morestars_app_prod
```

### Performance Issues

```bash
# 1. Check resource usage
docker stats morestars_app_prod morestars_db_prod

# 2. Check database performance
docker exec morestars_db_prod psql -U postgres -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# 3. Check for slow queries
docker exec morestars_db_prod psql -U postgres -c "SELECT pid, now() - query_start as duration, query FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '5 seconds';"

# 4. Restart containers
docker compose -f docker-compose.prod.yml restart

# 5. Check system resources
htop  # or: top
```

---

## 🚨 Emergency Procedures

### Emergency Shutdown

```bash
# Stop all MoreStars containers immediately
docker compose -f docker-compose.prod.yml down

# Stop specific container
docker stop morestars_app_prod

# Kill unresponsive container
docker kill morestars_app_prod
```

### Emergency Database Backup

```bash
# Quick backup before risky operation
docker exec -e PGPASSWORD="$DB_PASSWORD" morestars_db_prod \
  pg_dump -U morestars_prod_user morestars_prod | gzip > /root/backups/emergency_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Verify backup was created
ls -lh /root/backups/emergency_backup_*.sql.gz
```

### Emergency Rollback

```bash
# 1. Navigate to app directory
cd /root/MoreStars

# 2. View recent commits
git log --oneline -10

# 3. Rollback to previous working commit
git reset --hard <previous-commit-hash>

# 4. Rebuild and deploy
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# 5. Verify application is working
curl -I https://morestars.io
```

### Emergency Contact

If you encounter critical issues that cannot be resolved:

1. **Take immediate backup:** `/root/backup-morestars.sh`
2. **Document the issue:** Screenshot errors, save logs
3. **Contact development team:** support@morestars.io
4. **Preserve evidence:** Don't delete logs until issue is resolved

---

## 📞 Quick Reference

### Most Common Commands

```bash
# SSH into server
ssh root@31.97.215.238

# Navigate to app
cd /root/MoreStars

# Deploy updates
git pull && ./deploy.sh

# View logs
docker logs -f --tail=100 morestars_app_prod

# Restart app
docker restart morestars_app_prod

# Access database
docker exec -it morestars_db_prod psql -U morestars_prod_user -d morestars_prod

# Manual backup
/root/backup-morestars.sh

# Check disk space
df -h
```

### Emergency Hotline

| Issue | Command |
|-------|---------|
| App crashed | `docker restart morestars_app_prod` |
| Database down | `docker restart morestars_db_prod` |
| Out of memory | `docker system prune -a` |
| SSL expired | `sudo certbot renew && sudo systemctl reload nginx` |
| Need backup NOW | `/root/backup-morestars.sh` |
| Total failure | `docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d` |

---

## 📝 Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-28 | Initial OPS.md created | SRE Team |
| - | - | - |

---

**Document maintained by:** MoreStars SRE Team
**Last updated:** 2025-01-28
**Version:** 1.0.0

For questions or updates to this document, contact: ops@morestars.io
