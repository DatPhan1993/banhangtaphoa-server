#!/bin/bash

# VPS Monitoring Script for POS System
echo "📊 POS System VPS Monitor"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load config if exists
if [ -f "deploy-config.env" ]; then
    source deploy-config.env
else
    echo -e "${RED}❌ File deploy-config.env không tồn tại!${NC}"
    echo "Chạy ./quick-deploy.sh trước để tạo file cấu hình"
    exit 1
fi

echo -e "${BLUE}=== POS System Status Monitor ===${NC}"
echo "Server: $SERVER_HOST"
echo "Domain: $DOMAIN"
echo ""

# Test SSH connection
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes $SERVER_USER@$SERVER_HOST exit 2>/dev/null; then
    echo -e "${RED}❌ Không thể kết nối SSH tới server!${NC}"
    exit 1
fi

# Get system information
echo -e "${YELLOW}📊 Đang lấy thông tin hệ thống...${NC}"

ssh $SERVER_USER@$SERVER_HOST << 'EOF'
    echo "=== SYSTEM INFORMATION ==="
    echo "📅 Date: $(date)"
    echo "⏰ Uptime: $(uptime -p)"
    echo "💾 Memory: $(free -h | grep '^Mem:' | awk '{print $3 "/" $2 " (" $3/$2*100 "% used)"}')"
    echo "💿 Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
    echo "🔥 CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
    echo ""
    
    echo "=== SERVICES STATUS ==="
    systemctl is-active nginx >/dev/null && echo "✅ Nginx: Running" || echo "❌ Nginx: Stopped"
    systemctl is-active mysql >/dev/null && echo "✅ MySQL: Running" || echo "❌ MySQL: Stopped"
    
    echo ""
    echo "=== PM2 STATUS ==="
    pm2 list 2>/dev/null || echo "❌ PM2 not running or no apps"
    
    echo ""
    echo "=== APPLICATION LOGS (Last 10 lines) ==="
    if pm2 list | grep -q "pos-system"; then
        pm2 logs pos-system --lines 10 --nostream 2>/dev/null || echo "No logs available"
    else
        echo "❌ POS application not running"
    fi
    
    echo ""
    echo "=== NGINX ERROR LOGS (Last 5 lines) ==="
    if [ -f "/var/log/nginx/pos-system.error.log" ]; then
        tail -5 /var/log/nginx/pos-system.error.log 2>/dev/null || echo "No error logs"
    else
        echo "No nginx error log file found"
    fi
    
    echo ""
    echo "=== DATABASE STATUS ==="
    mysql -u pos_user -p'pos_secure_password_2024' -e "SELECT COUNT(*) as total_orders FROM pos_system.sales_orders;" 2>/dev/null || echo "❌ Cannot connect to database"
    
    echo ""
    echo "=== DISK USAGE BY DIRECTORY ==="
    du -sh /var/www/pos-system/* 2>/dev/null | sort -hr
    
    echo ""
    echo "=== NETWORK CONNECTIONS ==="
    netstat -tuln | grep -E ":80|:443|:3001" || echo "No relevant network connections"
    
    echo ""
    echo "=== RECENT BACKUPS ==="
    ls -la /var/backups/pos-system/ 2>/dev/null | tail -5 || echo "No backups found"
EOF

echo ""
echo -e "${GREEN}✅ Monitor hoàn tất!${NC}"
echo -e "${YELLOW}💡 Các lệnh hữu ích:${NC}"
echo "  - Restart app: ssh $SERVER_USER@$SERVER_HOST 'pm2 restart pos-system'"
echo "  - View logs: ssh $SERVER_USER@$SERVER_HOST 'pm2 logs pos-system'"
echo "  - System info: ssh $SERVER_USER@$SERVER_HOST 'pos-info.sh'"
echo "  - Manual backup: ssh $SERVER_USER@$SERVER_HOST 'pos-backup.sh'" 