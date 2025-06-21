import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard, 
  Smartphone, 
  Scan,
  X,
  Save,
  DollarSign
} from 'lucide-react';
import { api, Product, Customer } from '../services/api';
import { useToast } from './Toast';
import InvoicePrintModal from './InvoicePrintModal';
import QRPaymentDisplay from './QRPaymentDisplay';

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  total: number;
}

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannedBarcode: string;
  onProductAdded: (product: Product) => void;
}

interface PriceEditModalProps {
  item: CartItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newUnitPrice: number, newDiscountPercent: number) => void;
}

const PriceEditModal: React.FC<PriceEditModalProps> = ({ item, isOpen, onClose, onSave }) => {
  const [unitPrice, setUnitPrice] = useState(item.unit_price);
  const [discountPercent, setDiscountPercent] = useState(item.discount_percent);
  const [salePrice, setSalePrice] = useState(item.unit_price * (1 - item.discount_percent / 100));

  useEffect(() => {
    setUnitPrice(item.unit_price);
    setDiscountPercent(item.discount_percent);
    setSalePrice(item.unit_price * (1 - item.discount_percent / 100));
  }, [item]);

  const handleSalePriceChange = (newSalePrice: number) => {
    setSalePrice(newSalePrice);
    // Calculate new unit price based on sale price and discount
    if (discountPercent > 0) {
      const newUnitPrice = newSalePrice / (1 - discountPercent / 100);
      setUnitPrice(newUnitPrice);
    } else {
      setUnitPrice(newSalePrice);
    }
  };

  const handleDiscountChange = (newDiscountPercent: number) => {
    setDiscountPercent(newDiscountPercent);
    // Recalculate sale price based on unit price and new discount
    setSalePrice(unitPrice * (1 - newDiscountPercent / 100));
  };

  const handleSave = () => {
    onSave(unitPrice, discountPercent);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Chỉnh sửa giá</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">{item.product.name}</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đơn giá (không thể sửa)
            </label>
            <input
              type="number"
              value={item.product.sale_price}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giảm giá (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => handleDiscountChange(Number(e.target.value))}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="100"
                step="0.1"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá bán
            </label>
            <input
              type="number"
              value={salePrice}
              onChange={(e) => handleSalePriceChange(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="1000"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Đơn giá gốc:</span>
                <span>{item.product.sale_price.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="flex justify-between">
                <span>Giảm giá:</span>
                <span>{discountPercent}%</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Giá bán cuối:</span>
                <span>{salePrice.toLocaleString('vi-VN')} VND</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

const NewProductModal: React.FC<NewProductModalProps> = ({ 
  isOpen, 
  onClose, 
  scannedBarcode, 
  onProductAdded 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    barcode: scannedBarcode,
    sku: '',
    category_id: 1,
    unit: 'Cái',
    purchase_price: 0,
    sale_price: 0,
    description: '',
    min_stock_level: 1,
    max_stock_level: 100,
    stock_quantity: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  // Generate next SKU when modal opens
  const generateNextSKU = async () => {
    try {
      // Get all products to find the highest SKU number
      const response = await api.getProducts({ limit: 10000 });
      const products = response.data.data || [];
      
      // Find the highest SP number
      let maxNumber = 99; // Start from SP100
      products.forEach(product => {
        if (product.sku && product.sku.startsWith('SP')) {
          const number = parseInt(product.sku.substring(2));
          if (!isNaN(number) && number > maxNumber) {
            maxNumber = number;
          }
        }
      });
      
      return `SP${maxNumber + 1}`;
    } catch (error) {
      console.error('Error generating SKU:', error);
      // Fallback to timestamp-based SKU
      return `SP${Date.now().toString().slice(-6)}`;
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened with barcode:', scannedBarcode); // Debug log
      // Generate SKU and set full barcode
      generateNextSKU().then(nextSKU => {
        console.log('Generated SKU:', nextSKU); // Debug log
        setFormData(prev => ({
          ...prev,
          barcode: scannedBarcode, // Full barcode
          sku: nextSKU // Auto-generated SKU
        }));
      });
    }
  }, [isOpen, scannedBarcode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError('Lỗi', 'Vui lòng nhập tên sản phẩm');
      return;
    }

    if (formData.sale_price <= 0) {
      showError('Lỗi', 'Giá bán phải lớn hơn 0');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Creating product with data:', formData);
      
      const response = await api.createProduct({
        ...formData,
        is_active: true
      });
      
      console.log('Product created successfully:', response.data.data);
      showSuccess('Thành công', `Đã lưu sản phẩm "${formData.name}" vào cơ sở dữ liệu và thêm vào hóa đơn`);
      
      // Add to cart after successful database save
      onProductAdded(response.data.data);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        barcode: '',
        sku: '',
        category_id: 1,
        unit: 'Cái',
        purchase_price: 0,
        sale_price: 0,
        description: '',
        min_stock_level: 1,
        max_stock_level: 100,
        stock_quantity: 0
      });
    } catch (error) {
      console.error('Error creating product:', error);
      showError('Lỗi', 'Không thể thêm sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-800">Thêm sản phẩm mới</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {scannedBarcode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Mã vạch đã quét:</span> 
                <span className="font-mono ml-2 text-lg">{scannedBarcode}</span>
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập tên sản phẩm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã vạch
              </label>
              <input
                type="text"
                value={formData.barcode}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-lg"
                placeholder="Mã vạch sẽ hiển thị ở đây..."
                readOnly
                title={`Mã vạch: ${formData.barcode}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                placeholder="Tự động tạo..."
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đơn vị
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Cái">Cái</option>
                <option value="Hộp">Hộp</option>
                <option value="Gói">Gói</option>
                <option value="Chai">Chai</option>
                <option value="Thùng">Thùng</option>
                <option value="Kg">Kg</option>
                <option value="Lít">Lít</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá vốn
              </label>
              <input
                type="number"
                value={formData.purchase_price}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: Number(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá bán <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.sale_price}
                onChange={(e) => setFormData(prev => ({ ...prev, sale_price: Number(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tồn kho hiện tại
              </label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: Number(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tồn kho tối thiểu
              </label>
              <input
                type="number"
                value={formData.min_stock_level}
                onChange={(e) => setFormData(prev => ({ ...prev, min_stock_level: Number(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mô tả sản phẩm"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Thêm vào hóa đơn
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const POS: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'e_wallet'>('cash');
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [orderNumber, setOrderNumber] = useState(() => {
    // Generate initial order number only once
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    return `HD${timestamp}`;
  });
  const [orderLocked, setOrderLocked] = useState(false);
  
  // New product modal states
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [scannedBarcodeNotFound, setScannedBarcodeNotFound] = useState('');
  
  // Print invoice modal states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [completedOrderData, setCompletedOrderData] = useState<any>(null);
  const [showPriceEditModal, setShowPriceEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  
  const { showSuccess, showError } = useToast();

  // Safe setters to ensure valid numbers
  const setDiscountPercentSafe = (value: number) => {
    const safeValue = Number(value) || 0;
    setDiscountPercent(Math.max(0, Math.min(100, safeValue))); // Clamp between 0-100
  };

  const setReceivedAmountSafe = (value: number) => {
    const safeValue = Number(value) || 0;
    setReceivedAmount(Math.max(0, safeValue)); // Ensure non-negative
  };

  const generateOrderNumber = useCallback(() => {
    if (!orderLocked) {
      const now = new Date();
      const timestamp = now.getTime().toString().slice(-6);
      setOrderNumber(`HD${timestamp}`);
    }
  }, [orderLocked]);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      // Load all active products for comprehensive search (use large limit)
      const response = await api.getProducts({ is_active: true, limit: 5000 });
      setProducts(response.data.data || []);
      console.log('Loaded products for search:', response.data.data?.length || 0);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Customer search function
  const searchCustomers = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
      return;
    }

    try {
      const response = await api.getCustomers({ 
        search: searchTerm.trim(), 
        limit: 10,
        trang_thai: 'Hoạt động' // Only active customers
      });
      
      if (response.data.success) {
        setFilteredCustomers(response.data.data.customers);
        setShowCustomerDropdown(true);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
    }
  }, []);

  // Enhanced search function with word-based matching
  const searchProducts = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredProducts([]);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    // Split search term into individual words
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
    console.log('Searching for words:', searchWords);

    try {
      // Search in loaded products first for instant results
      const localResults = products.filter(product => {
        // For each search word, check if it exists in any field
        const matchesAllWords = searchWords.every(word => {
          const nameMatch = product.name.toLowerCase().includes(word);
          const skuMatch = product.sku.toLowerCase().includes(word);
          const barcodeMatch = product.barcode && product.barcode.toLowerCase().includes(word);
          const categoryMatch = product.category_name && product.category_name.toLowerCase().includes(word);
          const descriptionMatch = product.description && product.description.toLowerCase().includes(word);
          
          return nameMatch || skuMatch || barcodeMatch || categoryMatch || descriptionMatch;
        });
        
        return matchesAllWords;
      });

      console.log('Local search results:', localResults.length);

      // Show more results - up to 50 for better user experience
      if (localResults.length > 0) {
        // Sort results by relevance (products with more matches in name come first)
        const sortedResults = localResults.sort((a, b) => {
          const aNameMatches = searchWords.filter(word => a.name.toLowerCase().includes(word)).length;
          const bNameMatches = searchWords.filter(word => b.name.toLowerCase().includes(word)).length;
          return bNameMatches - aNameMatches;
        });
        setFilteredProducts(sortedResults.slice(0, 50));
      } else {
        console.log('No local results, searching via API...');
        // If no local results, search via API with higher limit
        const response = await api.getProducts({ 
          search: searchTerm, 
          is_active: true, 
          limit: 50 
        });
        console.log('API search results:', response.data.data?.length || 0);
        setFilteredProducts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      // Fallback to local search with word-based matching
      const localResults = products.filter(product => {
        const matchesAllWords = searchWords.every(word => {
          return product.name.toLowerCase().includes(word) ||
                 product.sku.toLowerCase().includes(word) ||
                 (product.barcode && product.barcode.toLowerCase().includes(word)) ||
                 (product.description && product.description.toLowerCase().includes(word));
        });
        return matchesAllWords;
      });
      console.log('Fallback search results:', localResults.length);
      setFilteredProducts(localResults.slice(0, 50));
    }
  }, [products]);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Enhanced search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only do regular search for non-numeric inputs
      if (!/^\d+$/.test(searchTerm) || searchTerm.length < 8) {
        searchProducts(searchTerm);
      }
    }, 300); // Back to 300ms for regular search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchProducts]);

  // Customer search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCustomers(customerSearchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customerSearchTerm, searchCustomers]);

  // Close customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCustomerDropdown) {
        const target = event.target as Element;
        if (!target.closest('.customer-autocomplete')) {
          setShowCustomerDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCustomerDropdown]);

  // Handle customer selection
  const handleCustomerSelect = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerInfo({
      name: customer.ten_khach_hang,
      phone: customer.so_dien_thoai || ''
    });
    setCustomerSearchTerm(customer.ten_khach_hang);
    setShowCustomerDropdown(false);
    setFilteredCustomers([]);
  }, []);

  // Handle customer name input change
  const handleCustomerNameChange = useCallback((value: string) => {
    setCustomerSearchTerm(value);
    setCustomerInfo(prev => ({ ...prev, name: value }));
    
    // Clear selected customer if user is typing something different
    if (selectedCustomer && value !== selectedCustomer.ten_khach_hang) {
      setSelectedCustomer(null);
      setCustomerInfo(prev => ({ ...prev, phone: '' }));
    }
  }, [selectedCustomer]);

  // Add product to cart
  const addToCart = useCallback((product: Product) => {
    setOrderLocked(true); // Lock order number when adding products
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        const unitPrice = Number(existingItem.unit_price) || 0;
        const discountPercent = Number(existingItem.discount_percent) || 0;
        const itemTotal = Math.round(newQuantity * unitPrice * (1 - discountPercent / 100));
        
        return prevCart.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
                total: itemTotal
              }
            : item
        );
      } else {
        const unitPrice = Number(product.sale_price) || 0;
        const newItem: CartItem = {
          product,
          quantity: 1,
          unit_price: unitPrice,
          discount_percent: 0,
          total: unitPrice
        };
        return [...prevCart, newItem];
      }
    });
    showSuccess('Đã thêm', `${product.name} đã được thêm vào giỏ hàng`);
  }, [showSuccess]);

  // Handle barcode scan or manual input
  const handleProductSearch = useCallback((searchValue: string) => {
    console.log('Input received:', searchValue, 'Length:', searchValue.length); // Debug log
    setSearchTerm(searchValue);
    // Don't process barcode automatically in onChange - wait for Enter or paste
  }, []);

  // Process barcode function
  const processBarcodeInput = useCallback((barcodeValue: string) => {
    console.log('Processing barcode:', barcodeValue, 'Length:', barcodeValue.length);
    if (/^\d+$/.test(barcodeValue) && barcodeValue.length >= 8) {
      const product = products.find(p => p.barcode === barcodeValue);
      if (product) {
        console.log('Product found:', product.name);
        addToCart(product);
        setSearchTerm('');
        setFilteredProducts([]);
      } else {
        console.log('Product not found, opening modal for barcode:', barcodeValue);
        setScannedBarcodeNotFound(barcodeValue);
        setShowNewProductModal(true);
        setSearchTerm('');
        setFilteredProducts([]);
      }
    }
  }, [products, addToCart]);

  // Handle new product added from modal
  const handleNewProductAdded = useCallback((newProduct: Product) => {
    console.log('Adding new product to cart:', newProduct);
    
    // Add the new product to local products list for future searches
    setProducts(prev => [...prev, newProduct]);
    
    // Add to cart immediately after database save
    addToCart(newProduct);
    
    // Close modal and reset states
    setShowNewProductModal(false);
    setScannedBarcodeNotFound('');
    
    console.log('Product successfully added to cart and local product list');
  }, [addToCart]);

  // Update cart item quantity
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              total: Math.round(quantity * (Number(item.unit_price) || 0) * (1 - (Number(item.discount_percent) || 0) / 100))
            }
          : item
      )
    );
  };

  // Handle quantity editing
  const handleQuantityEdit = (productId: number, newQuantity: number) => {
    if (newQuantity > 0) {
      updateQuantity(productId, newQuantity);
    }
    setEditingQuantity(null);
    setEditingProductId(null);
  };

  // Handle price editing
  const handlePriceEdit = (item: CartItem) => {
    setEditingItem(item);
    setShowPriceEditModal(true);
  };

  // Update item price
  const updateItemPrice = (productId: number, newUnitPrice: number, newDiscountPercent: number) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.product.id === productId 
          ? { 
              ...item, 
              unit_price: newUnitPrice,
              discount_percent: newDiscountPercent,
              total: Math.round(newUnitPrice * item.quantity * (1 - newDiscountPercent / 100))
            }
          : item
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setDiscountPercentSafe(0);
    setReceivedAmountSafe(0);
    setOrderLocked(false); // Unlock order when clearing cart
    showSuccess('Đã xóa', 'Giỏ hàng đã được làm trống');
  };

  // Clear cart and create new order
  const clearCartAndNewOrder = () => {
    clearCart();
    generateOrderNumber();
    showSuccess('Đơn hàng mới', 'Đã tạo đơn hàng mới');
  };

  // Calculate totals with proper validation and rounding
  const subtotal = cart.reduce((sum, item) => {
    const itemTotal = Number(item.total) || 0;
    console.log('Cart item:', item.product.name, 'Total:', item.total, 'Parsed:', itemTotal);
    return sum + itemTotal;
  }, 0);
  
  console.log('Subtotal:', subtotal, 'DiscountPercent:', discountPercent);
  
  const validDiscountPercent = Number(discountPercent) || 0;
  const discountAmount = Math.round(subtotal * (validDiscountPercent / 100));
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const changeAmount = Math.max(0, (Number(receivedAmount) || 0) - totalAmount);
  
  console.log('Final calculations:', {
    subtotal,
    validDiscountPercent,
    discountAmount,
    totalAmount,
    changeAmount
  });

  // Handle payment
  const processPayment = async (method: 'quick' | 'normal' | 'delivery') => {
    console.log('processPayment called with method:', method);
    
    if (cart.length === 0) {
      console.log('Cart is empty, showing error');
      showError('Lỗi', 'Giỏ hàng trống');
      return;
    }

    try {
      console.log('Starting payment process...');
      setIsLoading(true);
      
      const orderData = {
        customer_id: selectedCustomer?.id || null,
        customer_name: customerInfo.name || 'Khách Lẻ',
        customer_phone: customerInfo.phone,
        items: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent,
          total: item.total
        })),
        subtotal,
        discount_percent: validDiscountPercent,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: method === 'delivery' ? 'unpaid' as const : 'paid' as const,
        notes: method === 'delivery' ? 'Giao hàng' : ''
      };

      console.log('Sending order data:', orderData);
      const response = await api.createSalesOrder(orderData);
      console.log('Order created successfully:', response.data);
      
      // Hiển thị modal in hóa đơn với order ID
      const orderId = response.data.data.id.toString();
      console.log('Setting completed order ID:', orderId);
      
      // Thêm delay nhỏ để đảm bảo database đã commit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCompletedOrderId(orderId);
      
      // Ensure orderData has the required structure
      const printOrderData = {
        order_number: response.data.data?.order_number || orderNumber,
        customer_name: response.data.data?.customer_name || customerInfo.name || 'Khách Lẻ',
        customer_phone: response.data.data?.customer_phone || customerInfo.phone || '',
        items: response.data.data?.items || cart.map(item => ({
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total
        })),
        subtotal: response.data.data?.subtotal || subtotal,
        discount_amount: response.data.data?.discount_amount || discountAmount,
        total_amount: response.data.data?.total_amount || totalAmount,
        payment_method: response.data.data?.payment_method || paymentMethod,
        created_at: response.data.data?.created_at || new Date().toISOString()
      };
      
      setCompletedOrderData(printOrderData);
      setShowPrintModal(true);
      console.log('Print modal should be shown now with order ID:', orderId, 'Order data:', printOrderData);
      
      showSuccess(
        'Thanh toán thành công',
        `Đơn hàng ${response.data.data.order_number} đã được tạo thành công`
      );
      
      // Reset form
      clearCart();
      setCustomerInfo({ name: '', phone: '' });
      setCustomerSearchTerm('');
      setSelectedCustomer(null);
      setShowCustomerDropdown(false);
      setFilteredCustomers([]);
      generateOrderNumber(); // Generate new order number after successful payment
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      console.error('Error details:', error.response?.data || error.message);
      showError('Lỗi', 'Không thể xử lý thanh toán');
    } finally {
      console.log('Payment process finished, setting loading to false');
      setIsLoading(false);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        setDiscountPercentSafe(5); // Quick 5% discount
      } else if (e.key === 'Escape') {
        setSearchTerm('');
        setFilteredProducts([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 to-indigo-100 pl-2 pr-0 py-2">
      <div className="w-full h-full flex gap-2">
        {/* Left Panel - Cart Items (Larger) */}
                  <div className="w-2/3 bg-white rounded-2xl shadow-xl flex flex-col">
          {/* Cart Items Table */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Giỏ hàng trống</p>
                <p className="text-sm">Thêm sản phẩm để bắt đầu</p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-2">
                  <div className="grid grid-cols-12 gap-3 text-sm font-semibold text-gray-700">
                    <div className="col-span-1 text-center">STT</div>
                    <div className="col-span-2">Mã SKU</div>
                    <div className="col-span-3">Tên sản phẩm</div>
                    <div className="col-span-1 text-center">-</div>
                    <div className="col-span-1 text-center">SL</div>
                    <div className="col-span-1 text-center">+</div>
                    <div className="col-span-2 text-left pl-4">Giá tiền</div>
                    <div className="col-span-1 text-left pl-2">Thành tiền</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto">
                  {cart.map((item, index) => (
                    <div key={item.product.id} className="border-b border-gray-100 px-6 py-2 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-3 items-center">
                        {/* STT */}
                        <div className="col-span-1 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                            {index + 1}
                          </span>
                        </div>

                        {/* Mã SKU */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-mono text-gray-600">{item.product.sku}</span>
                          </div>
                        </div>

                        {/* Tên sản phẩm */}
                        <div className="col-span-3">
                          <h3 className="font-medium text-gray-900 text-sm leading-tight">{item.product.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{item.product.barcode}</p>
                        </div>

                        {/* Nút giảm */}
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Số lượng */}
                        <div className="col-span-1 text-center">
                          {editingProductId === item.product.id ? (
                            <input
                              type="number"
                              value={editingQuantity || item.quantity}
                              onChange={(e) => setEditingQuantity(Number(e.target.value))}
                              onBlur={() => handleQuantityEdit(item.product.id, editingQuantity || item.quantity)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleQuantityEdit(item.product.id, editingQuantity || item.quantity);
                                } else if (e.key === 'Escape') {
                                  setEditingQuantity(null);
                                  setEditingProductId(null);
                                }
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-12 h-8 text-center border border-blue-500 rounded-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min="1"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingProductId(item.product.id);
                                setEditingQuantity(item.quantity);
                              }}
                              className="inline-flex items-center justify-center w-12 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-900 transition-colors"
                            >
                              {item.quantity}
                            </button>
                          )}
                        </div>

                        {/* Nút tăng */}
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Giá tiền */}
                        <div className="col-span-2 text-left pl-4">
                          <button
                            onClick={() => handlePriceEdit(item)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                          >
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unit_price)}
                          </button>
                        </div>

                        {/* Thành tiền */}
                        <div className="col-span-1 text-left pl-2">
                          <span className="font-bold text-blue-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Tổng tiền hàng:</span>
                  <span className="font-semibold text-lg">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Giảm giá:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercentSafe(Number(e.target.value))}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm text-gray-600">%</span>
                    <span className="font-medium text-red-600">
                      -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountAmount)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xl font-bold border-t pt-3">
                  <span className="text-gray-900">Khách cần trả:</span>
                  <span className="text-blue-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Product Search & Customer Info & Payment (Smaller) */}
        <div className="flex-1 flex flex-col gap-1 mr-0 pr-0">
          {/* Product Search */}
          <div className="bg-white rounded-l-2xl shadow-xl p-1">
            {/* Search Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search-input"
                  type="text"
                  value={searchTerm}
                  maxLength={50}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log('onChange - Raw value:', value, 'Length:', value.length);
                    handleProductSearch(value);
                  }}
                  onPaste={(e) => {
                    console.log('onPaste triggered');
                    setTimeout(() => {
                      const value = e.currentTarget.value;
                      console.log('Paste detected with value:', value, 'Length:', value.length);
                      processBarcodeInput(value);
                    }, 100);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = e.currentTarget.value;
                      console.log('Enter pressed with value:', value, 'Length:', value.length);
                      processBarcodeInput(value);
                    }
                  }}
                  placeholder="Nhập sản phẩm"
                  className="w-full pl-12 pr-4 py-1 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  autoFocus
                />
              </div>
              
              <button className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg">
                <Scan className="w-4 h-4" />
              </button>
            </div>

            {/* Product Search Results */}
            {filteredProducts.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-sm text-gray-600">
                    Tìm thấy {filteredProducts.length} sản phẩm
                  </span>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilteredProducts([]);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Đóng
                  </button>
                </div>
                
                <div className="max-h-96 overflow-y-auto border rounded-xl bg-white shadow-lg">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        addToCart(product);
                        setSearchTerm('');
                        setFilteredProducts([]);
                      }}
                      className="w-full p-4 flex items-center justify-between hover:bg-blue-50 transition-colors border-b last:border-b-0 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {product.sku} • {product.barcode} • {product.category_name}
                        </p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-bold text-blue-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.sale_price)}
                        </p>
                        <p className="text-xs text-gray-500">Còn: {product.stock_quantity}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-l-2xl shadow-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="customer-autocomplete relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên khách hàng</label>
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  placeholder="Nhập tên khách hàng"
                  className="w-full px-4 py-1 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoComplete="off"
                />
                
                {/* Customer Dropdown */}
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        className="w-full p-3 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0 focus:outline-none focus:bg-blue-50"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{customer.ten_khach_hang}</p>
                            <p className="text-sm text-gray-500">
                              {customer.ma_khach_hang} • {customer.loai_khach_hang}
                            </p>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <p className="text-sm text-gray-600">{customer.so_dien_thoai || 'Chưa có SĐT'}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Nhập số điện thoại"
                  className="w-full px-4 py-1 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  readOnly={!!selectedCustomer}
                />
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {cart.length > 0 && (
            <div className="bg-white rounded-l-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thanh toán</h3>
              
              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Phương thức thanh toán</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      paymentMethod === 'cash'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Tiền mặt</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      paymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Thẻ</span>
                  </button>
                  <button
                    onClick={() => {
                      setPaymentMethod('transfer');
                      setReceivedAmount(totalAmount); // Set received amount equal to total for transfer
                    }}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                      paymentMethod === 'transfer'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Chuyển khoản</span>
                  </button>
                </div>
              </div>

              {/* Cash Payment Suggestions */}
              {paymentMethod === 'cash' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Gợi ý số tiền khách trả</label>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      totalAmount,
                      Math.ceil(totalAmount / 1000) * 1000,
                      Math.ceil(totalAmount / 5000) * 5000,
                      Math.ceil(totalAmount / 10000) * 10000,
                      Math.ceil(totalAmount / 20000) * 20000,
                      Math.ceil(totalAmount / 50000) * 50000,
                      Math.ceil(totalAmount / 100000) * 100000,
                      Math.ceil(totalAmount / 200000) * 200000
                    ].filter((amount, index, arr) => arr.indexOf(amount) === index && amount >= totalAmount)
                     .slice(0, 6)
                     .map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setReceivedAmountSafe(amount)}
                        className={`p-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                          receivedAmount === amount
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {new Intl.NumberFormat('vi-VN').format(amount)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Received Amount Input or QR Payment */}
              {paymentMethod === 'transfer' ? (
                <div className="mb-6">
                  <QRPaymentDisplay
                    amount={totalAmount}
                    onAmountChange={setReceivedAmountSafe}
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiền nhận</label>
                  <input
                    type="number"
                    value={receivedAmount || ''}
                    onChange={(e) => setReceivedAmountSafe(Number(e.target.value))}
                    placeholder="Nhập số tiền nhận"
                    className="w-full px-4 py-3 text-lg font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Change Amount */}
              {receivedAmount > 0 && (
                <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 font-medium">Tiền thừa trả khách:</span>
                    <span className="font-bold text-green-600 text-xl">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(changeAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => clearCart()}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Xóa
                </button>
                <button
                  onClick={() => processPayment('normal')}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-medium disabled:opacity-50"
                >
                  {isLoading ? 'Đang xử lý...' : 'THANH TOÁN'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Product Modal */}
      <NewProductModal
        isOpen={showNewProductModal}
        onClose={() => setShowNewProductModal(false)}
        scannedBarcode={scannedBarcodeNotFound}
        onProductAdded={handleNewProductAdded}
      />

      {/* Print Invoice Modal */}
      {showPrintModal && completedOrderData && (
        <InvoicePrintModal
          isOpen={true}
          onClose={() => {
            console.log('Closing print modal');
            setShowPrintModal(false);
            setCompletedOrderId(null);
            setCompletedOrderData(null);
          }}
          orderData={completedOrderData}
        />
      )}

      {/* Price Edit Modal */}
      {showPriceEditModal && editingItem && (
        <PriceEditModal
          item={editingItem}
          isOpen={showPriceEditModal}
          onClose={() => {
            setShowPriceEditModal(false);
            setEditingItem(null);
          }}
          onSave={(newUnitPrice, newDiscountPercent) => {
            updateItemPrice(editingItem.product.id, newUnitPrice, newDiscountPercent);
            setShowPriceEditModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

export default POS;