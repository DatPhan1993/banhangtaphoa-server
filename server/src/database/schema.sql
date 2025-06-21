-- Users table (quản lý nhân viên và phân quyền)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'staff', 'warehouse', 'accountant', 'delivery') NOT NULL DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table (danh mục sản phẩm)
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Products table (sản phẩm)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT,
    unit VARCHAR(20) NOT NULL DEFAULT 'cái',
    purchase_price DECIMAL(15,2) DEFAULT 0,
    sale_price DECIMAL(15,2) NOT NULL,
    wholesale_price DECIMAL(15,2),
    promo_price DECIMAL(15,2),
    stock_quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 0,
    max_stock_level INT,
    expiry_date DATE,
    image_url VARCHAR(500),
    has_variants BOOLEAN DEFAULT FALSE,
    track_inventory BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Suppliers table (nhà cung cấp)
CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    tax_code VARCHAR(50),
    payment_terms VARCHAR(100),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers table (khách hàng)
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_khach_hang VARCHAR(50) UNIQUE NOT NULL COMMENT 'Mã khách hàng',
    ten_khach_hang VARCHAR(200) NOT NULL COMMENT 'Tên khách hàng',
    so_dien_thoai VARCHAR(20) COMMENT 'Số điện thoại',
    dia_chi TEXT COMMENT 'Địa chỉ',
    email VARCHAR(100) COMMENT 'Email',
    ngay_sinh DATE COMMENT 'Ngày sinh',
    gioi_tinh ENUM('Nam', 'Nữ', 'Khác') COMMENT 'Giới tính',
    loai_khach_hang ENUM('Bán lẻ', 'Bán sỉ', 'VIP', 'Thường xuyên') DEFAULT 'Bán lẻ' COMMENT 'Loại khách hàng',
    han_muc_tin_dung DECIMAL(15,2) DEFAULT 0 COMMENT 'Hạn mức tín dụng',
    so_du_hien_tai DECIMAL(15,2) DEFAULT 0 COMMENT 'Số dư hiện tại',
    diem_tich_luy INT DEFAULT 0 COMMENT 'Điểm tích lũy',
    ghi_chu TEXT COMMENT 'Ghi chú',
    trang_thai ENUM('Hoạt động', 'Ngừng hoạt động') DEFAULT 'Hoạt động' COMMENT 'Trạng thái',
    ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày tạo',
    ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Ngày cập nhật',
    
    INDEX idx_ma_khach_hang (ma_khach_hang),
    INDEX idx_ten_khach_hang (ten_khach_hang),
    INDEX idx_so_dien_thoai (so_dien_thoai),
    INDEX idx_loai_khach_hang (loai_khach_hang),
    INDEX idx_trang_thai (trang_thai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng quản lý khách hàng';

-- Purchase orders table (đơn nhập hàng)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT NOT NULL,
    user_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_date DATE,
    status ENUM('pending', 'received', 'cancelled') DEFAULT 'pending',
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Purchase order items table (chi tiết đơn nhập hàng)
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    received_quantity INT DEFAULT 0,
    expiry_date DATE,
    batch_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sales orders table (đơn hàng bán)
CREATE TABLE IF NOT EXISTS sales_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    user_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    order_type ENUM('pos', 'online', 'phone') DEFAULT 'pos',
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    payment_method ENUM('cash', 'card', 'transfer', 'ewallet', 'credit') DEFAULT 'cash',
    delivery_address TEXT,
    delivery_fee DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sales order items table (chi tiết đơn hàng bán)
CREATE TABLE IF NOT EXISTS sales_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sales_order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Inventory transactions table (lịch sử xuất nhập kho)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    transaction_type ENUM('in', 'out', 'adjustment') NOT NULL,
    reference_type ENUM('purchase', 'sale', 'adjustment', 'return') NOT NULL,
    reference_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(15,2),
    batch_number VARCHAR(50),
    expiry_date DATE,
    notes TEXT,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Promotions table (khuyến mãi)
CREATE TABLE IF NOT EXISTS promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type ENUM('percentage', 'fixed_amount', 'bogo', 'quantity_discount') NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    min_quantity INT DEFAULT 1,
    min_amount DECIMAL(15,2) DEFAULT 0,
    applicable_to ENUM('all', 'categories', 'products', 'customers') DEFAULT 'all',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Store settings table (cài đặt cửa hàng)
CREATE TABLE IF NOT EXISTS store_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Initial admin user
INSERT IGNORE INTO users (username, email, password_hash, full_name, role, is_active) 
VALUES ('admin', 'admin@store.com', '$2b$10$8K1p/a0dWEf3BIFWxk5z4u7LR9Q2G3H5B6M9N0P1Y2Z3V4C5X6Y7Z8', 'Store Administrator', 'admin', TRUE);

-- Initial store settings
INSERT IGNORE INTO store_settings (setting_key, setting_value, description) VALUES
('store_name', 'My Store', 'Tên cửa hàng'),
('store_address', '123 Main Street', 'Địa chỉ cửa hàng'),
('store_phone', '0123456789', 'Số điện thoại cửa hàng'),
('store_email', 'store@example.com', 'Email cửa hàng'),
('tax_rate', '10', 'Thuế VAT (%)'),
('currency', 'VND', 'Đơn vị tiền tệ'),
('receipt_footer', 'Cảm ơn bạn đã mua hàng!', 'Footer cho hóa đơn'),
('low_stock_threshold', '10', 'Ngưỡng cảnh báo hết hàng');

-- Sample categories
INSERT IGNORE INTO categories (name, description) VALUES
('Thực phẩm', 'Các sản phẩm thực phẩm'),
('Đồ uống', 'Các loại đồ uống'),
('Gia vị', 'Gia vị và đồ khô'),
('Vệ sinh cá nhân', 'Các sản phẩm vệ sinh cá nhân'),
('Gia dụng', 'Đồ gia dụng');

-- Sample products
INSERT IGNORE INTO products (sku, name, category_id, unit, purchase_price, sale_price, stock_quantity, min_stock_level) VALUES
('SP001', 'Gạo ST25 5kg', 1, 'túi', 45000, 50000, 100, 10),
('SP002', 'Nước mắm Nam Ngư 500ml', 3, 'chai', 25000, 30000, 50, 5),
('SP003', 'Coca Cola 330ml', 2, 'lon', 8000, 12000, 200, 20),
('SP004', 'Bánh mì sandwich', 1, 'ổ', 15000, 20000, 30, 5),
('SP005', 'Dầu gội Head & Shoulders 400ml', 4, 'chai', 120000, 150000, 25, 3); 