#!/bin/bash

# ══════════════════════════════════════════════
# 📊 KnotEngine — Docker Services Status
# ══════════════════════════════════════════════

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

echo -e "${CYAN}📊 KnotEngine Docker Services Status${NC}"
echo ""

# ── Docker daemon ──
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker daemon is not running${NC}"
  exit 1
fi

# ── MongoDB ──
if docker ps --format '{{.Names}}' | grep -q '^knotengine_mongo$'; then
  MONGO_STATUS=$(docker inspect --format='{{.State.Status}}' knotengine_mongo 2>/dev/null)
  MONGO_PORT=$(docker port knotengine_mongo 27017 2>/dev/null)
  MONGO_UPTIME=$(docker inspect --format='{{.State.StartedAt}}' knotengine_mongo 2>/dev/null)
  echo -e "${GREEN}● MongoDB${NC}  ${MONGO_STATUS}  →  ${MONGO_PORT}  ${DIM}(since ${MONGO_UPTIME})${NC}"
else
  echo -e "${RED}○ MongoDB${NC}  not running"
fi

# ── Redis ──
if docker ps --format '{{.Names}}' | grep -q '^knotengine_redis$'; then
  REDIS_STATUS=$(docker inspect --format='{{.State.Status}}' knotengine_redis 2>/dev/null)
  REDIS_PORT=$(docker port knotengine_redis 6379 2>/dev/null)
  REDIS_UPTIME=$(docker inspect --format='{{.State.StartedAt}}' knotengine_redis 2>/dev/null)
  echo -e "${GREEN}● Redis${NC}    ${REDIS_STATUS}  →  ${REDIS_PORT}  ${DIM}(since ${REDIS_UPTIME})${NC}"
else
  echo -e "${RED}○ Redis${NC}    not running"
fi

# ── Volumes ──
echo ""
echo -e "${CYAN}Volumes:${NC}"
docker volume ls --format '  {{.Name}}' --filter name=knotengine 2>/dev/null || echo "  (none)"

echo ""
