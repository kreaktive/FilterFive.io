#!/bin/bash

# ============================================================================
# MoreStars Restore Script
# ============================================================================
#
# This script restores:
# - PostgreSQL database from backup
# - Redis data (optional)
# - Uploaded files (optional)
#
# Usage:
#   ./restore.sh --db /path/to/postgres_backup.sql.gz
#   ./restore.sh --all /path/to/backup/directory
#   ./restore.sh --list                              # List available backups
#   ./restore.sh --latest                            # Restore latest backup
#
# WARNING: This will OVERWRITE existing data!
#
# ============================================================================

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$APP_DIR/.env.production" ]; then
    source "$APP_DIR/.env.production"
elif [ -f "$APP_DIR/.env" ]; then
    source "$APP_DIR/.env"
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/morestars}"
DB_CONTAINER="${DB_CONTAINER:-morestars_db_prod}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

confirm() {
    read -p "Are you sure you want to proceed? This will OVERWRITE existing data! (yes/no): " response
    if [ "$response" != "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi
}

# ============================================================================
# Restore Functions
# ============================================================================

list_backups() {
    log_info "Available backups in $BACKUP_DIR:"
    echo ""
    echo "=== Daily Backups ==="
    ls -lh "$BACKUP_DIR/daily"/*.sql.gz 2>/dev/null || echo "No daily backups found"
    echo ""
    echo "=== Weekly Backups ==="
    ls -lh "$BACKUP_DIR/weekly"/*.sql.gz 2>/dev/null || echo "No weekly backups found"
    echo ""
    echo "=== Monthly Backups ==="
    ls -lh "$BACKUP_DIR/monthly"/*.sql.gz 2>/dev/null || echo "No monthly backups found"
}

get_latest_backup() {
    local latest=$(ls -t "$BACKUP_DIR/daily"/postgres_*.sql.gz 2>/dev/null | head -1)
    if [ -z "$latest" ]; then
        log_error "No backups found in $BACKUP_DIR/daily"
        exit 1
    fi
    echo "$latest"
}

restore_postgres() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi

    log_info "Restoring PostgreSQL from: $backup_file"

    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
        log_error "PostgreSQL container '$DB_CONTAINER' is not running"
        exit 1
    fi

    confirm

    # Stop the app to prevent connections during restore
    log_info "Stopping application..."
    docker compose -f "$APP_DIR/docker-compose.prod.yml" stop app || true

    # Restore database
    log_info "Restoring database..."
    gunzip -c "$backup_file" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"

    # Start the app
    log_info "Starting application..."
    docker compose -f "$APP_DIR/docker-compose.prod.yml" start app

    log_info "PostgreSQL restore complete"
}

restore_redis() {
    local backup_file="$1"
    local redis_container="${REDIS_CONTAINER:-morestars_redis_prod}"

    if [ ! -f "$backup_file" ]; then
        log_error "Redis backup file not found: $backup_file"
        return 1
    fi

    log_info "Restoring Redis from: $backup_file"
    confirm

    # Stop Redis
    docker compose -f "$APP_DIR/docker-compose.prod.yml" stop redis

    # Decompress and copy RDB file
    gunzip -c "$backup_file" > /tmp/dump.rdb
    docker cp /tmp/dump.rdb "$redis_container:/data/dump.rdb"
    rm -f /tmp/dump.rdb

    # Start Redis
    docker compose -f "$APP_DIR/docker-compose.prod.yml" start redis

    log_info "Redis restore complete"
}

restore_uploads() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        log_error "Uploads backup file not found: $backup_file"
        return 1
    fi

    log_info "Restoring uploads from: $backup_file"
    confirm

    # Extract to public directory
    tar -xzf "$backup_file" -C "$APP_DIR/public"

    log_info "Uploads restore complete"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    if [ $# -eq 0 ]; then
        echo "Usage: $0 [--db <file>] [--all <dir>] [--list] [--latest]"
        exit 1
    fi

    case "$1" in
        --list)
            list_backups
            ;;
        --latest)
            local latest=$(get_latest_backup)
            log_info "Latest backup: $latest"
            restore_postgres "$latest"
            ;;
        --db)
            if [ -z "${2:-}" ]; then
                log_error "Please specify backup file: --db /path/to/backup.sql.gz"
                exit 1
            fi
            restore_postgres "$2"
            ;;
        --all)
            if [ -z "${2:-}" ]; then
                log_error "Please specify backup directory: --all /path/to/backup/dir"
                exit 1
            fi
            local backup_dir="$2"

            # Find and restore each component
            local pg_file=$(ls -t "$backup_dir"/postgres_*.sql.gz 2>/dev/null | head -1)
            local redis_file=$(ls -t "$backup_dir"/redis_*.rdb.gz 2>/dev/null | head -1)
            local uploads_file=$(ls -t "$backup_dir"/uploads_*.tar.gz 2>/dev/null | head -1)

            [ -n "$pg_file" ] && restore_postgres "$pg_file"
            [ -n "$redis_file" ] && restore_redis "$redis_file"
            [ -n "$uploads_file" ] && restore_uploads "$uploads_file"
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
}

main "$@"
