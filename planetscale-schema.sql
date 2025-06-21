-- PlanetScale Schema for POS System
-- Note: PlanetScale doesn't support foreign key constraints, so we remove them

-- Categories table
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_name (name),
  INDEX idx_categories_active (is_active)
);

-- Products table
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(100),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INT,
  unit VARCHAR(20) DEFAULT 'Cái',
  purchase_price DECIMAL(15,2) DEFAULT 0.00,
  sale_price DECIMAL(15,2) NOT NULL,
  wholesale_price DECIMAL(15,2) DEFAULT 0.00,
  promo_price DECIMAL(15,2),
  stock_quantity INT DEFAULT 0,
  min_stock_level INT DEFAULT 0,
  max_stock_level INT DEFAULT 1000,
  expiry_date DATE,
  image_url TEXT,
  has_variants BOOLEAN DEFAULT FALSE,
  track_inventory BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_sku (sku),
  INDEX idx_products_barcode (barcode),
  INDEX idx_products_name (name),
  INDEX idx_products_category (category_id),
  INDEX idx_products_active (is_active),
  INDEX idx_products_stock (stock_quantity)
);

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'sales', 'warehouse', 'accountant', 'delivery') DEFAULT 'sales',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_username (username),
  INDEX idx_users_role (role),
  INDEX idx_users_active (is_active)
);

-- Customers table
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ma_khach_hang VARCHAR(20) UNIQUE NOT NULL,
  ten_khach_hang VARCHAR(100) NOT NULL,
  so_dien_thoai VARCHAR(15),
  dia_chi TEXT,
  email VARCHAR(100),
  ngay_sinh DATE,
  gioi_tinh ENUM('Nam', 'Nữ', 'Khác'),
  loai_khach_hang ENUM('Bán lẻ', 'Bán sỉ', 'VIP', 'Thường xuyên') DEFAULT 'Bán lẻ',
  han_muc_tin_dung DECIMAL(15,2) DEFAULT 0.00,
  so_du_hien_tai DECIMAL(15,2) DEFAULT 0.00,
  diem_tich_luy INT DEFAULT 0,
  ghi_chu TEXT,
  trang_thai ENUM('Hoạt động', 'Ngừng hoạt động') DEFAULT 'Hoạt động',
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customers_ma (ma_khach_hang),
  INDEX idx_customers_ten (ten_khach_hang),
  INDEX idx_customers_sdt (so_dien_thoai),
  INDEX idx_customers_loai (loai_khach_hang),
  INDEX idx_customers_trang_thai (trang_thai)
);

-- Sales orders table
CREATE TABLE sales_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(15),
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  discount_percent DECIMAL(5,2) DEFAULT 0.00,
  discount_amount DECIMAL(15,2) DEFAULT 0.00,
  total_amount DECIMAL(15,2) NOT NULL,
  payment_method ENUM('cash', 'card', 'transfer', 'e_wallet') DEFAULT 'cash',
  payment_status ENUM('paid', 'partial', 'unpaid') DEFAULT 'paid',
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sales_orders_number (order_number),
  INDEX idx_sales_orders_customer (customer_id),
  INDEX idx_sales_orders_date (created_at),
  INDEX idx_sales_orders_status (payment_status),
  INDEX idx_sales_orders_created_by (created_by)
);

-- Sales order items table
CREATE TABLE sales_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0.00,
  total DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sales_order_items_order (order_id),
  INDEX idx_sales_order_items_product (product_id)
);

-- Store settings table
CREATE TABLE store_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_store_settings_key (setting_key)
);

-- QR payments table
CREATE TABLE qr_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id VARCHAR(50) NOT NULL,
  provider_name VARCHAR(100) NOT NULL,
  provider_type ENUM('bank', 'ewallet') NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_owner VARCHAR(100) NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_qr_payments_provider (provider_id),
  INDEX idx_qr_payments_status (status)
);

-- Inventory transactions table
CREATE TABLE inventory_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  transaction_type ENUM('in', 'out') NOT NULL,
  reference_type ENUM('sale', 'purchase', 'adjustment', 'return') NOT NULL,
  reference_id INT,
  quantity DECIMAL(10,3) NOT NULL,
  notes TEXT,
  user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_inventory_transactions_product (product_id),
  INDEX idx_inventory_transactions_type (transaction_type),
  INDEX idx_inventory_transactions_date (created_at)
);

-- Insert default data
INSERT INTO categories (name, description) VALUES 
('Thực phẩm', 'Các sản phẩm thực phẩm'),
('Đồ uống', 'Các loại đồ uống'),
('Gia dụng', 'Đồ gia dụng hàng ngày'),
('Điện tử', 'Thiết bị điện tử'),
('Thời trang', 'Quần áo, phụ kiện');

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, full_name, role) VALUES 
('admin', '$2b$10$rOzJayTgFBYSh6/pz7Gj9O4h6oqZe1HQq5PJGGwl8xHtjPJ4nFoG6', 'Administrator', 'admin');

-- Insert default store settings
INSERT INTO store_settings (setting_key, setting_value, description) VALUES 
('store_name', 'Cửa hàng ABC', 'Tên cửa hàng'),
('store_address', '123 Đường ABC, Quận 1, TP.HCM', 'Địa chỉ cửa hàng'),
('store_phone', '0123456789', 'Số điện thoại cửa hàng'),
('store_email', 'contact@store.com', 'Email cửa hàng'),
('tax_rate', '10', 'Thuế VAT (%)'),
('currency', 'VND', 'Đơn vị tiền tệ'),
('receipt_footer', 'Cảm ơn quý khách!', 'Footer trên hóa đơn'),
('low_stock_threshold', '10', 'Ngưỡng cảnh báo hết hàng'); 