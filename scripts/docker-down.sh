#!/bin/bash

# ══════════════════════════════════════════════
# 🛑 TyePay — Docker Services Shutdown
# ══════════════════════════════════════════════

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🛑 TyePay Docker Services — Shutting Down${NC}"
echo ""

# ── MongoDB ──
if docker ps --format '{{.Names}}' | grep -q '^tyepay_mongo$'; then
  docker stop tyepay_mongo > /dev/null
  docker rm tyepay_mongo > /dev/null
  echo -e "${GREEN}✔ MongoDB${NC} stopped and removed"
else
  echo -e "${YELLOW}— MongoDB${NC} was not running"
fi

# ── Redis ──
if docker ps --format '{{.Names}}' | grep -q '^tyepay_redis$'; then
  docker stop tyepay_redis > /dev/null
  docker rm tyepay_redis > /dev/null
  echo -e "${GREEN}✔ Redis${NC}   stopped and removed"
else
  echo -e "${YELLOW}— Redis${NC}   was not running"
fi

echo ""
echo -e "${GREEN}✔ All services stopped.${NC}"
echo -e "  Data volumes preserved (tyepay_mongo_data, tyepay_redis_data)."
echo -e "  To remove data: docker volume rm tyepay_mongo_data tyepay_redis_data"
echo ""
