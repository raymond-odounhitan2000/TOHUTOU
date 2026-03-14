#!/usr/bin/env bash
# Test rapide API (ping, health, organizations) sans rien committer.
# Usage: ./scripts/test-api.sh [URL]
#   ./scripts/test-api.sh
#   ./scripts/test-api.sh https://tohutou-yovopass-ed576567.koyeb.app
#   ./scripts/test-api.sh http://localhost:3000

BASE="${1:-http://localhost:3000}"
BASE="${BASE%/}"

echo "=============================================="
echo "Test API — $BASE"
echo "=============================================="

test_route() {
  local path="$1"
  local name="$2"
  local code
  code=$(curl -sS -o /tmp/test-api-body -w "%{http_code}" --connect-timeout 5 "$BASE$path" 2>/dev/null || echo "000")
  echo "[$name] $path → HTTP $code"
  if [ "$code" = "200" ]; then
    head -c 120 /tmp/test-api-body 2>/dev/null
    echo ""
  fi
}

test_route "/api/ping"       "ping (route Next.js)"
test_route "/api/health"     "health (backend)"
test_route "/api/organizations" "organizations"

echo "=============================================="
echo "Si ping = 200 → Route Handler OK. Si health = 200 → backend OK."
echo "Si tout 404 → Route Handler absent du build ou ancienne image."
echo "=============================================="
