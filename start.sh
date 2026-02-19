#!/bin/bash

# ANSI Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get current version from package.json
VERSION=$(node -e "console.log(require('./package.json').version)")

echo -e "${GREEN}🚀 KnotEngine (v${VERSION}) Startup Script${NC}"

# 1. Check Docker
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running!${NC}"
  echo "Please start Docker Desktop and try again."
  exit 1
fi

# 2. Start MongoDB + Redis
echo -e "${YELLOW}🐳 Starting MongoDB + Redis...${NC}"
docker-compose up -d

echo "Waiting 5s for services to initialize..."
sleep 5

# 3. Verify MongoDB is reachable
echo -e "${YELLOW}🔍 Checking MongoDB connection...${NC}"
if docker exec knotengine_mongo mongosh --quiet --eval "db.runCommand({ ping: 1 })" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ MongoDB is ready${NC}"
else
  echo -e "${RED}❌ MongoDB is not reachable. Check docker logs.${NC}"
  exit 1
fi

# 4. Start API
echo -e "${GREEN}✨ Starting KnotEngine API...${NC}"
pnpm turbo run dev --filter api
