import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  FileText, 
  DollarSign, 
  Warehouse,
  X,
  Trash2
} from 'lucide-react';
import { api, Product, Category } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface ProductModalProps {
  product?: Product;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, categories, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    barcode: '',
    category_id: 0,
    unit: 'cái',
    purchase_price: 0,
    sale_price: 0,
    wholesale_price: 0,
    promo_price: 0,
    stock_quantity: 0,
    min_stock_level: 0,
    max_stock_level: 0,
    expiry_date: '',
    image_url: '',
    description: '',
    has_variants: false,
    track_inventory: true,
    is_active: true,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        expiry_date: product.expiry_date ? new Date(product.expiry_date).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        category_id: categories[0]?.id || 0,
        unit: 'cái',
        purchase_price: 0,
        sale_price: 0,
        wholesale_price: 0,
        promo_price: 0,
        stock_quantity: 0,
        min_stock_level: 0,
        max_stock_level: 0,
        expiry_date: '',
        image_url: '',
        description: '',
        has_variants: false,
        track_inventory: true,
        is_active: true,
      });
    }
  }, [product, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {product ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên sản phẩm *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã SKU *
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập mã SKU"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã vạch
              </label>
              <input
                type="text"
                value={formData.barcode || ''}
                onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập mã vạch"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => setFormData({...formData, category_id: Number(e.target.value) || undefined})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Chọn danh mục</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đơn vị tính *
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="VD: Kg, Lít, Cái..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá bán *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.sale_price}
                onChange={(e) => setFormData({...formData, sale_price: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá vốn
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.purchase_price || 0}
                onChange={(e) => setFormData({...formData, purchase_price: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá sỉ
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.wholesale_price || 0}
                onChange={(e) => setFormData({...formData, wholesale_price: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá khuyến mãi
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.promo_price || 0}
                onChange={(e) => setFormData({...formData, promo_price: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tồn kho hiện tại
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock_quantity || 0}
                onChange={(e) => setFormData({...formData, stock_quantity: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tồn kho tối thiểu
              </label>
              <input
                type="number"
                min="0"
                value={formData.min_stock_level || 0}
                onChange={(e) => setFormData({...formData, min_stock_level: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tồn kho tối đa
              </label>
              <input
                type="number"
                min="0"
                value={formData.max_stock_level || 0}
                onChange={(e) => setFormData({...formData, max_stock_level: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày hết hạn
              </label>
              <input
                type="date"
                value={formData.expiry_date || ''}
                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL hình ảnh
              </label>
              <input
                type="url"
                value={formData.image_url || ''}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mô tả chi tiết sản phẩm..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="has_variants"
                checked={formData.has_variants || false}
                onChange={(e) => setFormData({...formData, has_variants: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="has_variants" className="ml-3 text-sm text-gray-700">
                Có biến thể
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="track_inventory"
                checked={formData.track_inventory !== false}
                onChange={(e) => setFormData({...formData, track_inventory: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="track_inventory" className="ml-3 text-sm text-gray-700">
                Theo dõi tồn kho
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active !== false}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-3 text-sm text-gray-700">
                Kích hoạt sản phẩm
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {product ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Products: React.FC = () => {
  const { user, hasRole } = useAuth();
  
  // Debug info
  console.log('Current user:', user);
  console.log('Has admin role:', hasRole('admin'));
  console.log('Has warehouse role:', hasRole('warehouse'));
  console.log('Can import:', hasRole(['admin', 'warehouse']));

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'out_of_stock' | 'low_stock' | 'in_stock'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  
  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    total_products: 0,
    out_of_stock: 0,
    low_stock: 0,
    total_inventory_value: 0
  });

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { limit: 2500 };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category_id = selectedCategory;
      
      console.log('Loading products with params:', params);
      
      const response = await api.getProducts(params);
      let filteredProducts = response.data.data;
      
      // Apply stock status filter on the client side
      if (stockStatusFilter !== 'all') {
        console.log('Applying stock filter:', stockStatusFilter);
        console.log('Total products before filter:', filteredProducts.length);
        
        filteredProducts = filteredProducts.filter(product => {
          const stockQuantity = product.stock_quantity || 0;
          const minStockLevel = product.min_stock_level || 0;
          
          let shouldInclude = false;
          switch (stockStatusFilter) {
            case 'out_of_stock':
              shouldInclude = stockQuantity <= 0;
              break;
            case 'low_stock':
              shouldInclude = stockQuantity > 0 && stockQuantity <= minStockLevel;
              break;
            case 'in_stock':
              shouldInclude = stockQuantity > minStockLevel;
              break;
            default:
              shouldInclude = true;
          }
          
          return shouldInclude;
        });
        
        console.log('Products after filter:', filteredProducts.length);
      }
      
      setProducts(filteredProducts);
      
      console.log('Products loaded:', filteredProducts.length, 'filtered by stock status:', stockStatusFilter);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, stockStatusFilter]);

  const loadDashboardStats = useCallback(async () => {
    try {
      console.log('Loading dashboard stats...');
      const response = await api.getDashboardStats();
      setDashboardStats(response.data.data);
      console.log('Dashboard stats loaded:', response.data.data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadDashboardStats();
  }, [loadProducts, loadDashboardStats]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [loadProducts]);

  const loadCategories = async () => {
    try {
      const response = await api.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      // Filter out undefined values
      const cleanedData: any = {};
      Object.keys(productData).forEach(key => {
        const value = productData[key as keyof Product];
        if (value !== undefined && value !== null && value !== '') {
          cleanedData[key] = value;
        }
      });

      console.log('Sending product data:', cleanedData);

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, cleanedData);
        alert('Cập nhật sản phẩm thành công!');
      } else {
        await api.createProduct(cleanedData);
        alert('Thêm sản phẩm thành công!');
      }
      
      setShowModal(false);
      setEditingProduct(null);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Có lỗi xảy ra khi lưu sản phẩm!');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    
    try {
      await api.deleteProduct(productId);
      alert('Xóa sản phẩm thành công!');
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Có lỗi xảy ra khi xóa sản phẩm!');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStockStatus = (product: Product) => {
    const stockQuantity = product.stock_quantity || 0;
    const minStockLevel = product.min_stock_level || 0;
    
    if (stockQuantity <= 0) {
      return { text: 'Hết hàng', color: 'bg-red-100 text-red-800' };
    } else if (stockQuantity <= minStockLevel) {
      return { text: 'Sắp hết', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: 'Còn hàng', color: 'bg-green-100 text-green-800' };
    }
  };

  // Check token validity
  const checkTokenValidity = async () => {
    try {
      // Try to get products to check if token is still valid
      await api.getProducts({ search: '', category_id: undefined, is_active: true });
      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        return false;
      }
      return true; // Other errors don't mean token is invalid
    }
  };

  // Export data to Excel
  const handleExportData = async () => {
    try {
      setLoading(true);
      console.log('Starting export...');
      
      // Check if user has permission
      if (!hasRole(['admin', 'warehouse', 'sales'])) {
        alert('Bạn không có quyền xuất dữ liệu!');
        return;
      }
      
      // Check token
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        return;
      }
      
      // Check token validity
      const isTokenValid = await checkTokenValidity();
      if (!isTokenValid) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      console.log('User has permission, token is valid');
      
      // Call API to get Excel file with all products from database
      const response = await api.exportProducts();
      console.log('Export response received:', {
        status: response.status,
        headers: response.headers,
        dataType: typeof response.data,
        dataSize: response.data?.size || 'unknown'
      });
      
      // Check if response is valid
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      // Ensure we have a blob
      let blob;
      if (response.data instanceof Blob) {
        blob = response.data;
      } else {
        // Convert to blob if needed
        blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }
      
      console.log('Blob created, size:', blob.size, 'type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Received empty file from server');
      }
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `Danh_sach_san_pham_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }
      
      link.download = fileName;
      
      console.log('Triggering download:', fileName);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Xuất dữ liệu thành công! File Excel "${fileName}" đã được tải xuống.`);
    } catch (error: any) {
      console.error('Export error:', error);
      
      // More detailed error message
      let errorMessage = 'Có lỗi xảy ra khi xuất dữ liệu!';
      
      if (error.response) {
        console.error('Error response:', error.response);
        const status = error.response.status;
        
        if (status === 403) {
          errorMessage = 'Bạn không có quyền xuất dữ liệu hoặc phiên đăng nhập đã hết hạn!';
        } else if (status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
        } else {
          errorMessage += `\n- Status: ${status}`;
          errorMessage += `\n- Message: ${error.response.statusText}`;
        }
        
        if (error.response.data && typeof error.response.data === 'string') {
          errorMessage += `\n- Details: ${error.response.data}`;
        }
      } else if (error.message) {
        errorMessage += `\n- Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle import button click
  const handleImportClick = () => {
    setShowImportModal(true);
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  // Import Excel file
  const handleImportExcel = async () => {
    if (!importFile) {
      alert('Vui lòng chọn file Excel!');
      return;
    }

    try {
      setImporting(true);
      console.log('Starting import:', importFile.name);

      const response = await api.importProducts(importFile);
      const result = response.data.data;

      console.log('Import result:', result);

      // Close modal and reset
      setShowImportModal(false);
      setImportFile(null);
      
      // Reload products
      loadProducts();

      // Show result
      let message = `Nhập dữ liệu hoàn tất!\n`;
      message += `Tổng số dòng: ${result.total_rows}\n`;
      message += `Thành công: ${result.success_count}\n`;
      message += `Lỗi: ${result.error_count}`;
      
      if (result.errors.length > 0) {
        message += `\n\nMột số lỗi:\n`;
        result.errors.slice(0, 3).forEach((error: any) => {
          message += `- Dòng ${error.row}: ${error.error}\n`;
        });
      }

      alert(message);
    } catch (error: any) {
      console.error('Import error:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi nhập file Excel!';
      if (error.response?.data?.error) {
        errorMessage += `\n${error.response.data.error}`;
      } else if (error.message) {
        errorMessage += `\n${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  // Handle stock status card clicks
  const handleStockStatusClick = (status: 'all' | 'out_of_stock' | 'low_stock') => {
    setStockStatusFilter(status);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setSelectedCategory(null);
    setStockStatusFilter('all');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="w-8 h-8 text-blue-600" />
                Quản lý sản phẩm
              </h1>
              <p className="text-gray-600 mt-1">Quản lý thông tin và tồn kho sản phẩm</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportData}
                className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg"
                title="Xuất dữ liệu"
                disabled={loading}
              >
                <Download className="w-5 h-5" />
                {loading ? 'Đang xuất...' : 'Xuất'}
              </button>
              
              <button
                onClick={handleImportClick}
                className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 shadow-lg"
                title="Nhập file Excel"
              >
                <Upload className="w-5 h-5" />
                Nhập
              </button>
              
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowModal(true);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Thêm sản phẩm
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div 
              onClick={() => handleStockStatusClick('all')}
              className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all duration-200 hover:shadow-md ${
                stockStatusFilter === 'all' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.total_products.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleStockStatusClick('out_of_stock')}
              className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all duration-200 hover:shadow-md ${
                stockStatusFilter === 'out_of_stock' ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hết hàng</p>
                  <p className="text-2xl font-bold text-red-600">
                    {dashboardStats.out_of_stock.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <Warehouse className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleStockStatusClick('low_stock')}
              className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all duration-200 hover:shadow-md ${
                stockStatusFilter === 'low_stock' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sắp hết</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {dashboardStats.low_stock.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Warehouse className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng giá trị</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(dashboardStats.total_inventory_value)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, mã vạch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-48"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Active Filters */}
          {(stockStatusFilter !== 'all' || search || selectedCategory) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500">Bộ lọc đang áp dụng:</span>
              
              {stockStatusFilter !== 'all' && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  stockStatusFilter === 'out_of_stock' 
                    ? 'bg-red-100 text-red-700' 
                    : stockStatusFilter === 'low_stock'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {stockStatusFilter === 'out_of_stock' ? 'Hết hàng' : 
                   stockStatusFilter === 'low_stock' ? 'Sắp hết' : 'Còn hàng'}
                </span>
              )}
              
              {search && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  Tìm kiếm: "{search}"
                </span>
              )}
              
              {selectedCategory && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  Danh mục: {categories.find(c => c.id === selectedCategory)?.name || 'N/A'}
                </span>
              )}
              
              <button
                onClick={clearFilters}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Results Count */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Hiển thị <span className="font-semibold">{products.length}</span> sản phẩm
                {stockStatusFilter !== 'all' && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {stockStatusFilter === 'out_of_stock' ? 'Hết hàng' : 
                     stockStatusFilter === 'low_stock' ? 'Sắp hết' : 'Còn hàng'}
                  </span>
                )}
              </span>
              {products.length > 0 && (
                <span className="text-xs text-gray-500">
                  Tổng cộng {dashboardStats.total_products.toLocaleString()} sản phẩm
                </span>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã vạch
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá bán
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Không tìm thấy sản phẩm nào</p>
                        <p className="text-sm">Thử thay đổi bộ lọc hoặc thêm sản phẩm mới</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-gray-200">
                                {product.image_url ? (
                                  <img 
                                    src={product.image_url} 
                                    alt={product.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <span className="text-xl">📦</span>
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.unit} • {product.category_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {product.barcode || 'N/A'}
                          </code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(product.sale_price)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Vốn: {formatCurrency(product.purchase_price || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.stock_quantity} {product.unit}
                          </div>
                          <div className="text-xs text-gray-500">
                            Tối thiểu: {product.min_stock_level}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                            {stockStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        product={editingProduct || undefined}
        categories={categories}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Nhập file Excel</h2>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Chọn file Excel (.xlsx) chứa dữ liệu sản phẩm để nhập vào hệ thống.
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  
                  {importFile ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{importFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        onClick={() => setImportFile(null)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Xóa file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Kéo thả file hoặc nhấn để chọn
                      </p>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="excel-file-input"
                      />
                      <label
                        htmlFor="excel-file-input"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Chọn file Excel
                      </label>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  <p className="font-medium mb-1">Lưu ý:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>File phải có định dạng .xlsx hoặc .xls</li>
                    <li>Cột bắt buộc: "Tên sản phẩm", "Giá bán lẻ (VNĐ)"</li>
                    <li>Sản phẩm trùng SKU sẽ được cập nhật</li>
                    <li>Sản phẩm mới sẽ được thêm vào</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleImportExcel}
                  disabled={!importFile || importing}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang nhập...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Nhập dữ liệu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products; 