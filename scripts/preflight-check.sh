#!/bin/bash
#
# MoreStars Preflight Check Script
# Run before deployments or payments to verify all systems are operational
#
# Usage: ./scripts/preflight-check.sh [--production|--local]
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default to production
TARGET="${1:-production}"
PROD_URL="https://app.morestars.io"
LOCAL_URL="http://localhost:3000"

if [ "$TARGET" == "--local" ]; then
  BASE_URL="$LOCAL_URL"
  echo -e "${BLUE}Running preflight checks against LOCAL (${BASE_URL})${NC}"
else
  BASE_URL="$PROD_URL"
  echo -e "${BLUE}Running preflight checks against PRODUCTION (${BASE_URL})${NC}"
fi

echo ""
echo "========================================"
echo "  MORESTARS PREFLIGHT CHECK"
echo "  $(date)"
echo "========================================"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

# Helper function to print results
print_result() {
  local name="$1"
  local status="$2"
  local details="$3"

  if [ "$status" == "PASS" ]; then
    echo -e "${GREEN}✅ $name${NC}"
    [ -n "$details" ] && echo -e "   ${details}"
    PASS_COUNT=$((PASS_COUNT + 1))
  elif [ "$status" == "WARN" ]; then
    echo -e "${YELLOW}⚠️  $name${NC}"
    [ -n "$details" ] && echo -e "   ${details}"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo -e "${RED}❌ $name${NC}"
    [ -n "$details" ] && echo -e "   ${details}"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

# ============================================
# TEST 1: App Health
# ============================================
echo -e "${BLUE}[1/6] App Health${NC}"
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/health" 2>/dev/null || echo '{"status":"error"}')
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status' 2>/dev/null || echo "error")

if [ "$HEALTH_STATUS" == "ok" ]; then
  UPTIME=$(echo "$HEALTH_RESPONSE" | jq -r '.uptime' 2>/dev/null)
  print_result "App Health" "PASS" "Status: ok, Uptime: ${UPTIME}s"
else
  print_result "App Health" "FAIL" "Status: $HEALTH_STATUS"
fi

# ============================================
# TEST 2: Database (via preflight endpoint)
# ============================================
echo ""
echo -e "${BLUE}[2/6] Database Connectivity${NC}"

if [ "$TARGET" == "--local" ]; then
  PREFLIGHT=$(curl -s --max-time 10 "${BASE_URL}/health/preflight" 2>/dev/null || echo '{}')
else
  # For production, try direct first (Cloudflare may cache 404s)
  PREFLIGHT=$(curl -s --max-time 10 "${BASE_URL}/health/preflight" 2>/dev/null)

  # If empty or error, try via SSH
  if [ -z "$PREFLIGHT" ] || [ "$PREFLIGHT" == "{}" ]; then
    PREFLIGHT=$(ssh -o ConnectTimeout=10 -i ~/.ssh/filterfive_ed25519 root@31.97.215.238 "curl -s http://localhost:3000/health/preflight" 2>/dev/null || echo '{}')
  fi
fi

DB_STATUS=$(echo "$PREFLIGHT" | jq -r '.checks.database.status' 2>/dev/null || echo "error")
DB_LATENCY=$(echo "$PREFLIGHT" | jq -r '.checks.database.latencyMs' 2>/dev/null || echo "?")

if [ "$DB_STATUS" == "ok" ]; then
  print_result "Database" "PASS" "Status: ok, Latency: ${DB_LATENCY}ms"
else
  DB_ERROR=$(echo "$PREFLIGHT" | jq -r '.checks.database.error' 2>/dev/null || echo "Unknown")
  print_result "Database" "FAIL" "Error: $DB_ERROR"
fi

# ============================================
# TEST 3: Stripe Configuration
# ============================================
echo ""
echo -e "${BLUE}[3/6] Stripe Configuration${NC}"
STRIPE_STATUS=$(echo "$PREFLIGHT" | jq -r '.checks.stripe.status' 2>/dev/null || echo "error")
STRIPE_MODE=$(echo "$PREFLIGHT" | jq -r '.checks.stripe.mode' 2>/dev/null || echo "unknown")

if [ "$STRIPE_STATUS" == "ok" ]; then
  if [ "$STRIPE_MODE" == "live" ]; then
    print_result "Stripe API" "PASS" "Mode: LIVE"
  else
    print_result "Stripe API" "WARN" "Mode: TEST (not live)"
  fi
else
  STRIPE_ERROR=$(echo "$PREFLIGHT" | jq -r '.checks.stripe.error' 2>/dev/null || echo "Unknown")
  print_result "Stripe API" "FAIL" "Error: $STRIPE_ERROR"
fi

# ============================================
# TEST 4: Twilio/SMS Service
# ============================================
echo ""
echo -e "${BLUE}[4/6] SMS Service (Twilio)${NC}"
TWILIO_STATUS=$(echo "$PREFLIGHT" | jq -r '.checks.twilio.status' 2>/dev/null || echo "error")
TWILIO_CIRCUIT=$(echo "$PREFLIGHT" | jq -r '.checks.twilio.circuit' 2>/dev/null || echo "unknown")

if [ "$TWILIO_STATUS" == "ok" ]; then
  print_result "Twilio SMS" "PASS" "Circuit: $TWILIO_CIRCUIT"
elif [ "$TWILIO_STATUS" == "degraded" ]; then
  print_result "Twilio SMS" "WARN" "Circuit: $TWILIO_CIRCUIT (degraded)"
else
  TWILIO_ERROR=$(echo "$PREFLIGHT" | jq -r '.checks.twilio.error' 2>/dev/null || echo "Unknown")
  print_result "Twilio SMS" "FAIL" "Error: $TWILIO_ERROR"
fi

# ============================================
# TEST 5: Email Service (Resend)
# ============================================
echo ""
echo -e "${BLUE}[5/6] Email Service (Resend)${NC}"
RESEND_STATUS=$(echo "$PREFLIGHT" | jq -r '.checks.resend.status' 2>/dev/null || echo "error")
RESEND_FROM=$(echo "$PREFLIGHT" | jq -r '.checks.resend.from' 2>/dev/null || echo "unknown")

if [ "$RESEND_STATUS" == "ok" ]; then
  print_result "Resend Email" "PASS" "From: $RESEND_FROM"
else
  RESEND_ERROR=$(echo "$PREFLIGHT" | jq -r '.checks.resend.error' 2>/dev/null || echo "Unknown")
  print_result "Resend Email" "FAIL" "Error: $RESEND_ERROR"
fi

# ============================================
# TEST 6: Redis Cache
# ============================================
echo ""
echo -e "${BLUE}[6/6] Redis Cache${NC}"
REDIS_STATUS=$(echo "$PREFLIGHT" | jq -r '.checks.redis.status' 2>/dev/null || echo "error")

if [ "$REDIS_STATUS" == "ok" ]; then
  print_result "Redis Cache" "PASS" ""
elif [ "$REDIS_STATUS" == "degraded" ]; then
  REDIS_ERROR=$(echo "$PREFLIGHT" | jq -r '.checks.redis.error' 2>/dev/null || echo "Caching disabled")
  print_result "Redis Cache" "WARN" "$REDIS_ERROR"
else
  REDIS_ERROR=$(echo "$PREFLIGHT" | jq -r '.checks.redis.error' 2>/dev/null || echo "Unknown")
  print_result "Redis Cache" "FAIL" "Error: $REDIS_ERROR"
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "========================================"
echo "  SUMMARY"
echo "========================================"
OVERALL_STATUS=$(echo "$PREFLIGHT" | jq -r '.status' 2>/dev/null || echo "unknown")
TOTAL_LATENCY=$(echo "$PREFLIGHT" | jq -r '.totalLatencyMs' 2>/dev/null || echo "?")

echo ""
echo -e "Passed: ${GREEN}${PASS_COUNT}${NC}"
echo -e "Failed: ${RED}${FAIL_COUNT}${NC}"
echo -e "Total Latency: ${TOTAL_LATENCY}ms"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo -e "${GREEN}========================================"
  echo -e "  ✅ ALL SYSTEMS GO"
  echo -e "========================================${NC}"
  exit 0
else
  echo -e "${RED}========================================"
  echo -e "  ❌ PREFLIGHT FAILED - DO NOT PROCEED"
  echo -e "========================================${NC}"
  exit 1
fi
