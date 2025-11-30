#!/bin/bash
# FilterFive Production Deployment Script
# This script ensures clean deployment with updated environment variables

echo "🚀 FilterFive Production Deployment"
echo "===================================="
echo ""

# Check if on production server
if [ ! -d "/root/FilterFive" ]; then
    echo "❌ Error: /root/FilterFive directory not found."
    echo "This script should be run on the production server."
    exit 1
fi

cd /root/FilterFive

echo "📦 Step 1: Backup current production..."
BACKUP_FILE="FilterFive-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "/root/$BACKUP_FILE" . --exclude='node_modules' --exclude='*.tar*' 2>/dev/null
echo "✓ Backup created: /root/$BACKUP_FILE"
echo ""

echo "📥 Step 2: Extract new deployment package..."
# Find the most recent deployment tar file
DEPLOY_FILE=$(ls -t /root/filterfive-*.tar.gz 2>/dev/null | head -1)

if [ -z "$DEPLOY_FILE" ]; then
    echo "❌ Error: No deployment package found in /root/"
    echo "Please upload the deployment tar.gz file first."
    exit 1
fi

echo "Found: $DEPLOY_FILE"
tar -xzf "$DEPLOY_FILE" -C /root/FilterFive
echo "✓ Files extracted"
echo ""

echo "🧹 Step 3: Clean up macOS junk files..."
find . -name "._*" -delete 2>/dev/null
find . -name ".DS_Store" -delete 2>/dev/null
echo "✓ Cleaned up"
echo ""

echo "🔍 Step 4: Verify environment variables..."
if grep -q "STRIPE_PRICE_MONTHLY=price_1SZ1M3" .env; then
    echo "✓ Stripe price IDs are correct (live mode)"
else
    echo "⚠️  WARNING: Stripe price IDs may not be updated!"
    echo "Current STRIPE_PRICE_MONTHLY:"
    grep "STRIPE_PRICE_MONTHLY" .env
fi
echo ""

echo "🐳 Step 5: Rebuild Docker containers..."
docker compose down
echo "✓ Containers stopped"
echo ""

echo "Clearing Docker build cache..."
docker builder prune -af
echo "✓ Cache cleared"
echo ""

echo "Building new containers (this may take a few minutes)..."
docker compose build --no-cache --pull app
echo "✓ Containers built"
echo ""

echo "Starting containers..."
docker compose up -d
echo "✓ Containers started"
echo ""

echo "⏳ Waiting for application to start..."
sleep 5
echo ""

echo "📊 Step 6: Verify deployment..."
echo "Container status:"
docker compose ps
echo ""

echo "Checking logs for errors..."
docker compose logs --tail=20 app | grep -i "error\|✓\|Server running"
echo ""

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Check logs: docker compose logs -f app"
echo "2. Test subscription at: https://filterfive.io/dashboard/subscription"
echo "3. If issues persist, restore backup: tar -xzf /root/$BACKUP_FILE"
