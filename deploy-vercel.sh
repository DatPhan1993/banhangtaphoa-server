#!/bin/bash

echo "☁️ Deploying POS System to Vercel + PlanetScale..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found!${NC}"
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Check if PlanetScale CLI is installed
if ! command -v pscale &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PlanetScale CLI...${NC}"
    # For macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install planetscale/tap/pscale
    else
        # For Linux
        curl -fsSL https://github.com/planetscale/cli/releases/latest/download/pscale_linux_amd64.tar.gz | tar -xz
        sudo mv pscale /usr/local/bin
    fi
fi

echo -e "${BLUE}🗄️ Setting up PlanetScale Database...${NC}"
echo "Please follow these steps:"
echo "1. Go to https://planetscale.com and create an account"
echo "2. Create a new database (e.g., 'pos-system')"
echo "3. Run the following commands:"
echo ""
echo -e "${YELLOW}pscale auth login${NC}"
echo -e "${YELLOW}pscale database create pos-system${NC}"
echo -e "${YELLOW}pscale shell pos-system main < planetscale-schema.sql${NC}"
echo ""
read -p "Press Enter after you've completed the PlanetScale setup..."

echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed!${NC}"

echo -e "${BLUE}🚀 Deploying Backend to Vercel...${NC}"
cd server

# Create .env.local for Vercel
cat > .env.local << EOF
NODE_ENV=production
DB_HOST=\$DB_HOST
DB_USER=\$DB_USER
DB_PASSWORD=\$DB_PASSWORD
DB_NAME=\$DB_NAME
JWT_SECRET=\$JWT_SECRET
CORS_ORIGIN=\$CORS_ORIGIN
EOF

# Deploy backend
vercel --prod

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backend deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend deployed successfully!${NC}"

# Get backend URL
BACKEND_URL=$(vercel ls | grep server | awk '{print $2}' | head -1)
echo -e "${GREEN}🔗 Backend URL: https://$BACKEND_URL${NC}"

cd ../client

echo -e "${BLUE}🌐 Deploying Frontend to Vercel...${NC}"

# Create .env.local for frontend
cat > .env.local << EOF
REACT_APP_API_URL=https://$BACKEND_URL/api
GENERATE_SOURCEMAP=false
EOF

# Deploy frontend
vercel --prod

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"

# Get frontend URL
FRONTEND_URL=$(vercel ls | grep client | awk '{print $2}' | head -1)
echo -e "${GREEN}🔗 Frontend URL: https://$FRONTEND_URL${NC}"

cd ..

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Go to your Vercel dashboard and set environment variables for backend:"
echo "   - DB_HOST (from PlanetScale)"
echo "   - DB_USER (from PlanetScale)"
echo "   - DB_PASSWORD (from PlanetScale)"
echo "   - DB_NAME (your database name)"
echo "   - JWT_SECRET (generate a secure secret)"
echo "   - CORS_ORIGIN=https://$FRONTEND_URL"
echo ""
echo "2. Get your PlanetScale connection details:"
echo -e "${YELLOW}   pscale password create pos-system main pos-password${NC}"
echo ""
echo "3. Update frontend environment variable:"
echo "   - REACT_APP_API_URL=https://$BACKEND_URL/api"
echo ""
echo -e "${GREEN}🌐 Your POS System will be available at: https://$FRONTEND_URL${NC}"
echo -e "${GREEN}🔑 Default login: admin / admin123${NC}" 