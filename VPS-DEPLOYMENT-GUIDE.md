# Hướng dẫn Deploy POS System lên VPS/Server riêng

## 📋 Yêu cầu hệ thống

### Server yêu cầu:
- **OS**: Ubuntu 20.04+ hoặc Debian 10+
- **RAM**: Tối thiểu 2GB (khuyến nghị 4GB+)
- **CPU**: 2 cores trở lên
- **Storage**: 20GB trở lên
- **Network**: Kết nối internet ổn định

### Domain và DNS:
- Tên miền đã trỏ về IP server
- Quyền truy cập SSH vào server

## 🚀 Bước 1: Chuẩn bị Server

### 1.1 Kết nối SSH vào server
```bash
ssh root@your-server-ip
# hoặc
ssh username@your-server-ip
```

### 1.2 Chạy script setup tự động
```bash
# Tải và chạy script setup
curl -o server-setup.sh https://raw.githubusercontent.com/your-repo/pos-system/main/server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

### 1.3 Cấu hình MySQL
```bash
# Đăng nhập MySQL
sudo mysql -u root -p

# Tạo database và user
CREATE DATABASE pos_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pos_user'@'localhost' IDENTIFIED BY 'your_secure_password_123';
GRANT ALL PRIVILEGES ON pos_system.* TO 'pos_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 🔧 Bước 2: Cấu hình Environment

### 2.1 Tạo file .env.production
```bash
# Trên server, tạo file .env.production
nano /var/www/pos-system/.env.production
```

Nội dung file:
```env
# Production Environment Variables
NODE_ENV=production
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=pos_user
DB_PASSWORD=your_secure_password_123
DB_NAME=pos_system

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production_12345
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# Upload Configuration
UPLOAD_PATH=/var/www/pos-system/uploads

# Security
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info
LOG_FILE=/var/www/pos-system/logs/app.log
```

### 2.2 Cấu hình Nginx
```bash
# Tạo file cấu hình Nginx
sudo nano /etc/nginx/sites-available/pos-system
```

Sao chép nội dung từ file `nginx.conf` và thay đổi:
- `your-domain.com` → domain thực của bạn
- Đường dẫn SSL certificates

```bash
# Kích hoạt site
sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔐 Bước 3: Cài đặt SSL Certificate

```bash
# Cài đặt SSL certificate với Let's Encrypt
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Kiểm tra auto-renewal
sudo certbot renew --dry-run
```

## 📦 Bước 4: Deploy Application

### 4.1 Trên máy local, cập nhật cấu hình deploy
```bash
# Sửa file deploy-vps.sh
nano deploy-vps.sh
```

Cập nhật các biến:
- `SERVER_HOST="your-server-ip"`
- `DOMAIN="your-domain.com"`

### 4.2 Chạy deploy
```bash
# Build và deploy
chmod +x deploy-vps.sh
./deploy-vps.sh
```

## 🔍 Bước 5: Kiểm tra và Monitor

### 5.1 Kiểm tra trạng thái services
```bash
# Kiểm tra PM2
pm2 status
pm2 logs pos-system

# Kiểm tra Nginx
sudo systemctl status nginx
sudo nginx -t

# Kiểm tra MySQL
sudo systemctl status mysql
```

### 5.2 Kiểm tra logs
```bash
# Application logs
tail -f /var/www/pos-system/logs/combined.log

# Nginx logs
tail -f /var/log/nginx/pos-system.access.log
tail -f /var/log/nginx/pos-system.error.log

# System logs
journalctl -u nginx -f
```

### 5.3 Test website
- Truy cập: `https://your-domain.com`
- Kiểm tra API: `https://your-domain.com/api/health`

## 🛠️ Bước 6: Maintenance và Backup

### 6.1 Setup backup tự động
```bash
# Tạo script backup
sudo nano /usr/local/bin/pos-backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/pos-system"
DATE=$(date +%Y%m%d_%H%M%S)

# Tạo thư mục backup
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u pos_user -p'your_secure_password_123' pos_system > $BACKUP_DIR/database_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/pos-system/uploads/

# Xóa backup cũ (giữ lại 7 ngày)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Phân quyền và setup cron
sudo chmod +x /usr/local/bin/pos-backup.sh
sudo crontab -e

# Thêm dòng này để backup hàng ngày lúc 2:00 AM
0 2 * * * /usr/local/bin/pos-backup.sh
```

### 6.2 Update application
```bash
# Để update app, chỉ cần chạy lại deploy script
./deploy-vps.sh
```

## 🚨 Troubleshooting

### Lỗi thường gặp:

1. **Port 3001 đã được sử dụng**
```bash
sudo lsof -i :3001
sudo kill -9 PID
pm2 restart pos-system
```

2. **Nginx 502 Bad Gateway**
```bash
# Kiểm tra backend có chạy không
pm2 status
# Kiểm tra logs
pm2 logs pos-system
```

3. **Database connection error**
```bash
# Kiểm tra MySQL
sudo systemctl status mysql
# Test connection
mysql -u pos_user -p pos_system
```

4. **SSL certificate issues**
```bash
# Renew certificate
sudo certbot renew
sudo systemctl reload nginx
```

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Logs của application: `/var/www/pos-system/logs/`
2. Nginx logs: `/var/log/nginx/`
3. System logs: `journalctl -xe`

## 🔄 Auto-restart và Monitoring

PM2 sẽ tự động restart application khi có lỗi. Để monitor:

```bash
# Xem trạng thái
pm2 monit

# Xem logs realtime
pm2 logs pos-system --lines 100

# Restart application
pm2 restart pos-system
```

---

**Lưu ý**: Thay thế tất cả `your-domain.com`, `your-server-ip`, và passwords bằng thông tin thực tế của bạn. 