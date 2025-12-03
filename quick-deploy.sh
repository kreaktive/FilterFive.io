#!/bin/bash
# Quick Deployment Script for Review Gating Removal
# This script uploads the package and triggers deployment on production

set -e

echo "🚀 FilterFive Quick Deployment"
echo "================================"
echo ""

# Configuration
DEPLOY_PACKAGE="/Users/kk/Dropbox/KREAKTIVE LLC/DMS Kreaktive/Production/FilterFive/filterfive-review-gating-FINAL-20251202.tar.gz"
PRODUCTION_SERVER="root@filterfive.io"
REMOTE_PATH="/root/"

# Check if deployment package exists
if [ ! -f "$DEPLOY_PACKAGE" ]; then
    echo "❌ Error: Deployment package not found at:"
    echo "   $DEPLOY_PACKAGE"
    exit 1
fi

echo "📦 Found deployment package:"
ls -lh "$DEPLOY_PACKAGE"
echo ""

# Confirm deployment
echo "⚠️  WARNING: This will deploy to PRODUCTION (filterfive.io)"
echo ""
read -p "Continue with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "📤 Step 1: Uploading package to production server..."
scp "$DEPLOY_PACKAGE" "$PRODUCTION_SERVER:$REMOTE_PATH"
echo "✓ Upload complete"
echo ""

echo "🚀 Step 2: Running deployment on production server..."
ssh "$PRODUCTION_SERVER" "cd /root/FilterFive && bash deploy-production.sh"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Verify at: https://filterfive.io/dashboard/settings"
echo "2. Configure Review Platform URL in Settings"
echo "3. Test SMS sending with new tones"
echo "4. Check logs: ssh $PRODUCTION_SERVER 'cd /root/FilterFive && docker compose logs -f app'"
echo ""
