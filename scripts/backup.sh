#!/bin/bash

# ============================================================================
# MoreStars Automated Backup Script
# ============================================================================
#
# This script backs up:
# - PostgreSQL database
# - Redis data
# - Uploaded files
# - Application logs
#
# Destinations:
# - Local: /var/backups/morestars/
# - S3: s3://morestars-backups/ (if configured)
# - Google Drive: (via rclone, if configured)
#
# Usage:
#   ./backup.sh              # Run full backup
#   ./backup.sh --db-only    # Database only
#   ./backup.sh --dry-run    # Show what would be backed up
#
# Setup:
#   1. chmod +x backup.sh
#   2. Create .env.backup with credentials
#   3. Install rclone for cloud backups: curl https://rclone.org/install.sh | sudo bash
#   4. Add to cron: 0 2 * * * /path/to/backup.sh >> /var/log/morestars-backup.log 2>&1
#
# ============================================================================

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE=$(date +"%Y-%m-%d")

# Load environment variables
if [ -f "$APP_DIR/.env.production" ]; then
    source "$APP_DIR/.env.production"
elif [ -f "$APP_DIR/.env" ]; then
    source "$APP_DIR/.env"
fi

# Load backup-specific config if exists
if [ -f "$APP_DIR/.env.backup" ]; then
    source "$APP_DIR/.env.backup"
fi

# Backup settings
BACKUP_DIR="${BACKUP_DIR:-/var/backups/morestars}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# S3 settings (optional)
S3_BUCKET="${S3_BUCKET:-}"
S3_REGION="${S3_REGION:-us-east-1}"

# Google Drive settings (via rclone, optional)
RCLONE_REMOTE="${RCLONE_REMOTE:-}"

# Docker settings
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
DB_CONTAINER="${DB_CONTAINER:-morestars_db_prod}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

check_dependencies() {
    local missing=()

    if ! command -v docker &> /dev/null; then
        missing+=("docker")
    fi

    if ! command -v gzip &> /dev/null; then
        missing+=("gzip")
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing[*]}"
        exit 1
    fi
}

create_backup_dir() {
    mkdir -p "$BACKUP_DIR/daily"
    mkdir -p "$BACKUP_DIR/weekly"
    mkdir -p "$BACKUP_DIR/monthly"
}

# ============================================================================
# Backup Functions
# ============================================================================

backup_postgres() {
    log_info "Backing up PostgreSQL database..."

    local backup_file="$BACKUP_DIR/daily/postgres_${TIMESTAMP}.sql.gz"

    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
        log_error "PostgreSQL container '$DB_CONTAINER' is not running"
        return 1
    fi

    # Create backup using pg_dump inside container
    docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" \
        --no-owner --no-acl --clean --if-exists \
        | gzip > "$backup_file"

    local size=$(du -h "$backup_file" | cut -f1)
    log_info "PostgreSQL backup created: $backup_file ($size)"

    echo "$backup_file"
}

backup_redis() {
    log_info "Backing up Redis data..."

    local backup_file="$BACKUP_DIR/daily/redis_${TIMESTAMP}.rdb.gz"
    local redis_container="${REDIS_CONTAINER:-morestars_redis_prod}"

    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${redis_container}$"; then
        log_warn "Redis container '$redis_container' is not running, skipping"
        return 0
    fi

    # Trigger BGSAVE and wait for completion
    docker exec "$redis_container" redis-cli BGSAVE
    sleep 2

    # Copy RDB file from container
    docker cp "$redis_container:/data/dump.rdb" - | gzip > "$backup_file"

    local size=$(du -h "$backup_file" | cut -f1)
    log_info "Redis backup created: $backup_file ($size)"

    echo "$backup_file"
}

backup_uploads() {
    log_info "Backing up uploaded files..."

    local backup_file="$BACKUP_DIR/daily/uploads_${TIMESTAMP}.tar.gz"
    local uploads_dir="$APP_DIR/public/uploads"

    if [ ! -d "$uploads_dir" ]; then
        log_warn "Uploads directory not found: $uploads_dir"
        return 0
    fi

    tar -czf "$backup_file" -C "$APP_DIR/public" uploads

    local size=$(du -h "$backup_file" | cut -f1)
    log_info "Uploads backup created: $backup_file ($size)"

    echo "$backup_file"
}

backup_logs() {
    log_info "Backing up application logs..."

    local backup_file="$BACKUP_DIR/daily/logs_${TIMESTAMP}.tar.gz"
    local logs_dir="$APP_DIR/logs"

    if [ ! -d "$logs_dir" ]; then
        log_warn "Logs directory not found: $logs_dir"
        return 0
    fi

    tar -czf "$backup_file" -C "$APP_DIR" logs

    local size=$(du -h "$backup_file" | cut -f1)
    log_info "Logs backup created: $backup_file ($size)"

    echo "$backup_file"
}

backup_env() {
    log_info "Backing up environment configuration..."

    local backup_file="$BACKUP_DIR/daily/env_${TIMESTAMP}.tar.gz.enc"
    local temp_file=$(mktemp)

    # Create tarball of env files
    tar -czf "$temp_file" -C "$APP_DIR" \
        --exclude='.env.example' \
        --exclude='.env.*.example' \
        .env .env.production .env.staging 2>/dev/null || true

    # Encrypt with openssl (uses SESSION_SECRET as key)
    if [ -n "${SESSION_SECRET:-}" ]; then
        openssl enc -aes-256-cbc -salt -pbkdf2 \
            -in "$temp_file" \
            -out "$backup_file" \
            -pass pass:"$SESSION_SECRET"
        rm -f "$temp_file"
        log_info "Environment backup created (encrypted): $backup_file"
    else
        mv "$temp_file" "${backup_file%.enc}"
        backup_file="${backup_file%.enc}"
        log_warn "Environment backup created (unencrypted - no SESSION_SECRET): $backup_file"
    fi

    echo "$backup_file"
}

# ============================================================================
# Cloud Upload Functions
# ============================================================================

upload_to_s3() {
    local file="$1"

    if [ -z "$S3_BUCKET" ]; then
        log_info "S3 bucket not configured, skipping S3 upload"
        return 0
    fi

    if ! command -v aws &> /dev/null; then
        log_warn "AWS CLI not installed, skipping S3 upload"
        return 0
    fi

    local filename=$(basename "$file")
    local s3_path="s3://${S3_BUCKET}/${DATE}/${filename}"

    log_info "Uploading to S3: $s3_path"
    aws s3 cp "$file" "$s3_path" --region "$S3_REGION"
    log_info "S3 upload complete"
}

upload_to_gdrive() {
    local file="$1"

    if [ -z "$RCLONE_REMOTE" ]; then
        log_info "Google Drive not configured, skipping"
        return 0
    fi

    if ! command -v rclone &> /dev/null; then
        log_warn "rclone not installed, skipping Google Drive upload"
        return 0
    fi

    local filename=$(basename "$file")
    local gdrive_path="${RCLONE_REMOTE}:morestars-backups/${DATE}/${filename}"

    log_info "Uploading to Google Drive: $gdrive_path"
    rclone copy "$file" "${RCLONE_REMOTE}:morestars-backups/${DATE}/"
    log_info "Google Drive upload complete"
}

upload_to_hostinger() {
    local file="$1"

    # Hostinger backups stay local on the VPS
    # This function is for documentation/completeness
    # The local backup IS the Hostinger backup

    log_info "Local backup serves as Hostinger backup: $file"
}

# ============================================================================
# Maintenance Functions
# ============================================================================

cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."

    find "$BACKUP_DIR/daily" -type f -mtime +$RETENTION_DAYS -delete

    log_info "Cleanup complete"
}

create_weekly_backup() {
    # Create weekly backup on Sundays
    if [ "$(date +%u)" -eq 7 ]; then
        log_info "Creating weekly backup..."
        local weekly_dir="$BACKUP_DIR/weekly"

        # Copy today's backup as weekly
        cp "$BACKUP_DIR/daily/postgres_${TIMESTAMP}.sql.gz" \
           "$weekly_dir/postgres_week_$(date +%Y%W).sql.gz" 2>/dev/null || true

        # Keep 4 weeks of weekly backups
        find "$weekly_dir" -type f -mtime +28 -delete
    fi
}

create_monthly_backup() {
    # Create monthly backup on 1st of month
    if [ "$(date +%d)" -eq "01" ]; then
        log_info "Creating monthly backup..."
        local monthly_dir="$BACKUP_DIR/monthly"

        # Copy today's backup as monthly
        cp "$BACKUP_DIR/daily/postgres_${TIMESTAMP}.sql.gz" \
           "$monthly_dir/postgres_month_$(date +%Y%m).sql.gz" 2>/dev/null || true

        # Keep 12 months of monthly backups
        find "$monthly_dir" -type f -mtime +365 -delete
    fi
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    local db_only=false
    local dry_run=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --db-only)
                db_only=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    log_info "=========================================="
    log_info "MoreStars Backup Starting"
    log_info "=========================================="
    log_info "Timestamp: $TIMESTAMP"
    log_info "Backup directory: $BACKUP_DIR"

    if [ "$dry_run" = true ]; then
        log_info "DRY RUN - No backups will be created"
        log_info "Would backup: PostgreSQL, Redis, Uploads, Logs, Env"
        exit 0
    fi

    check_dependencies
    create_backup_dir

    local backup_files=()

    # PostgreSQL backup (always run)
    if pg_file=$(backup_postgres); then
        backup_files+=("$pg_file")
    fi

    if [ "$db_only" = false ]; then
        # Redis backup
        if redis_file=$(backup_redis); then
            backup_files+=("$redis_file")
        fi

        # Uploads backup
        if uploads_file=$(backup_uploads); then
            backup_files+=("$uploads_file")
        fi

        # Logs backup
        if logs_file=$(backup_logs); then
            backup_files+=("$logs_file")
        fi

        # Environment backup (encrypted)
        if env_file=$(backup_env); then
            backup_files+=("$env_file")
        fi
    fi

    # Upload to cloud destinations
    for file in "${backup_files[@]}"; do
        if [ -f "$file" ]; then
            upload_to_s3 "$file"
            upload_to_gdrive "$file"
            upload_to_hostinger "$file"
        fi
    done

    # Maintenance
    cleanup_old_backups
    create_weekly_backup
    create_monthly_backup

    log_info "=========================================="
    log_info "MoreStars Backup Complete"
    log_info "=========================================="
}

main "$@"
