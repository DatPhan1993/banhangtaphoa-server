#!/bin/bash

echo "🚂 Deploying POS System to Railway..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found!${NC}"
    echo -e "${YELLOW}Installing Railway CLI...${NC}"
    npm install -g @railway/cli
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}🔑 Please login to Railway...${NC}"
    railway login
fi

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed!${NC}"

# Deploy to Railway
echo -e "${YELLOW}🚀 Deploying to Railway...${NC}"
railway up

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Your app will be available at the Railway domain${NC}"
    
    # Get the domain
    DOMAIN=$(railway domain)
    if [ ! -z "$DOMAIN" ]; then
        echo -e "${GREEN}🔗 Domain: $DOMAIN${NC}"
    fi
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Set up MySQL database addon in Railway dashboard"
echo "2. Configure environment variables:"
echo "   - NODE_ENV=production"
echo "   - JWT_SECRET=your-secure-secret"
echo "   - CORS_ORIGIN=https://your-railway-domain"
echo "3. Connect database and restart the service"

echo -e "${GREEN}✨ Done!${NC}" 