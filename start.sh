#!/bin/bash

# ANSI Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 TyePay (Knot Engine) Startup Script${NC}"

# 1. Check Docker
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running!${NC}"
  echo "Please start Docker Desktop and try again."
  exit 1
fi

# 2. Start DB
echo -e "${YELLOW}🐳 Starting PostgreSQL...${NC}"
docker compose up -d

echo "Waiting 5s for DB to initialize..."
sleep 5

# 3. Push Schema
echo -e "${YELLOW}📦 Pushing Drizzle Schema...${NC}"
cd packages/database
pnpm push
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Database push failed.${NC}"
  exit 1
fi
cd ../..

# 4. Start API
echo -e "${GREEN}✨ Starting Knot Engine API...${NC}"
pnpm turbo run dev --filter api
