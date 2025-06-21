# 🚀 Deploy POS System lên Vercel + PlanetScale

## 📋 **Tổng quan**

- **Frontend**: Vercel (React)
- **Backend**: Vercel Functions (Node.js API)
- **Database**: PlanetScale (MySQL)
- **Cost**: **FREE** cho usage nhỏ

---

## 🛠️ **Bước 1: Chuẩn bị**

### 1.1 Cài đặt CLI tools

```bash
# Cài Vercel CLI
npm install -g vercel

# Cài PlanetScale CLI (macOS)
brew install planetscale/tap/pscale

# Cài PlanetScale CLI (Linux)
curl -fsSL https://github.com/planetscale/cli/releases/latest/download/pscale_linux_amd64.tar.gz | tar -xz
sudo mv pscale /usr/local/bin
```

### 1.2 Tạo tài khoản

1. **Vercel**: https://vercel.com (đăng nhập bằng GitHub)
2. **PlanetScale**: https://planetscale.com (đăng ký miễn phí)

---

## 🗄️ **Bước 2: Setup Database (PlanetScale)**

### 2.1 Tạo database

```bash
# Đăng nhập PlanetScale
pscale auth login

# Tạo database mới
pscale database create pos-system

# Import schema
pscale shell pos-system main < planetscale-schema.sql
```

### 2.2 Tạo password để connect

```bash
# Tạo password cho production
pscale password create pos-system main pos-production

# Lưu thông tin connection:
# Host: xxxxx.psdb.cloud
# Username: xxxxx
# Password: xxxxx
```

---

## 🔧 **Bước 3: Deploy Backend**

### 3.1 Build backend

```bash
cd server
npm run build
```

### 3.2 Deploy lên Vercel

```bash
# Deploy backend
vercel --prod

# Chọn:
# - Link to existing project? No
# - Project name: pos-system-backend
# - Directory: ./server
```

### 3.3 Set environment variables

Vào **Vercel Dashboard** → **Project Settings** → **Environment Variables**:

```env
NODE_ENV=production
DB_HOST=xxxxx.psdb.cloud
DB_USER=xxxxx
DB_PASSWORD=xxxxx
DB_NAME=pos-system
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

### 3.4 Redeploy sau khi set env

```bash
vercel --prod
```

---

## 🌐 **Bước 4: Deploy Frontend**

### 4.1 Update API URL

Sửa file `client/src/services/api.ts`:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-backend-url.vercel.app/api';
```

### 4.2 Build frontend

```bash
cd client
npm run build
```

### 4.3 Deploy lên Vercel

```bash
# Deploy frontend
vercel --prod

# Chọn:
# - Link to existing project? No
# - Project name: pos-system-frontend
# - Directory: ./client
```

### 4.4 Set environment variables

Vào **Vercel Dashboard** → **Frontend Project** → **Environment Variables**:

```env
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
GENERATE_SOURCEMAP=false
```

### 4.5 Redeploy frontend

```bash
vercel --prod
```

---

## ⚡ **Bước 5: Sử dụng Script Tự động**

```bash
# Chạy script deploy tự động
./deploy-vercel.sh
```

Script sẽ:
- ✅ Kiểm tra và cài đặt CLI tools
- ✅ Build cả frontend và backend
- ✅ Deploy lên Vercel
- ✅ Hướng dẫn set environment variables

---

## 🔍 **Bước 6: Kiểm tra**

### 6.1 Test backend

```bash
curl https://your-backend-url.vercel.app/api/health
```

### 6.2 Test frontend

1. Mở https://your-frontend-url.vercel.app
2. Đăng nhập: `admin` / `admin123`
3. Kiểm tra các chức năng

---

## 📊 **Giới hạn Free Tier**

### PlanetScale Free
- ✅ 1 database
- ✅ 1 billion row reads/month
- ✅ 10 million row writes/month
- ✅ 5GB storage

### Vercel Free
- ✅ 100GB bandwidth/month
- ✅ 100 serverless function executions/day
- ✅ Custom domains
- ✅ Automatic HTTPS

---

## 🚀 **Bước 7: Custom Domain (Optional)**

### 7.1 Frontend domain

1. Vào Vercel Dashboard → Frontend Project → **Domains**
2. Thêm domain: `yourdomain.com`
3. Cấu hình DNS theo hướng dẫn

### 7.2 Backend domain

1. Vào Vercel Dashboard → Backend Project → **Domains**
2. Thêm subdomain: `api.yourdomain.com`
3. Update frontend API URL

---

## 🔧 **Troubleshooting**

### Lỗi Database Connection

```bash
# Test PlanetScale connection
pscale shell pos-system main
```

### Lỗi CORS

Kiểm tra `CORS_ORIGIN` trong backend environment variables.

### Lỗi Build

```bash
# Clear cache và rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Function Timeout

Vercel free có giới hạn 10s execution time. Optimize queries nếu cần.

---

## 📈 **Monitoring**

### Vercel Analytics
- Vào Dashboard → Project → **Analytics**
- Xem traffic, performance, errors

### PlanetScale Insights
- Vào PlanetScale Dashboard → **Insights**
- Monitor queries, connections

---

## 🔄 **CI/CD Setup (Optional)**

### GitHub Actions

Tạo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 🎉 **Hoàn thành!**

Bạn đã có một hệ thống POS hoàn chỉnh trên cloud:

- 🌐 **Frontend**: https://your-frontend.vercel.app
- 🔗 **Backend**: https://your-backend.vercel.app/api
- 🗄️ **Database**: PlanetScale MySQL
- 💰 **Cost**: **FREE** (trong giới hạn)
- 🚀 **Performance**: Global CDN + Auto scaling
- 🔒 **Security**: HTTPS + Environment variables

**Default Login**: `admin` / `admin123`

---

## 📞 **Support**

Nếu gặp vấn đề:
1. Check Vercel Function Logs
2. Check PlanetScale Query Insights  
3. Test local development trước
4. Đọc Vercel/PlanetScale documentation 