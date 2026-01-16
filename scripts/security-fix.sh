#!/bin/bash
# MoreStars Security Remediation Script
# Run this script to fix credential exposure issues

set -e

echo "========================================"
echo "MoreStars Security Remediation Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="/Users/kk/Dropbox/KREAKTIVE LLC/MoreStars.io/Website/MoreStars V01"
SECRETS_DIR="$HOME/.morestars-secrets"

# Phase 1: Create secure secrets directory
echo -e "${CYAN}Phase 1: Creating secure secrets directory...${NC}"
echo ""

if [ -d "$SECRETS_DIR" ]; then
    echo -e "${YELLOW}! Secrets directory already exists: $SECRETS_DIR${NC}"
else
    mkdir -p "$SECRETS_DIR"
    chmod 700 "$SECRETS_DIR"
    echo -e "${GREEN}✓ Created secure directory: $SECRETS_DIR${NC}"
fi

# Phase 2: Backup current .env files
echo ""
echo -e "${CYAN}Phase 2: Backing up current .env files...${NC}"
echo ""

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

if [ -f "$PROJECT_DIR/.env" ]; then
    cp "$PROJECT_DIR/.env" "$SECRETS_DIR/.env.backup.$BACKUP_DATE"
    chmod 600 "$SECRETS_DIR/.env.backup.$BACKUP_DATE"
    echo -e "${GREEN}✓ Backed up .env to $SECRETS_DIR/.env.backup.$BACKUP_DATE${NC}"
fi

if [ -f "$PROJECT_DIR/.env.production" ]; then
    cp "$PROJECT_DIR/.env.production" "$SECRETS_DIR/.env.production.backup.$BACKUP_DATE"
    chmod 600 "$SECRETS_DIR/.env.production.backup.$BACKUP_DATE"
    echo -e "${GREEN}✓ Backed up .env.production${NC}"
fi

# Phase 3: Generate new secrets
echo ""
echo -e "${CYAN}Phase 3: Generating new local secrets...${NC}"
echo ""

NEW_SESSION_SECRET=$(openssl rand -hex 32)
NEW_API_SECRET=$(openssl rand -hex 32)
NEW_POS_KEY=$(openssl rand -hex 16)

echo -e "${GREEN}New secrets generated:${NC}"
echo ""
echo -e "SESSION_SECRET=${YELLOW}$NEW_SESSION_SECRET${NC}"
echo ""
echo -e "API_SECRET=${YELLOW}$NEW_API_SECRET${NC}"
echo ""
echo -e "POS_TOKEN_ENCRYPTION_KEY=${YELLOW}$NEW_POS_KEY${NC}"
echo ""

# Save to file for reference
cat > "$SECRETS_DIR/new-secrets-$BACKUP_DATE.txt" << EOF
# New secrets generated on $(date)
# SAVE THESE SECURELY AND DELETE THIS FILE AFTER USE

SESSION_SECRET=$NEW_SESSION_SECRET
API_SECRET=$NEW_API_SECRET
POS_TOKEN_ENCRYPTION_KEY=$NEW_POS_KEY

# You still need to manually rotate:
# - Stripe keys (dashboard.stripe.com)
# - Twilio credentials (console.twilio.com)
# - Resend API key (resend.com)
# - reCAPTCHA keys (google.com/recaptcha/admin)
# - Square credentials (developer.squareup.com)
# - Shopify credentials (partners.shopify.com)
# - Database password (on production server)
EOF
chmod 600 "$SECRETS_DIR/new-secrets-$BACKUP_DATE.txt"
echo -e "${GREEN}✓ Saved new secrets to $SECRETS_DIR/new-secrets-$BACKUP_DATE.txt${NC}"

# Phase 4: Fix file permissions
echo ""
echo -e "${CYAN}Phase 4: Fixing file permissions...${NC}"
echo ""

if [ -f "$PROJECT_DIR/.env" ]; then
    chmod 600 "$PROJECT_DIR/.env"
    echo -e "${GREEN}✓ Fixed .env permissions (600)${NC}"
fi

if [ -f "$PROJECT_DIR/.env.production" ]; then
    chmod 600 "$PROJECT_DIR/.env.production"
    echo -e "${GREEN}✓ Fixed .env.production permissions (600)${NC}"
fi

# Phase 5: Fix hardcoded passwords in docs
echo ""
echo -e "${CYAN}Phase 5: Removing hardcoded passwords from documentation...${NC}"
echo ""

if [ -f "$PROJECT_DIR/docs/OPS.md" ]; then
    # Check if password exists
    if grep -q 'PGPASSWORD="NZGzDN' "$PROJECT_DIR/docs/OPS.md"; then
        # Replace hardcoded password with variable reference
        sed -i.bak 's/PGPASSWORD="NZGzDN\/hwXvVpR45Qv10nwd5myixCRbRU1OUlzKAygc="/PGPASSWORD="$DB_PASSWORD"/g' "$PROJECT_DIR/docs/OPS.md"
        echo -e "${GREEN}✓ Removed hardcoded DB password from docs/OPS.md${NC}"
        echo -e "${YELLOW}  Backup saved as docs/OPS.md.bak${NC}"
    else
        echo -e "${GREEN}✓ No hardcoded password found in docs/OPS.md${NC}"
    fi
else
    echo -e "${YELLOW}! docs/OPS.md not found${NC}"
fi

# Phase 6: Update .gitignore
echo ""
echo -e "${CYAN}Phase 6: Verifying .gitignore...${NC}"
echo ""

GITIGNORE="$PROJECT_DIR/.gitignore"
NEEDED_ENTRIES=(
    ".env"
    ".env.*"
    "!.env.example"
    "!.env.production.example"
    "*.pem"
    "*.key"
    "new-secrets-*.txt"
)

for entry in "${NEEDED_ENTRIES[@]}"; do
    if ! grep -qF "$entry" "$GITIGNORE" 2>/dev/null; then
        echo "$entry" >> "$GITIGNORE"
        echo -e "${GREEN}✓ Added '$entry' to .gitignore${NC}"
    fi
done

echo -e "${GREEN}✓ .gitignore verified${NC}"

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}Security fixes applied!${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}IMPORTANT: Manual steps still required:${NC}"
echo ""
echo "1. Rotate these credentials (use new values in production):"
echo "   - Stripe API keys: https://dashboard.stripe.com/apikeys"
echo "   - Stripe webhook secret: https://dashboard.stripe.com/webhooks"
echo "   - Twilio: https://console.twilio.com/"
echo "   - Resend: https://resend.com/api-keys"
echo "   - reCAPTCHA: https://www.google.com/recaptcha/admin"
echo "   - Square: https://developer.squareup.com/apps"
echo "   - Shopify: Shopify Partners Dashboard"
echo ""
echo "2. Change production database password:"
echo "   ssh root@morestars.io"
echo "   docker exec -it morestars_db_prod psql -U postgres"
echo "   ALTER USER morestars_user WITH PASSWORD 'new_password';"
echo ""
echo "3. Update production .env with all new credentials"
echo ""
echo "4. Apply code fixes (see SECURITY_REMEDIATION_PLAN.md)"
echo ""
echo "5. Restart production: docker compose down && docker compose up -d"
echo ""
echo -e "New secrets saved to: ${CYAN}$SECRETS_DIR/new-secrets-$BACKUP_DATE.txt${NC}"
echo -e "${RED}DELETE THIS FILE after copying secrets to production!${NC}"
echo ""
