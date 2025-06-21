# POS System - Hệ thống quản lý bán hàng

Hệ thống POS (Point of Sale) hoàn chỉnh với React frontend và Node.js backend, hỗ trợ quản lý sản phẩm, đơn hàng, khách hàng và báo cáo kinh doanh.

## 🚀 Deployment Options

### 1. Deploy lên VPS/Server riêng (Khuyến nghị)

#### Yêu cầu hệ thống:
- **OS**: Ubuntu 20.04+ hoặc Debian 10+
- **RAM**: Tối thiểu 2GB (khuyến nghị 4GB+)
- **CPU**: 2 cores trở lên
- **Storage**: 20GB trở lên
- **Domain**: Tên miền đã trỏ về IP server

#### Các bước deploy:

**Bước 1: Setup server**
```bash
# Trên server VPS
curl -o server-setup.sh https://raw.githubusercontent.com/your-repo/pos-system/main/server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

**Bước 2: Cấu hình SSL**
```bash
# Trên server sau khi setup
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**Bước 3: Deploy từ máy local**
```bash
# Cập nhật thông tin server trong deploy-vps.sh
nano deploy-vps.sh

# Chạy deploy
chmod +x deploy-vps.sh
./deploy-vps.sh
```

**Bước 4: Deploy nhanh lần sau**
```bash
# Sử dụng quick deploy
chmod +x quick-deploy.sh
./quick-deploy.sh
```

**Bước 5: Monitor hệ thống**
```bash
# Theo dõi trạng thái server
chmod +x monitor-vps.sh
./monitor-vps.sh
```

#### Các lệnh hữu ích trên server:
```bash
# Xem trạng thái ứng dụng
pm2 status
pm2 logs pos-system

# Restart ứng dụng
pm2 restart pos-system

# Xem thông tin hệ thống
pos-info.sh

# Backup thủ công
pos-backup.sh

# Xem logs Nginx
tail -f /var/log/nginx/pos-system.error.log
```

### 2. Deploy lên Vercel (Frontend + Backend)

```bash
# Deploy toàn bộ lên Vercel
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

### 3. Deploy lên Railway

```bash
# Deploy lên Railway
chmod +x deploy-railway.sh
./deploy-railway.sh
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18.x+
- MySQL 8.0+ (cho production) hoặc SQLite (cho development)
- npm hoặc yarn

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/pos-system.git
cd pos-system

# Install dependencies
npm install

# Setup client
cd client
npm install
cd ..

# Setup server
cd server
npm install
cd ..
```

### Environment Setup

**Client (.env.production.local):**
```env
REACT_APP_API_URL=https://your-domain.com/api
```

**Server (.env):**
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=pos_user
DB_PASSWORD=your_password
DB_NAME=pos_system
JWT_SECRET=your_jwt_secret
```

### Running Development

```bash
# Start server (terminal 1)
cd server
npm run dev

# Start client (terminal 2)
cd client
npm start
```

## 📊 Features

### 🏪 Quản lý cửa hàng
- **Dashboard**: Tổng quan kinh doanh với biểu đồ thời gian thực
- **POS**: Giao diện bán hàng nhanh chóng
- **Quản lý sản phẩm**: Thêm, sửa, xóa sản phẩm với hình ảnh
- **Quản lý khách hàng**: Theo dõi thông tin khách hàng
- **Quản lý đơn hàng**: Xem và xử lý đơn hàng

### 📈 Báo cáo và phân tích
- **Báo cáo doanh thu**: Theo ngày, tuần, tháng
- **Báo cáo sản phẩm**: Sản phẩm bán chạy, tồn kho
- **Biểu đồ tương tác**: Chart.js với dữ liệu thời gian thực
- **Export Excel**: Xuất báo cáo ra file Excel

### 🔐 Bảo mật
- **JWT Authentication**: Xác thực người dùng
- **Role-based Access**: Phân quyền theo vai trò
- **Rate Limiting**: Giới hạn số lượng request
- **Data Validation**: Kiểm tra dữ liệu đầu vào

### 💳 Thanh toán
- **VietQR Integration**: Tạo mã QR thanh toán
- **Multiple Payment Methods**: Tiền mặt, chuyển khoản
- **Receipt Printing**: In hóa đơn tự động

## 🗄️ Database Schema

### Bảng chính:
- `users`: Quản lý người dùng
- `products`: Sản phẩm
- `customers`: Khách hàng  
- `sales_orders`: Đơn hàng
- `sales_order_items`: Chi tiết đơn hàng
- `qr_payments`: Thanh toán QR

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **bcrypt**: Password hashing
- **Input validation**: Joi validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content sanitization

## 📱 Mobile Responsive

Giao diện được tối ưu cho:
- Desktop (1920x1080+)
- Tablet (768x1024)
- Mobile (375x667+)

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- Chart.js
- Axios
- React Router

**Backend:**
- Node.js + Express
- TypeScript
- MySQL/SQLite
- JWT Authentication
- Multer (file upload)

**DevOps:**
- PM2 (Process Manager)
- Nginx (Reverse Proxy)
- Let's Encrypt (SSL)
- Docker (optional)

## 📝 API Documentation

### Authentication
```
POST /api/auth/login
POST /api/auth/register
GET /api/auth/me
```

### Products
```
GET /api/products
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id
```

### Orders
```
GET /api/sales
POST /api/sales
GET /api/sales/:id
PUT /api/sales/:id
```

### Reports
```
GET /api/reports/business-overview
GET /api/reports/products
GET /api/reports/revenue
```

## 🔄 Backup & Restore

### Automatic Backup
- Database backup hàng ngày lúc 2:00 AM
- Lưu trữ 7 ngày gần nhất
- Backup file uploads

### Manual Backup
```bash
# Trên server
pos-backup.sh

# Restore database
mysql -u pos_user -p pos_system < backup_file.sql
```

## 🚨 Troubleshooting

### Common Issues:

1. **Port 3001 already in use**
```bash
sudo lsof -i :3001
sudo kill -9 PID
```

2. **Database connection error**
```bash
mysql -u pos_user -p
# Check if user exists and has permissions
```

3. **Nginx 502 Bad Gateway**
```bash
pm2 status
pm2 restart pos-system
sudo systemctl restart nginx
```

4. **SSL certificate issues**
```bash
sudo certbot renew
sudo systemctl reload nginx
```

## 📞 Support

- **Documentation**: [VPS-DEPLOYMENT-GUIDE.md](VPS-DEPLOYMENT-GUIDE.md)
- **Issues**: GitHub Issues
- **Email**: your-email@domain.com

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Developed with ❤️ for Vietnamese retail businesses** 