import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

interface Customer {
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

interface CustomerFormData {
  ma_khach_hang: string;
  ten_khach_hang: string;
  so_dien_thoai: string;
  dia_chi: string;
  email: string;
  ngay_sinh: string;
  gioi_tinh: 'Nam' | 'Nữ' | 'Khác' | '';
  loai_khach_hang: 'Bán lẻ' | 'Bán sỉ' | 'VIP' | 'Thường xuyên';
  han_muc_tin_dung: number;
  so_du_hien_tai: number;
  diem_tich_luy: number;
  ghi_chu: string;
  trang_thai: 'Hoạt động' | 'Ngừng hoạt động';
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchValue, setSearchValue] = useState(''); // Separate state for input value
  const [showFileDropdown, setShowFileDropdown] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    loai_khach_hang: '',
    trang_thai: ''
  });

  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState<CustomerFormData>({
    ma_khach_hang: '',
    ten_khach_hang: '',
    so_dien_thoai: '',
    dia_chi: '',
    email: '',
    ngay_sinh: '',
    gioi_tinh: '',
    loai_khach_hang: 'Bán lẻ',
    han_muc_tin_dung: 0,
    so_du_hien_tai: 0,
    diem_tich_luy: 0,
    ghi_chu: '',
    trang_thai: 'Hoạt động'
  });

  // Debounced search timer
  const debounceTimer = React.useRef<NodeJS.Timeout | null>(null);
  
  // Search input ref to maintain focus
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const fetchCustomers = useCallback(async (search: string = '', page: number = 1, showLoadingState: boolean = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      }
      const response = await api.getCustomers({
        page,
        limit: 50,
        search: search.trim(),
        loai_khach_hang: filters.loai_khach_hang,
        trang_thai: filters.trang_thai
      });
      
      if (response.data.success) {
        setCustomers(response.data.data.customers);
        setPagination(response.data.data.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Use console.error instead of showError to avoid dependency
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [filters.loai_khach_hang, filters.trang_thai]);

  const generateCustomerCode = async () => {
    try {
      const response = await api.generateCustomerCode();
      if (response.data.success) {
        setFormData(prev => ({ ...prev, ma_khach_hang: response.data.data.ma_khach_hang }));
      }
    } catch (error) {
      console.error('Error generating customer code:', error);
    }
  };

  // Initial load - only run once on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const response = await api.getCustomers({
          page: 1,
          limit: 50,
          search: '',
          loai_khach_hang: '',
          trang_thai: ''
        });
        
        if (response.data.success) {
          setCustomers(response.data.data.customers);
          setPagination(response.data.data.pagination);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []); // Only run once on mount

  // Reload when filters change
  useEffect(() => {
    const loadFilteredData = async () => {
      try {
        setLoading(true);
        const response = await api.getCustomers({
          page: 1,
          limit: 50,
          search: '',
          loai_khach_hang: filters.loai_khach_hang,
          trang_thai: filters.trang_thai
        });
        
        if (response.data.success) {
          setCustomers(response.data.data.customers);
          setPagination(response.data.data.pagination);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    // Reset search value when filters change
    setSearchValue('');
    setSearchTerm('');
    setCurrentPage(1);
    loadFilteredData();
  }, [filters.loai_khach_hang, filters.trang_thai]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFileDropdown) {
        const target = event.target as Element;
        if (!target.closest('.file-dropdown')) {
          setShowFileDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFileDropdown]);

  // Maintain focus on search input during typing
  useEffect(() => {
    if (searchInputRef.current && document.activeElement === searchInputRef.current) {
      // Keep focus if user is actively typing
      const timeoutId = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [customers]); // Re-run when customers data changes

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value); // Update input value immediately for UI
    
    // Clear previous timeout
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      setSearching(false); // Clear searching state when user continues typing
    }
    
    // Only show searching indicator if there's a value
    if (value.trim()) {
      setSearching(true);
    }
    
    // Set new timeout for API call
    debounceTimer.current = setTimeout(async () => {
      try {
        setSearchTerm(value); // Update search term for API
        setCurrentPage(1);
        
        const response = await api.getCustomers({
          page: 1,
          limit: 50,
          search: value.trim(),
          loai_khach_hang: filters.loai_khach_hang,
          trang_thai: filters.trang_thai
        });
        
        if (response.data.success) {
          setCustomers(response.data.data.customers);
          setPagination(response.data.data.pagination);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error('Error searching customers:', error);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchCustomers(searchTerm, page);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiData = {
        ...formData,
        gioi_tinh: formData.gioi_tinh || undefined
      };

      if (editingCustomer) {
        const response = await api.updateCustomer(editingCustomer.id, apiData);
        if (response.data.success) {
          showSuccess('Cập nhật khách hàng thành công');
          fetchCustomers(searchTerm, currentPage);
          handleCloseModal();
        }
      } else {
        const response = await api.createCustomer(apiData);
        if (response.data.success) {
          showSuccess('Thêm khách hàng thành công');
          fetchCustomers(searchTerm, currentPage);
          handleCloseModal();
        }
      }
    } catch (error: any) {
      console.error('Error saving customer:', error);
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra';
      showError(errorMessage);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      ma_khach_hang: customer.ma_khach_hang,
      ten_khach_hang: customer.ten_khach_hang,
      so_dien_thoai: customer.so_dien_thoai || '',
      dia_chi: customer.dia_chi || '',
      email: customer.email || '',
      ngay_sinh: customer.ngay_sinh || '',
      gioi_tinh: customer.gioi_tinh || '',
      loai_khach_hang: customer.loai_khach_hang,
      han_muc_tin_dung: customer.han_muc_tin_dung,
      so_du_hien_tai: customer.so_du_hien_tai,
      diem_tich_luy: customer.diem_tich_luy,
      ghi_chu: customer.ghi_chu || '',
      trang_thai: customer.trang_thai
    });
    setShowModal(true);
  };

  const handleDelete = async (customerId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      try {
        const response = await api.deleteCustomer(customerId);
        if (response.data.success) {
          showSuccess('Xóa khách hàng thành công');
          fetchCustomers(searchTerm, currentPage);
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        showError('Lỗi khi xóa khách hàng');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({
      ma_khach_hang: '',
      ten_khach_hang: '',
      so_dien_thoai: '',
      dia_chi: '',
      email: '',
      ngay_sinh: '',
      gioi_tinh: '',
      loai_khach_hang: 'Bán lẻ',
      han_muc_tin_dung: 0,
      so_du_hien_tai: 0,
      diem_tich_luy: 0,
      ghi_chu: '',
      trang_thai: 'Hoạt động'
    });
  };

  const handleNewCustomer = () => {
    generateCustomerCode();
    setShowModal(true);
  };

  const handleSelectCustomer = (customerId: number) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c.id));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.exportCustomersExcel();
      
      // Create blob and download
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customers_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setShowFileDropdown(false);
      showSuccess('Xuất file Excel thành công');
    } catch (error) {
      console.error('Error exporting customers:', error);
      showError('Lỗi khi xuất file Excel');
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.importCustomersExcel(formData);
      
      if (response.data.success) {
        showSuccess(`Import thành công ${response.data.data.imported} khách hàng`);
        fetchCustomers(searchTerm, currentPage); // Refresh the list
        setShowFileDropdown(false);
      }
    } catch (error: any) {
      console.error('Error importing customers:', error);
      const errorMessage = error.response?.data?.error || 'Lỗi khi import file Excel';
      showError(errorMessage);
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Khách hàng</h1>
          <p className="text-gray-600">Quản lý thông tin khách hàng</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleNewCustomer}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>+</span>
            Thêm khách hàng
          </button>
          <div className="relative file-dropdown">
            <button 
              onClick={() => setShowFileDropdown(!showFileDropdown)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              File
              <span className="ml-1">▼</span>
            </button>
            {showFileDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                <button
                  onClick={handleExportExcel}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  📤 Xuất file
                </button>
                <label className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                  📥 Nhập file
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    className="hidden"
                    disabled={importing}
                  />
                </label>
                {importing && (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Đang xử lý...
                  </div>
                )}
              </div>
            )}
          </div>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">
            ⚙️
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm theo mã, tên, điện thoại, email..."
              value={searchValue}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Customer Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nhóm khách hàng
            </label>
            <select
              value={filters.loai_khach_hang}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, loai_khach_hang: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả các nhóm</option>
              <option value="Bán lẻ">Bán lẻ</option>
              <option value="Bán sỉ">Bán sỉ</option>
              <option value="VIP">VIP</option>
              <option value="Thường xuyên">Thường xuyên</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={filters.trang_thai}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, trang_thai: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Ngừng hoạt động">Ngừng hoạt động</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === customers.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mã khách hàng</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tên khách hàng</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Điện thoại</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nợ hiện tại</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tổng bán</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tổng bán trừ trả hàng</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => handleSelectCustomer(customer.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                    {customer.ma_khach_hang}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {customer.ten_khach_hang}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {customer.so_dien_thoai || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatCurrency(customer.so_du_hien_tai)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatCurrency(0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatCurrency(0)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
                        title="Sửa"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-800 px-2 py-1 rounded"
                        title="Xóa"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị {pagination.page * pagination.limit - pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} khách hàng
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ⏮️
            </button>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ◀️
            </button>
            <span className="px-3 py-1 bg-blue-600 text-white rounded">
              {pagination.page}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ▶️
            </button>
            <button
              onClick={() => handlePageChange(pagination.pages)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ⏭️
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng mới'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã khách hàng *
                  </label>
                  <input
                    type="text"
                    value={formData.ma_khach_hang}
                    onChange={(e) => setFormData(prev => ({ ...prev, ma_khach_hang: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    readOnly={!!editingCustomer}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên khách hàng *
                  </label>
                  <input
                    type="text"
                    value={formData.ten_khach_hang}
                    onChange={(e) => setFormData(prev => ({ ...prev, ten_khach_hang: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.so_dien_thoai}
                    onChange={(e) => setFormData(prev => ({ ...prev, so_dien_thoai: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.gioi_tinh}
                    onChange={(e) => setFormData(prev => ({ ...prev, gioi_tinh: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại khách hàng
                  </label>
                  <select
                    value={formData.loai_khach_hang}
                    onChange={(e) => setFormData(prev => ({ ...prev, loai_khach_hang: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bán lẻ">Bán lẻ</option>
                    <option value="Bán sỉ">Bán sỉ</option>
                    <option value="VIP">VIP</option>
                    <option value="Thường xuyên">Thường xuyên</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <textarea
                  value={formData.dia_chi}
                  onChange={(e) => setFormData(prev => ({ ...prev, dia_chi: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers; 