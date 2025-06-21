#!/bin/bash

# Quick Deploy Script for POS System on VPS
# Sử dụng script này để deploy nhanh sau khi đã setup server

echo "⚡ Quick Deploy POS System"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if config file exists
if [ ! -f "deploy-config.env" ]; then
    echo -e "${YELLOW}📝 Tạo file cấu hình deploy...${NC}"
    cat > deploy-config.env << 'EOFCONFIG'
# VPS Deploy Configuration
SERVER_HOST=your-server-ip
DOMAIN=your-domain.com
SERVER_USER=root
DB_PASSWORD=pos_secure_password_2024
EOFCONFIG
    echo -e "${RED}❌ Vui lòng cập nhật file deploy-config.env với thông tin server của bạn!${NC}"
    echo "Sau đó chạy lại: ./quick-deploy.sh"
    exit 1
fi

# Load configuration
source deploy-config.env

# Validate configuration
if [[ "$SERVER_HOST" == "your-server-ip" ]] || [[ "$DOMAIN" == "your-domain.com" ]]; then
    echo -e "${RED}❌ Vui lòng cập nhật file deploy-config.env!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Cấu hình đã được load${NC}"
echo "Server: $SERVER_HOST"
echo "Domain: $DOMAIN"

# Test connection
echo -e "${YELLOW}🔍 Test kết nối...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
    echo -e "${RED}❌ Không thể kết nối SSH!${NC}"
    exit 1
fi

# Quick build and deploy
echo -e "${YELLOW}🚀 Bắt đầu deploy...${NC}"

# Update deploy script with config
sed -i.bak "s/SERVER_HOST=\"your-server-ip\"/SERVER_HOST=\"$SERVER_HOST\"/" deploy-vps.sh
sed -i.bak "s/DOMAIN=\"your-domain.com\"/DOMAIN=\"$DOMAIN\"/" deploy-vps.sh
sed -i.bak "s/DB_PASSWORD=\"pos_secure_password_2024\"/DB_PASSWORD=\"$DB_PASSWORD\"/" deploy-vps.sh

# Run deploy
./deploy-vps.sh

# Restore original deploy script
mv deploy-vps.sh.bak deploy-vps.sh

echo -e "${GREEN}✅ Quick deploy hoàn tất!${NC}"
