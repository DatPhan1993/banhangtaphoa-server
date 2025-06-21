import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  Upload, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X
} from 'lucide-react';
import { api, Product } from '../services/api';
import { useToast } from './Toast';

interface ProductListProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
  title?: string;
}

const ProductList: React.FC<ProductListProps> = ({ 
  isOpen, 
  onClose, 
  onSelectProduct,
  title = "Danh sách sản phẩm"
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState<'code' | 'name'>('name');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, searchBy]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.getProducts({ is_active: true });
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error loading products:', error);
      showError('Lỗi', 'Không thể tải danh sách sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product => {
      if (searchBy === 'code') {
        return (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
               product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      } else {
        return product.name.toLowerCase().includes(searchTerm.toLowerCase());
      }
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleProductSelect = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <select
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value as 'code' | 'name')}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-transparent border-none text-sm text-gray-600 focus:outline-none pr-2"
                >
                  <option value="name">Theo mã, tên hàng</option>
                  <option value="code">Theo mã hàng</option>
                </select>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-32 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Thêm mới
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Xuất file
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã hàng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên hàng
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá bán
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá vốn
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tồn kho
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khách đặt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian tạo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dự kiến hết hàng
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : currentProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    Không tìm thấy sản phẩm nào
                  </td>
                </tr>
              ) : (
                currentProducts.map((product, index) => {
                  const isEvenRow = (startIndex + index) % 2 === 0;
                  return (
                    <tr
                      key={product.id}
                      className={`${isEvenRow ? 'bg-orange-50' : 'bg-white'} hover:bg-blue-50 cursor-pointer transition-colors`}
                      onClick={() => handleProductSelect(product)}
                    >
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          className="rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {product.image_url && (
                            <img 
                              src={product.image_url} 
                              alt="" 
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                                                     <span className="text-sm font-medium text-gray-900">
                             {product.sku || product.barcode}
                           </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {product.name}
                        </div>
                      </td>
                                             <td className="px-4 py-3 text-right">
                         <span className="text-sm text-gray-900">
                           {formatCurrency(product.sale_price)}
                         </span>
                       </td>
                       <td className="px-4 py-3 text-right">
                         <span className="text-sm text-gray-900">
                           {formatCurrency(product.purchase_price || 0)}
                         </span>
                       </td>
                       <td className="px-4 py-3 text-right">
                         <span className="text-sm font-medium text-gray-900">
                           {product.stock_quantity?.toLocaleString() || 0}
                         </span>
                       </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-500">0</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {formatDate(product.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">--</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle more actions
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredProducts.length)} / Tổng số {filteredProducts.length} hàng hóa
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-8 h-8 rounded text-sm ${
                        currentPage === pageNum
                          ? 'bg-green-600 text-white'
                          : 'border hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList; 