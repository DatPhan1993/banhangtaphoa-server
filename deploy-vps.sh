#!/bin/bash

# Deploy script for VPS - POS System
echo "🚀 Bắt đầu deploy POS System lên VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - CẬP NHẬT THÔNG TIN NÀY
SERVER_USER="root"
SERVER_HOST="your-server-ip"  # Thay bằng IP server của bạn
APP_NAME="pos-system"
APP_DIR="/var/www/$APP_NAME"
DOMAIN="your-domain.com"      # Thay bằng domain của bạn
DB_PASSWORD="pos_secure_password_2024"  # Mật khẩu database

echo -e "${BLUE}=== POS System VPS Deployment ===${NC}"
echo -e "${YELLOW}📋 Cấu hình deploy:${NC}"
echo "Server: $SERVER_USER@$SERVER_HOST"
echo "App Directory: $APP_DIR"
echo "Domain: $DOMAIN"
echo ""

# Check if configuration is updated
if [[ "$SERVER_HOST" == "your-server-ip" ]] || [[ "$DOMAIN" == "your-domain.com" ]]; then
    echo -e "${RED}❌ Vui lòng cập nhật SERVER_HOST và DOMAIN trong script!${NC}"
    echo "Sửa file deploy-vps.sh và thay đổi:"
    echo "  SERVER_HOST=\"your-server-ip\" → SERVER_HOST=\"IP-server-của-bạn\""
    echo "  DOMAIN=\"your-domain.com\" → DOMAIN=\"domain-của-bạn.com\""
    exit 1
fi

# Test SSH connection
echo -e "${YELLOW}🔍 Kiểm tra kết nối SSH...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
    echo -e "${RED}❌ Không thể kết nối SSH tới server!${NC}"
    echo "Kiểm tra:"
    echo "1. IP server có đúng không?"
    echo "2. SSH key đã được setup chưa?"
    echo "3. Server có đang chạy không?"
    exit 1
fi

echo -e "${GREEN}✅ Kết nối SSH thành công!${NC}"

# Build the client application
echo -e "${YELLOW}🔨 Build React client...${NC}"
cd client
npm ci
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build client thất bại!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build client thành công!${NC}"

# Build the server application
echo -e "${YELLOW}🔨 Build Node.js server...${NC}"
cd ../server
npm ci
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build server thất bại!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build server thành công!${NC}"

# Return to root directory
cd ..

# Create environment file for production
echo -e "${YELLOW}🔧 Tạo file environment...${NC}"
cat > .env.production << EOF
# Production Environment Variables
NODE_ENV=production
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=pos_user
DB_PASSWORD=$DB_PASSWORD
DB_NAME=pos_system

# JWT Configuration
JWT_SECRET=pos_jwt_secret_key_production_$(date +%s)_$(openssl rand -hex 16)
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN

# Upload Configuration
UPLOAD_PATH=/var/www/pos-system/uploads

# Security
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info
LOG_FILE=/var/www/pos-system/logs/app.log
EOF

# Create deployment package
echo -e "${YELLOW}📦 Tạo gói deploy...${NC}"
tar -czf pos-system-deploy.tar.gz \
    --exclude=node_modules \
    --exclude=client/node_modules \
    --exclude=server/node_modules \
    --exclude=.git \
    --exclude=*.log \
    --exclude=database.db \
    --exclude=pos_system.db \
    --exclude=temp_token.txt \
    client/build/ \
    server/dist/ \
    server/package.json \
    server/package-lock.json \
    package.json \
    nginx.conf \
    ecosystem.config.js \
    .env.production

echo -e "${GREEN}✅ Gói deploy đã được tạo!${NC}"

# Upload to server
echo -e "${YELLOW}⬆️ Upload lên server...${NC}"
scp pos-system-deploy.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload thất bại!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Upload thành công!${NC}"

# Deploy on server
echo -e "${YELLOW}🔧 Deploy trên server...${NC}"
ssh $SERVER_USER@$SERVER_HOST << EOF
    set -e
    
    echo "🔄 Stopping existing application..."
    pm2 stop $APP_NAME || true
    pm2 delete $APP_NAME || true
    
    echo "📁 Creating and cleaning app directory..."
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Backup old version if exists
    if [ -d "server" ]; then
        echo "💾 Backing up old version..."
        tar -czf backup_\$(date +%Y%m%d_%H%M%S).tar.gz server/ client/ || true
    fi
    
    # Clean old files
    rm -rf server/ client/ package.json ecosystem.config.js .env || true
    
    echo "📦 Extracting new version..."
    tar -xzf /tmp/pos-system-deploy.tar.gz
    
    echo "📦 Installing server dependencies..."
    cd server && npm ci --production --silent
    cd ..
    
    echo "🔧 Setting up environment..."
    cp .env.production .env
    
    echo "🗄️ Running database migrations..."
    cd server && npm run migrate || echo "Migration skipped or failed"
    cd ..
    
    echo "⚡ Starting application with PM2..."
    pm2 start ecosystem.config.js
    pm2 save
    
    echo "🌐 Updating Nginx configuration..."
    # Update nginx config with actual domain
    sed -i 's/your-domain.com/$DOMAIN/g' nginx.conf
    cp nginx.conf /etc/nginx/sites-available/pos-system
    
    # Enable site if not already enabled
    if [ ! -L /etc/nginx/sites-enabled/pos-system ]; then
        ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/
    fi
    
    # Test and reload nginx
    nginx -t && systemctl reload nginx
    
    echo "🧹 Cleaning up..."
    rm /tmp/pos-system-deploy.tar.gz
    
    echo "🔍 Checking application status..."
    pm2 list
    
    echo "📊 System status:"
    systemctl is-active nginx && echo "✅ Nginx: Running" || echo "❌ Nginx: Stopped"
    systemctl is-active mysql && echo "✅ MySQL: Running" || echo "❌ MySQL: Stopped"
    
    echo "📝 Recent logs:"
    pm2 logs $APP_NAME --lines 10 --nostream || true
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Deploy thành công!${NC}"
    echo -e "${BLUE}=== Thông tin truy cập ===${NC}"
    echo -e "${GREEN}🌐 Website: https://$DOMAIN${NC}"
    echo -e "${GREEN}🔧 API Health: https://$DOMAIN/api/health${NC}"
    echo ""
    echo -e "${YELLOW}📋 Các lệnh hữu ích trên server:${NC}"
    echo "  - Xem logs: pm2 logs pos-system"
    echo "  - Restart app: pm2 restart pos-system"
    echo "  - Xem status: pm2 status"
    echo "  - Xem system info: pos-info.sh"
    echo ""
    echo -e "${YELLOW}🔐 Cài đặt SSL certificate:${NC}"
    echo "  ssh $SERVER_USER@$SERVER_HOST"
    echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    echo ""
else
    echo -e "${RED}❌ Deploy thất bại!${NC}"
    echo "Kiểm tra logs trên server:"
    echo "  ssh $SERVER_USER@$SERVER_HOST"
    echo "  pm2 logs pos-system"
    echo "  tail -f /var/log/nginx/error.log"
    exit 1
fi

# Cleanup local files
rm pos-system-deploy.tar.gz .env.production

echo -e "${GREEN}✨ Quá trình deploy hoàn tất!${NC}"
echo ""
echo -e "${YELLOW}🔄 Để update app lần sau, chỉ cần chạy:${NC}"
echo "  ./deploy-vps.sh" 