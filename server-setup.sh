#!/bin/bash

# Server setup script for Ubuntu/Debian VPS
echo "🖥️ Setting up VPS server for POS System..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Script này phải chạy với quyền root${NC}"
   echo "Chạy: sudo $0"
   exit 1
fi

echo -e "${BLUE}=== POS System VPS Setup Script ===${NC}"
echo -e "${YELLOW}Đang cài đặt server cho hệ thống POS...${NC}"
echo ""

# Update system
echo -e "${YELLOW}📦 Cập nhật hệ thống...${NC}"
apt update && apt upgrade -y

# Install basic packages
echo -e "${YELLOW}🔧 Cài đặt các gói cơ bản...${NC}"
apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release

# Install Node.js 18.x
echo -e "${YELLOW}📦 Cài đặt Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
echo -e "${GREEN}✅ Node.js installed: $node_version${NC}"
echo -e "${GREEN}✅ NPM installed: $npm_version${NC}"

# Install MySQL Server
echo -e "${YELLOW}🗄️ Cài đặt MySQL Server...${NC}"
apt install -y mysql-server

# Start MySQL service
systemctl start mysql
systemctl enable mysql

# Install Nginx
echo -e "${YELLOW}🌐 Cài đặt Nginx...${NC}"
apt install -y nginx

# Install PM2 globally
echo -e "${YELLOW}⚡ Cài đặt PM2...${NC}"
npm install -g pm2

# Install Certbot for SSL
echo -e "${YELLOW}🔐 Cài đặt Certbot cho SSL...${NC}"
apt install -y certbot python3-certbot-nginx

# Create application directories
echo -e "${YELLOW}📁 Tạo thư mục ứng dụng...${NC}"
mkdir -p /var/www/pos-system
mkdir -p /var/www/pos-system/logs
mkdir -p /var/www/pos-system/uploads
mkdir -p /var/backups/pos-system

# Set proper permissions
chown -R www-data:www-data /var/www/pos-system
chmod -R 755 /var/www/pos-system

# Configure firewall
echo -e "${YELLOW}🔥 Cấu hình tường lửa...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Start and enable services
echo -e "${YELLOW}🚀 Khởi động các dịch vụ...${NC}"
systemctl start nginx
systemctl enable nginx
systemctl start mysql
systemctl enable mysql

# Configure PM2 startup
echo -e "${YELLOW}⚡ Cấu hình PM2 khởi động cùng hệ thống...${NC}"
pm2 startup systemd -u root --hp /root

# Create MySQL database and user
echo -e "${YELLOW}🗄️ Thiết lập database...${NC}"
mysql << 'EOF'
CREATE DATABASE IF NOT EXISTS pos_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'pos_user'@'localhost' IDENTIFIED BY 'pos_secure_password_2024';
GRANT ALL PRIVILEGES ON pos_system.* TO 'pos_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Create backup script
echo -e "${YELLOW}💾 Tạo script backup...${NC}"
cat > /usr/local/bin/pos-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/pos-system"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u pos_user -p'pos_secure_password_2024' pos_system > $BACKUP_DIR/database_$DATE.sql

# Backup uploads
if [ -d "/var/www/pos-system/uploads" ]; then
    tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/pos-system/uploads/
fi

# Remove old backups (keep 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/pos-backup.sh

# Setup cron job for daily backup
echo -e "${YELLOW}⏰ Thiết lập backup tự động...${NC}"
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/pos-backup.sh >> /var/log/pos-backup.log 2>&1") | crontab -

# Create log rotation
cat > /etc/logrotate.d/pos-system << 'EOF'
/var/www/pos-system/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload pos-system
    endscript
}
EOF

# Create health check script
cat > /usr/local/bin/pos-health-check.sh << 'EOF'
#!/bin/bash
# Health check for POS system

# Check if PM2 app is running
if ! pm2 list | grep -q "pos-system.*online"; then
    echo "$(date): POS app is down, restarting..." >> /var/log/pos-health.log
    pm2 restart pos-system
fi

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "$(date): Nginx is down, restarting..." >> /var/log/pos-health.log
    systemctl restart nginx
fi

# Check if MySQL is running
if ! systemctl is-active --quiet mysql; then
    echo "$(date): MySQL is down, restarting..." >> /var/log/pos-health.log
    systemctl restart mysql
fi
EOF

chmod +x /usr/local/bin/pos-health-check.sh

# Add health check to cron (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/pos-health-check.sh") | crontab -

# Create system info script
cat > /usr/local/bin/pos-info.sh << 'EOF'
#!/bin/bash
echo "=== POS System Information ==="
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo "PM2: $(pm2 --version)"
echo "Nginx: $(nginx -v 2>&1)"
echo "MySQL: $(mysql --version)"
echo ""
echo "=== Services Status ==="
echo "Nginx: $(systemctl is-active nginx)"
echo "MySQL: $(systemctl is-active mysql)"
echo ""
echo "=== PM2 Status ==="
pm2 list
echo ""
echo "=== Disk Usage ==="
df -h /var/www/pos-system
echo ""
echo "=== Memory Usage ==="
free -h
EOF

chmod +x /usr/local/bin/pos-info.sh

# Display completion message
echo ""
echo -e "${GREEN}🎉 VPS setup hoàn tất!${NC}"
echo -e "${BLUE}=== Thông tin quan trọng ===${NC}"
echo -e "${YELLOW}📋 Database thông tin:${NC}"
echo "  - Database: pos_system"
echo "  - User: pos_user"
echo "  - Password: pos_secure_password_2024"
echo ""
echo -e "${YELLOW}📁 Thư mục quan trọng:${NC}"
echo "  - App: /var/www/pos-system"
echo "  - Logs: /var/www/pos-system/logs"
echo "  - Uploads: /var/www/pos-system/uploads"
echo "  - Backups: /var/backups/pos-system"
echo ""
echo -e "${YELLOW}🔧 Lệnh hữu ích:${NC}"
echo "  - Xem thông tin hệ thống: pos-info.sh"
echo "  - Backup thủ công: pos-backup.sh"
echo "  - Kiểm tra PM2: pm2 status"
echo "  - Xem logs: pm2 logs pos-system"
echo ""
echo -e "${YELLOW}📋 Các bước tiếp theo:${NC}"
echo "1. Cập nhật mật khẩu database trong script deploy"
echo "2. Cấu hình domain và SSL: certbot --nginx -d your-domain.com"
echo "3. Cập nhật file nginx.conf với domain của bạn"
echo "4. Chạy script deploy từ máy local: ./deploy-vps.sh"
echo ""
echo -e "${GREEN}✅ Server đã sẵn sàng để deploy ứng dụng!${NC}" 