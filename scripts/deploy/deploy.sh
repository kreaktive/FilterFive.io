#!/bin/bash

# FilterFive Production Deployment Script
# This script automates the deployment process on a VPS

set -e  # Exit on any error

echo "====================================="
echo "FilterFive Production Deployment"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}✗ Error: .env.production file not found${NC}"
    echo "  Please create it from .env.production.example"
    exit 1
fi

echo -e "${GREEN}✓ Found .env.production${NC}"

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Verify critical environment variables
REQUIRED_VARS=(
    "DB_NAME"
    "DB_USER"
    "DB_PASSWORD"
    "SESSION_SECRET"
    "TWILIO_ACCOUNT_SID"
    "RESEND_API_KEY"
    "APP_URL"
)

echo ""
echo "Checking required environment variables..."
MISSING_VARS=()

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        MISSING_VARS+=("$VAR")
        echo -e "${RED}✗ Missing: $VAR${NC}"
    else
        echo -e "${GREEN}✓ Found: $VAR${NC}"
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo ""
    echo -e "${RED}✗ Error: Missing required environment variables${NC}"
    echo "  Please set the following in .env.production:"
    for VAR in "${MISSING_VARS[@]}"; do
        echo "    - $VAR"
    done
    exit 1
fi

echo ""
echo -e "${GREEN}✓ All required environment variables are set${NC}"

# Check if Docker is installed
echo ""
echo "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "  Install it with: curl -fsSL https://get.docker.com | sh"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Ask for confirmation
echo ""
echo -e "${YELLOW}Ready to deploy FilterFive to production${NC}"
echo "  Environment: $NODE_ENV"
echo "  App URL: $APP_URL"
echo "  Database: $DB_NAME"
echo ""
read -p "Continue with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Stop existing containers (if any)
echo ""
echo "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Build and start containers
echo ""
echo "Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for database to be ready
echo ""
echo "Waiting for database to be ready..."
sleep 10

# Run database migrations
echo ""
echo "Running database migrations..."
docker exec filterfive_app_prod npm run db:migrate

# Check if we need to create super admin
echo ""
read -p "Do you want to set user ID 1 as super admin? (yes/no): " CREATE_ADMIN

if [ "$CREATE_ADMIN" = "yes" ]; then
    echo "Setting super admin..."
    docker exec filterfive_app_prod npm run set:superadmin
fi

# Show container status
echo ""
echo "Container Status:"
docker ps --filter "name=filterfive"

# Show application logs
echo ""
echo "Recent Application Logs:"
docker logs --tail 20 filterfive_app_prod

echo ""
echo -e "${GREEN}====================================="
echo "✓ Deployment Complete!"
echo "=====================================${NC}"
echo ""
echo "Application Details:"
echo "  - App URL: $APP_URL"
echo "  - Local URL: http://localhost:3000"
echo "  - Database: $DB_NAME"
echo ""
echo "Next Steps:"
echo "  1. Configure Nginx reverse proxy (see DEPLOYMENT.md)"
echo "  2. Install SSL certificate"
echo "  3. Configure firewall"
echo "  4. Set up monitoring and backups"
echo ""
echo "Useful Commands:"
echo "  - View logs: docker logs -f filterfive_app_prod"
echo "  - Restart: docker-compose -f docker-compose.prod.yml restart"
echo "  - Stop: docker-compose -f docker-compose.prod.yml down"
echo ""
