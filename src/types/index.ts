export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'staff' | 'warehouse' | 'accountant' | 'delivery';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: number;
  unit: string;
  purchase_price: number;
  sale_price: number;
  wholesale_price?: number;
  promo_price?: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level?: number;
  expiry_date?: string;
  image_url?: string;
  has_variants: boolean;
  track_inventory: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_code?: string;
  payment_terms?: string;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  ma_khach_hang: string;
  ten_khach_hang: string;
  so_dien_thoai?: string;
  dia_chi?: string;
  email?: string;
  ngay_sinh?: string;
  gioi_tinh?: 'Nam' | 'Nữ' | 'Khác';
  loai_khach_hang: 'Bán lẻ' | 'Bán sỉ' | 'VIP' | 'Thường xuyên';
  han_muc_tin_dung: number;
  so_du_hien_tai: number;
  diem_tich_luy: number;
  ghi_chu?: string;
  trang_thai: 'Hoạt động' | 'Ngừng hoạt động';
  ngay_tao: string;
  ngay_cap_nhat: string;
}

export interface SalesOrder {
  id: number;
  order_number: string;
  customer_id?: number;
  user_id: number;
  order_date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  order_type: 'pos' | 'online' | 'phone';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'ewallet' | 'credit';
  delivery_address?: string;
  delivery_fee: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesOrderItem {
  id: number;
  sales_order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  user_id: number;
  order_date: string;
  delivery_date?: string;
  status: 'pending' | 'received' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  received_quantity: number;
  expiry_date?: string;
  batch_number?: string;
  created_at: string;
}

export interface InventoryTransaction {
  id: number;
  product_id: number;
  transaction_type: 'in' | 'out' | 'adjustment';
  reference_type: 'purchase' | 'sale' | 'adjustment' | 'return';
  reference_id?: number;
  quantity: number;
  unit_price?: number;
  batch_number?: string;
  expiry_date?: string;
  notes?: string;
  user_id: number;
  created_at: string;
}

export interface Promotion {
  id: number;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'bogo' | 'quantity_discount';
  value: number;
  min_quantity: number;
  min_amount: number;
  applicable_to: 'all' | 'categories' | 'products' | 'customers';
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  tax_rate: number;
  currency_code: string;
  receipt_template?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

// API Request/Response types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'staff' | 'warehouse' | 'accountant' | 'delivery';
}

export interface CreateProductRequest {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: number;
  unit: string;
  purchase_price: number;
  sale_price: number;
  wholesale_price?: number;
  stock_quantity: number;
  min_stock_level: number;
  image_url?: string;
}

export interface CreateCustomerRequest {
  ma_khach_hang: string;
  ten_khach_hang: string;
  so_dien_thoai?: string;
  dia_chi?: string;
  email?: string;
  ngay_sinh?: string;
  gioi_tinh?: 'Nam' | 'Nữ' | 'Khác';
  loai_khach_hang?: 'Bán lẻ' | 'Bán sỉ' | 'VIP' | 'Thường xuyên';
  han_muc_tin_dung?: number;
  so_du_hien_tai?: number;
  diem_tich_luy?: number;
  ghi_chu?: string;
  trang_thai?: 'Hoạt động' | 'Ngừng hoạt động';
}

export interface CreateSalesOrderRequest {
  customer_id?: number;
  items: {
    product_id: number;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
  }[];
  payment_method: 'cash' | 'card' | 'transfer' | 'ewallet' | 'credit';
  discount_amount?: number;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 