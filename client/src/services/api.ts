import axios, { AxiosResponse } from 'axios';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://aabanhangtaphoa-e6t51vpd8-phan-dats-projects-d067d5c1.vercel.app/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('Token expired, clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.log('Access forbidden');
      // Don't redirect for 403, just show error
    }
    
    return Promise.reject(error);
  }
);

// Base API Response interface
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Types
export interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'admin' | 'sales' | 'warehouse' | 'accountant' | 'delivery';
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: number;
  category_name?: string;
  unit: string;
  purchase_price?: number;
  sale_price: number;
  wholesale_price?: number;
  promo_price?: number;
  stock_quantity?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  expiry_date?: string;
  image_url?: string;
  has_variants?: boolean;
  track_inventory?: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalesOrderItem {
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
}

export interface SalesOrder {
  customer_name?: string;
  customer_phone?: string;
  items: SalesOrderItem[];
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'e_wallet';
  payment_status: 'paid' | 'partial' | 'unpaid';
  notes?: string;
}

export interface SalesOrderResponse {
  id: number;
  order_number: string;
  ma_khach_hang?: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  notes?: string;
  created_by: number;
  created_at: string;
  items: Array<{
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    total: number;
  }>;
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

export interface StoreSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface StoreSettingsUpdate {
  store_name?: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  tax_rate?: string;
  currency?: string;
  receipt_footer?: string;
  low_stock_threshold?: string;
}

export interface QRPaymentRegistration {
  provider_id: string;
  provider_name: string;
  provider_type: 'bank' | 'ewallet';
  account_number: string;
  account_owner: string;
  phone_number: string;
  terms_agreed: boolean;
}

export interface QRPaymentAccount {
  id: number;
  provider_id: string;
  provider_name: string;
  provider_type: 'bank' | 'ewallet';
  account_number: string;
  account_owner: string;
  phone_number: string;
  status: 'active' | 'inactive' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface QRPaymentRegistrationResponse {
  id: number;
  provider_name: string;
  account_number: string;
  account_owner: string;
  phone_number: string;
  message: string;
}

// API Methods
export const api = {
  // Auth
  login: (data: LoginRequest): Promise<AxiosResponse<LoginResponse>> =>
    apiClient.post('/auth/login', data),

  // Products
  getProducts: (params?: { search?: string; category_id?: number; is_active?: boolean; limit?: number }): Promise<AxiosResponse<ApiResponse<Product[]>>> =>
    apiClient.get('/products', { params }),

  getProduct: (id: number): Promise<AxiosResponse<ApiResponse<Product>>> =>
    apiClient.get(`/products/${id}`),

  createProduct: (data: Partial<Product>): Promise<AxiosResponse<ApiResponse<Product>>> =>
    apiClient.post('/products', data),

  updateProduct: (id: number, data: Partial<Product>): Promise<AxiosResponse<ApiResponse<Product>>> =>
    apiClient.put(`/products/${id}`, data),

  deleteProduct: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/products/${id}`),

  deleteAllProducts: (): Promise<AxiosResponse<ApiResponse<{ deleted_count: number }>>> =>
    apiClient.delete('/products/bulk/all'),

  bulkCreateProducts: (products: Partial<Product>[]): Promise<AxiosResponse<ApiResponse<{ created_count: number; errors: any[] }>>> =>
    apiClient.post('/products/bulk/create', { products }),

  exportProducts: (): Promise<AxiosResponse<Blob>> =>
    apiClient.get('/products/export', { responseType: 'blob' }),

  importProducts: (file: File): Promise<AxiosResponse<ApiResponse<{
    total_rows: number;
    success_count: number;
    error_count: number;
    errors: any[];
  }>>> => {
    const formData = new FormData();
    formData.append('excel', file);
    
    return apiClient.post('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateStock: (id: number, data: { quantity: number; type: 'in' | 'out'; notes?: string }): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.post(`/products/${id}/stock`, data),

  // Categories
  getCategories: (): Promise<AxiosResponse<ApiResponse<Category[]>>> =>
    apiClient.get('/categories'),

  // Sales
  createSalesOrder: (data: SalesOrder): Promise<AxiosResponse<ApiResponse<SalesOrderResponse>>> =>
    apiClient.post('/sales/orders', data),

  getSalesOrders: (params?: { 
    start_date?: string; 
    end_date?: string; 
    status?: string;
    created_by?: number;
    search?: string;
  }): Promise<AxiosResponse<ApiResponse<SalesOrderResponse[]>>> =>
    apiClient.get('/sales/orders', { params }),

  getSalesOrder: (id: number): Promise<AxiosResponse<ApiResponse<SalesOrderResponse>>> =>
    apiClient.get(`/sales/orders/${id}`),

  // Dashboard stats
  getDashboardStats: (): Promise<AxiosResponse<ApiResponse<{
    total_products: number;
    out_of_stock: number;
    low_stock: number;
    total_inventory_value: number;
  }>>> =>
    apiClient.get('/products/dashboard-stats'),

  // Customers
  getCustomers: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    loai_khach_hang?: string;
    trang_thai?: string;
  }): Promise<AxiosResponse<ApiResponse<{
    customers: Customer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>>> =>
    apiClient.get('/customers', { params }),

  getCustomer: (id: number): Promise<AxiosResponse<ApiResponse<Customer>>> =>
    apiClient.get(`/customers/${id}`),

  createCustomer: (data: CreateCustomerRequest): Promise<AxiosResponse<ApiResponse<Customer>>> =>
    apiClient.post('/customers', data),

  updateCustomer: (id: number, data: Partial<CreateCustomerRequest>): Promise<AxiosResponse<ApiResponse<Customer>>> =>
    apiClient.put(`/customers/${id}`, data),

  deleteCustomer: (id: number): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.delete(`/customers/${id}`),

  generateCustomerCode: (): Promise<AxiosResponse<ApiResponse<{ ma_khach_hang: string }>>> =>
    apiClient.get('/customers/generate-code'),

  exportCustomersExcel: (): Promise<AxiosResponse<Blob>> =>
    apiClient.get('/customers/export', { responseType: 'blob' }),

  importCustomersExcel: (formData: FormData): Promise<AxiosResponse<ApiResponse<{ imported: number; errors: any[] }>>> =>
    apiClient.post('/customers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Store Settings
  getStoreSettings: (): Promise<AxiosResponse<ApiResponse<StoreSetting[]>>> =>
    apiClient.get('/store-settings'),

  updateStoreSettings: (data: StoreSettingsUpdate): Promise<AxiosResponse<ApiResponse<void>>> =>
    apiClient.put('/store-settings', data),

  // QR Payment Management
  registerQRPayment: (data: QRPaymentRegistration): Promise<AxiosResponse<ApiResponse<QRPaymentRegistrationResponse>>> =>
    apiClient.post('/qr-payments/register', data),

  getQRPaymentAccounts: (): Promise<AxiosResponse<ApiResponse<QRPaymentAccount[]>>> =>
    apiClient.get('/qr-payments/accounts'),

  deactivateQRPaymentAccount: (id: number): Promise<AxiosResponse<ApiResponse<{ message: string }>>> =>
    apiClient.patch(`/qr-payments/accounts/${id}/deactivate`),

  // Business reports
  getBusinessOverview: (startDate: string, endDate: string): Promise<AxiosResponse<ApiResponse<any>>> =>
    apiClient.get('/reports/business-overview', {
      params: { startDate, endDate }
    }),

  // Product overview
  getProductOverview: (startDate: string, endDate: string): Promise<AxiosResponse<ApiResponse<any>>> =>
    apiClient.get('/reports/product-overview', {
      params: { startDate, endDate }
    }),
};

export default api; 