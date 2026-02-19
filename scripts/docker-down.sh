#!/bin/bash

# ══════════════════════════════════════════════
# 🛑 KnotEngine — Docker Services Shutdown
# ══════════════════════════════════════════════

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🛑 KnotEngine Docker Services — Shutting Down${NC}"
echo ""

# ── MongoDB ──
if docker ps --format '{{.Names}}' | grep -q '^knotengine_mongo$'; then
  docker stop knotengine_mongo > /dev/null
  docker rm knotengine_mongo > /dev/null
  echo -e "${GREEN}✔ MongoDB${NC} stopped and removed"
else
  echo -e "${YELLOW}— MongoDB${NC} was not running"
fi

# ── Redis ──
if docker ps --format '{{.Names}}' | grep -q '^knotengine_redis$'; then
  docker stop knotengine_redis > /dev/null
  docker rm knotengine_redis > /dev/null
  echo -e "${GREEN}✔ Redis${NC}   stopped and removed"
else
  echo -e "${YELLOW}— Redis${NC}   was not running"
fi

echo ""
echo -e "${GREEN}✔ All services stopped.${NC}"
echo -e "  Data volumes preserved (knotengine_mongo_data, knotengine_redis_data)."
echo -e "  To remove data: docker volume rm knotengine_mongo_data knotengine_redis_data"
echo ""
