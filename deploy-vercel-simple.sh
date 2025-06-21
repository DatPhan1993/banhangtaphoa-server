#!/bin/bash

echo "☁️ Deploying to Vercel + PlanetScale..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔨 Building applications...${NC}"

# Build server
echo "Building server..."
cd server
npm run build
cd ..

# Build client  
echo "Building client..."
cd client
npm run build
cd ..

echo -e "${GREEN}✅ Build completed!${NC}"

echo -e "${YELLOW}📋 Next steps:${NC}"
echo ""
echo "1. Deploy Backend:"
echo "   cd server && vercel --prod"
echo ""
echo "2. Set Backend Environment Variables in Vercel Dashboard:"
echo "   - NODE_ENV=production"
echo "   - DB_HOST=xxxxx.psdb.cloud"
echo "   - DB_USER=xxxxx"
echo "   - DB_PASSWORD=xxxxx"
echo "   - DB_NAME=pos-system"
echo "   - JWT_SECRET=your-secret-key"
echo "   - CORS_ORIGIN=https://your-frontend.vercel.app"
echo ""
echo "3. Deploy Frontend:"
echo "   cd client && vercel --prod"
echo ""
echo "4. Set Frontend Environment Variables:"
echo "   - REACT_APP_API_URL=https://your-backend.vercel.app/api"
echo ""
echo "5. Import Database Schema to PlanetScale:"
echo "   pscale shell pos-system main < planetscale-schema.sql"
echo ""
echo -e "${GREEN}🎉 Ready to deploy!${NC}" 