# 🌐 Setup Domain ththuyhuong.food

## 📋 **Thông tin hiện tại**

- **Backend**: https://aabanhangtaphoa-e6t51vpd8-phan-dats-projects-d067d5c1.vercel.app
- **Frontend**: https://aabanhangtaphoa-client-4nwagv5g0-phan-dats-projects-d067d5c1.vercel.app
- **Domain mong muốn**: ththuyhuong.food

## 🔧 **Bước 1: Setup Frontend Domain**

### 1.1 Vào Vercel Dashboard
1. Truy cập: https://vercel.com/dashboard
2. Chọn project: **aabanhangtaphoa-client**
3. Vào tab **Settings** → **Domains**

### 1.2 Thêm Domain
1. Click **Add Domain**
2. Nhập: `ththuyhuong.food`
3. Click **Add**

### 1.3 Cấu hình DNS
Vercel sẽ hiển thị DNS records cần thêm:

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

## 🔧 **Bước 2: Setup Backend Subdomain**

### 2.1 Vào Backend Project
1. Chọn project: **aabanhangtaphoa**
2. Vào **Settings** → **Domains**

### 2.2 Thêm API Subdomain
1. Click **Add Domain**
2. Nhập: `api.ththuyhuong.food`
3. Click **Add**

### 2.3 Cấu hình DNS cho API
```
Type: CNAME
Name: api
Value: cname.vercel-dns.com
```

## 🔧 **Bước 3: Cấu hình DNS tại nhà cung cấp domain**

Vào panel quản lý DNS của nhà cung cấp domain và thêm:

```
# Frontend
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 300

Type: CNAME
Name: www  
Value: cname.vercel-dns.com
TTL: 300

# Backend API
Type: CNAME
Name: api
Value: cname.vercel-dns.com
TTL: 300
```

## 🔧 **Bước 4: Cập nhật Environment Variables**

### 4.1 Backend Environment
Vào **aabanhangtaphoa** → **Settings** → **Environment Variables**

Cập nhật:
```
CORS_ORIGIN=https://ththuyhuong.food
```

### 4.2 Frontend Environment  
Vào **aabanhangtaphoa-client** → **Settings** → **Environment Variables**

Thêm:
```
REACT_APP_API_URL=https://api.ththuyhuong.food/api
```

## 🔧 **Bước 5: Redeploy**

### 5.1 Redeploy Backend
```bash
cd server
vercel --prod
```

### 5.2 Redeploy Frontend
```bash
cd client
vercel --prod
```

## ✅ **Kết quả cuối cùng**

Sau khi hoàn thành:

- **Website**: https://ththuyhuong.food
- **API**: https://api.ththuyhuong.food/api
- **SSL**: Tự động được cấp bởi Vercel
- **Performance**: Global CDN, auto-scaling

## 🔍 **Kiểm tra**

1. **Test Frontend**: Truy cập https://ththuyhuong.food
2. **Test API**: Truy cập https://api.ththuyhuong.food/api/health
3. **Test Login**: admin / admin123

## ⏱️ **Thời gian**

- DNS propagation: 5-30 phút
- SSL certificate: 1-5 phút
- Total: Khoảng 30 phút

## 🚨 **Lưu ý quan trọng**

1. **Database**: Hiện tại chưa có database, cần setup PlanetScale hoặc MySQL
2. **Environment Variables**: Cần set đầy đủ cho backend
3. **DNS**: Phải có quyền quản lý DNS của domain ththuyhuong.food

## 📞 **Hỗ trợ**

Nếu gặp vấn đề:
1. Kiểm tra DNS propagation: https://dnschecker.org
2. Kiểm tra SSL: https://www.ssllabs.com/ssltest/
3. Xem logs tại Vercel Dashboard 