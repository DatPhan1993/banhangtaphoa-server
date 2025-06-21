# 🚀 Hướng dẫn Deploy POS System

## 📋 Tổng quan

POS System có thể được deploy theo nhiều cách khác nhau. Dưới đây là các lựa chọn phổ biến:

## 🌟 Option 1: VPS/Server riêng (Khuyến nghị cho Production)

### Yêu cầu hệ thống:
- Ubuntu 20.04+ hoặc Debian 11+
- RAM: 2GB+
- Storage: 20GB+
- Node.js 18+, MySQL 8.0+, Nginx, PM2

### Bước 1: Chuẩn bị server

```bash
# 1. Chạy script setup server (trên server)
sudo bash server-setup.sh

# 2. Cấu hình MySQL password
sudo mysql
CREATE USER 'pos_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON pos_system.* TO 'pos_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 3. Lấy SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Bước 2: Cấu hình deploy

```bash
# 1. Cập nhật thông tin trong deploy-vps.sh
nano deploy-vps.sh
# Thay đổi:
# - SERVER_HOST="your-server-ip"
# - DOMAIN="your-domain.com"

# 2. Cập nhật nginx.conf
nano nginx.conf
# Thay đổi server_name thành domain của bạn

# 3. Cập nhật env.production.example
cp env.production.example .env.production
nano .env.production
# Cập nhật database credentials và JWT secret
```

### Bước 3: Deploy

```bash
# Chạy script deploy
chmod +x deploy-vps.sh
./deploy-vps.sh
```

---

## 🚂 Option 2: Railway (Đơn giản nhất)

### Bước 1: Chuẩn bị

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Tạo project
railway new
```

### Bước 2: Setup Database

```bash
# Thêm MySQL database
railway add --database mysql

# Deploy
railway up
```

### Bước 3: Cấu hình Environment Variables

Trên Railway dashboard, thêm các biến môi trường:

```
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret
CORS_ORIGIN=https://your-app.railway.app
```

---

## 🐳 Option 3: Docker (Flexible)

### Bước 1: Chuẩn bị

```bash
# 1. Cài đặt Docker và Docker Compose
sudo apt install docker.io docker-compose

# 2. Tạo .env file
cp env.production.example .env
nano .env
```

### Bước 2: Build và chạy

```bash
# Build và start
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## ☁️ Option 4: Vercel + PlanetScale (Free tier)

### Bước 1: Setup Database

```bash
# 1. Tạo account PlanetScale
# 2. Tạo database mới
# 3. Import schema từ server/src/database/schema.sql
```

### Bước 2: Deploy Frontend

```bash
# 1. Cài đặt Vercel CLI
npm i -g vercel

# 2. Deploy client
cd client
vercel

# 3. Cấu hình environment variables trên Vercel dashboard
```

### Bước 3: Deploy Backend

```bash
# 1. Tạo project mới cho backend
cd server
vercel

# 2. Cấu hình environment variables
```

---

## 🔧 Cấu hình Environment Variables

### Development (.env.development)
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=dat12345
DB_NAME=pos_system
JWT_SECRET=dev-secret
CORS_ORIGIN=http://localhost:3000
```

### Production (.env.production)
```env
NODE_ENV=production
PORT=3001
DB_HOST=your-db-host
DB_USER=pos_user
DB_PASSWORD=secure-password
DB_NAME=pos_system
JWT_SECRET=super-secure-jwt-secret
CORS_ORIGIN=https://your-domain.com
```

---

## 🔒 Bảo mật

### SSL Certificate
```bash
# Sử dụng Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

### Firewall
```bash
# Cấu hình UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Database Security
```bash
# Secure MySQL
sudo mysql_secure_installation
```

---

## 📊 Monitoring

### PM2 Monitoring
```bash
# Xem status
pm2 status

# Xem logs
pm2 logs pos-system

# Restart
pm2 restart pos-system
```

### Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/pos-system.access.log

# Error logs
tail -f /var/log/nginx/pos-system.error.log
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Kiểm tra MySQL service
   sudo systemctl status mysql
   
   # Kiểm tra user permissions
   mysql -u pos_user -p pos_system
   ```

2. **Port Already in Use**
   ```bash
   # Tìm process đang dùng port
   sudo lsof -i :3001
   
   # Kill process
   sudo kill -9 PID
   ```

3. **Build Errors**
   ```bash
   # Clear cache
   npm cache clean --force
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 📞 Support

Nếu gặp vấn đề trong quá trình deploy, hãy kiểm tra:

1. ✅ Node.js version (18+)
2. ✅ Database connection
3. ✅ Environment variables
4. ✅ Firewall settings
5. ✅ SSL certificates

---

## 🎉 Hoàn thành!

Sau khi deploy thành công, bạn có thể:

- 🌐 Truy cập ứng dụng qua domain
- 👤 Đăng nhập với tài khoản admin
- 📱 Sử dụng POS system
- 📊 Xem báo cáo và thống kê 