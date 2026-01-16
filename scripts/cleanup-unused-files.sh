#!/bin/bash
# MoreStars Cleanup Script
# Removes unused files identified in project analysis

set -e

echo "========================================"
echo "MoreStars Root Folder Cleanup Script"
echo "========================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Calculate space before cleanup
echo "Calculating current disk usage..."
BEFORE_SIZE=$(du -sh . 2>/dev/null | cut -f1)
echo "Current project size: $BEFORE_SIZE"
echo ""

# List files to be deleted
echo -e "${YELLOW}Files and folders to be DELETED:${NC}"
echo ""
echo "=== Empty/Orphan Directories ==="
echo "  - FilterFive.io-V3/ (empty git repo)"
echo "  - MoreStars-V01/ (empty git repo)"
echo "  - Source Code MoreStars/ (old React code, not used)"
echo ""
echo "=== Old FilterFive Remnants ==="
echo "  - filterfive (old nginx config)"
echo "  - filterfive-app-20251129-182657.tar (77MB backup)"
echo "  - filterfive-architecture.mermaid"
echo "  - filterfive-login-fix.bundle"
echo "  - filterfive-update.bundle"
echo "  - qr-dashboard.bundle"
echo "  - qr-feature-deploy.bundle"
echo "  - qr-hotfix.bundle"
echo ""
echo "=== Empty/One-Time SQL Files ==="
echo "  - backup_before_qr_20251128_233616.sql (empty)"
echo "  - backup_before_qr_20251128_233632.sql (empty)"
echo "  - qr_migration.sql (already applied)"
echo "  - update_users.sql (already applied)"
echo "  - create-analytics-tables.sql (already applied)"
echo ""
echo "=== One-Time Setup/Data Files ==="
echo "  - create-stripe-prices.js"
echo "  - setup-stripe-live.js"
echo "  - list-stripe-prices.js"
echo "  - products csv stripe.csv"
echo "  - prices-stripe-production.csv"
echo "  - stripe_prices.csv"
echo "  - sample-customers.csv"
echo ""
echo "=== Backup/Temp Files ==="
echo "  - .!50759!.DS_Store"
echo "  - .env.backup"
echo "  - .env.backup-20251130-013804"
echo "  - shopify.app.filterfive-v2.toml"
echo ""

# Confirmation
echo -e "${RED}WARNING: This will permanently delete the above files!${NC}"
read -p "Do you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Starting cleanup..."
echo ""

# Function to safely remove files/directories
safe_remove() {
    local path="$1"
    if [ -e "$path" ]; then
        rm -rf "$path"
        echo -e "${GREEN}✓ Deleted:${NC} $path"
    else
        echo -e "${YELLOW}⚠ Not found:${NC} $path"
    fi
}

# Delete empty/orphan directories
echo "=== Removing Empty/Orphan Directories ==="
safe_remove "FilterFive.io-V3"
safe_remove "MoreStars-V01"
safe_remove "Source Code MoreStars"

# Delete old FilterFive remnants
echo ""
echo "=== Removing Old FilterFive Remnants ==="
safe_remove "filterfive"
safe_remove "filterfive-app-20251129-182657.tar"
safe_remove "filterfive-architecture.mermaid"
safe_remove "filterfive-login-fix.bundle"
safe_remove "filterfive-update.bundle"
safe_remove "qr-dashboard.bundle"
safe_remove "qr-feature-deploy.bundle"
safe_remove "qr-hotfix.bundle"

# Delete SQL files
echo ""
echo "=== Removing SQL Files ==="
safe_remove "backup_before_qr_20251128_233616.sql"
safe_remove "backup_before_qr_20251128_233632.sql"
safe_remove "qr_migration.sql"
safe_remove "update_users.sql"
safe_remove "create-analytics-tables.sql"

# Delete one-time setup/data files
echo ""
echo "=== Removing One-Time Setup/Data Files ==="
safe_remove "create-stripe-prices.js"
safe_remove "setup-stripe-live.js"
safe_remove "list-stripe-prices.js"
safe_remove "products csv stripe.csv"
safe_remove "prices-stripe-production.csv"
safe_remove "stripe_prices.csv"
safe_remove "sample-customers.csv"

# Delete backup/temp files
echo ""
echo "=== Removing Backup/Temp Files ==="
safe_remove ".!50759!.DS_Store"
safe_remove ".env.backup"
safe_remove ".env.backup-20251130-013804"
safe_remove "shopify.app.filterfive-v2.toml"

# Calculate space after cleanup
echo ""
echo "========================================"
AFTER_SIZE=$(du -sh . 2>/dev/null | cut -f1)
echo -e "${GREEN}Cleanup complete!${NC}"
echo ""
echo "Size before: $BEFORE_SIZE"
echo "Size after:  $AFTER_SIZE"
echo ""

# Optional: Reorganize files
echo "========================================"
echo -e "${YELLOW}Optional: Reorganize remaining files?${NC}"
echo ""
echo "This will:"
echo "  - Move AUDIT_TODO.md, HOLISTIC_AUDIT_PLAN.md, OPS.md to docs/"
echo "  - Move Resources/ logos to public/images/"
echo "  - Create tests/ folder and move test-*.js files there"
echo ""
read -p "Reorganize files? (yes/no): " REORG

if [ "$REORG" = "yes" ]; then
    echo ""
    echo "Reorganizing..."

    # Move markdown docs
    if [ -f "AUDIT_TODO.md" ]; then
        mv "AUDIT_TODO.md" "docs/"
        echo -e "${GREEN}✓ Moved:${NC} AUDIT_TODO.md -> docs/"
    fi
    if [ -f "HOLISTIC_AUDIT_PLAN.md" ]; then
        mv "HOLISTIC_AUDIT_PLAN.md" "docs/"
        echo -e "${GREEN}✓ Moved:${NC} HOLISTIC_AUDIT_PLAN.md -> docs/"
    fi
    if [ -f "OPS.md" ]; then
        mv "OPS.md" "docs/"
        echo -e "${GREEN}✓ Moved:${NC} OPS.md -> docs/"
    fi

    # Move Resources logos to public/images
    if [ -d "Resources" ]; then
        mkdir -p "public/images"
        if [ -f "Resources/Logo MoreStars.io.png" ]; then
            mv "Resources/Logo MoreStars.io.png" "public/images/"
            echo -e "${GREEN}✓ Moved:${NC} Logo MoreStars.io.png -> public/images/"
        fi
        if [ -f "Resources/Logo MoreStars.io.svg" ]; then
            mv "Resources/Logo MoreStars.io.svg" "public/images/"
            echo -e "${GREEN}✓ Moved:${NC} Logo MoreStars.io.svg -> public/images/"
        fi
        # Remove Resources folder if empty
        rmdir "Resources" 2>/dev/null && echo -e "${GREEN}✓ Removed:${NC} empty Resources/"
    fi

    # Create tests folder and move test files
    mkdir -p "tests"
    for testfile in test-*.js; do
        if [ -f "$testfile" ]; then
            mv "$testfile" "tests/"
            echo -e "${GREEN}✓ Moved:${NC} $testfile -> tests/"
        fi
    done

    echo ""
    echo -e "${GREEN}Reorganization complete!${NC}"
fi

echo ""
echo "========================================"
echo "Done! Your project root is now clean."
echo "========================================"
