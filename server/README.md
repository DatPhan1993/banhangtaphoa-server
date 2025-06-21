# 🏪 Bán Hàng Tạp Hóa - Server

Backend API cho hệ thống quản lý cửa hàng tạp hóa Thu Hương.

## 🚀 **Tính năng**

- ✅ **Quản lý sản phẩm**: Thêm, sửa, xóa, tìm kiếm sản phẩm
- ✅ **Quản lý khách hàng**: Thông tin khách hàng, lịch sử mua hàng
- ✅ **Bán hàng POS**: Tạo đơn hàng, tính tiền, in hóa đơn
- ✅ **Báo cáo**: Doanh thu, lợi nhuận, tồn kho
- ✅ **QR Payment**: Tích hợp thanh toán QR code
- ✅ **In hóa đơn**: Template tùy chỉnh
- ✅ **Xuất Excel**: Báo cáo và đơn hàng

## 🛠️ **Công nghệ**

- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL
- **Authentication**: JWT
- **Security**: Helmet, CORS
- **Validation**: Express Validator
- **Logging**: Morgan

## 📦 **Cài đặt**

```bash
# Clone repository
git clone https://github.com/DatPhan1993/banhangtaphoa-server.git
cd banhangtaphoa-server

# Cài đặt dependencies
npm install

# Copy environment variables
cp .env.example .env

# Chỉnh sửa .env với thông tin database của bạn
# DB_HOST=your-mysql-host
# DB_USER=your-username
# DB_PASSWORD=your-password
# DB_NAME=your-database

# Build TypeScript
npm run build

# Chạy server
npm start
```

## 🔧 **Development**

```bash
# Chạy trong development mode
npm run dev

# Build TypeScript
npm run build

# Lint code
npm run lint
```

## 📋 **API Endpoints**

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Thông tin user hiện tại

### Products
- `GET /api/products` - Danh sách sản phẩm
- `POST /api/products` - Thêm sản phẩm
- `PUT /api/products/:id` - Cập nhật sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm

### Sales
- `POST /api/sales/orders` - Tạo đơn hàng
- `GET /api/sales/orders` - Danh sách đơn hàng
- `GET /api/sales/orders/:id` - Chi tiết đơn hàng

### Customers
- `GET /api/customers` - Danh sách khách hàng
- `POST /api/customers` - Thêm khách hàng
- `PUT /api/customers/:id` - Cập nhật khách hàng

### Reports
- `GET /api/reports/sales` - Báo cáo doanh thu
- `GET /api/reports/products` - Báo cáo sản phẩm
- `GET /api/reports/inventory` - Báo cáo tồn kho

## 🗄️ **Database Schema**

Xem file `src/database/schema.sql` để biết cấu trúc database.

## 🚀 **Deploy**

### Vercel
```bash
# Deploy lên Vercel
vercel --prod
```

### Railway
```bash
# Deploy lên Railway
railway up
```

### VPS
```bash
# Chạy với PM2
pm2 start ecosystem.config.js
```

## 🔒 **Environment Variables**

```env
NODE_ENV=production
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

## 📞 **Hỗ trợ**

- **Website**: https://ththuyhuong.food
- **Email**: support@ththuyhuong.food
- **Phone**: 0123456789

## 📄 **License**

MIT License

---

**Phát triển bởi**: [DatPhan1993](https://github.com/DatPhan1993)  
**Dành cho**: Cửa hàng tạp hóa Thu Hương 