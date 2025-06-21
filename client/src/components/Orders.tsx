import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Printer, 
  Calendar,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Package,
  User,
  CreditCard,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './Toast';
import { vietnameseSearch } from '../utils/vietnamese';

interface SalesOrder {
  id: number;
  order_number: string;
  ma_khach_hang?: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status?: string;
  notes?: string;
  created_at: string;
  items?: Array<{
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    total: number;
  }>;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    start_date: '',
    end_date: ''
  });
  const [statusFilter, setStatusFilter] = useState('');
  const { showSuccess, showError } = useToast();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (dateFilter.start_date) params.start_date = dateFilter.start_date;
      if (dateFilter.end_date) params.end_date = dateFilter.end_date;
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearchTerm.trim()) params.search = debouncedSearchTerm.trim();

      const response = await api.getSalesOrders(params);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showError('Lỗi', 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId: number) => {
    try {
      const response = await api.getSalesOrder(orderId);
      setSelectedOrder(response.data.data);
      setShowOrderDetail(true);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      showError('Lỗi', 'Không thể tải chi tiết đơn hàng');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [dateFilter, statusFilter, debouncedSearchTerm]);

  const filteredOrders = orders;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Đã thanh toán';
      case 'partial': return 'Thanh toán một phần';
      case 'unpaid': return 'Chưa thanh toán';
      default: return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Tiền mặt';
      case 'card': return 'Thẻ';
      case 'transfer': return 'Chuyển khoản';
      case 'e_wallet': return 'Ví điện tử';
      default: return method;
    }
  };

  // Export orders to Excel
  const exportToExcel = async () => {
    try {
      console.log('Starting export...');
      const params: any = {};
      if (dateFilter.start_date) params.start_date = dateFilter.start_date;
      if (dateFilter.end_date) params.end_date = dateFilter.end_date;
      if (statusFilter) params.status = statusFilter;

      console.log('Export params:', params);

      const response = await fetch('http://localhost:3001/api/orders/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export failed:', errorText);
        throw new Error(`Export failed: ${response.status}`);
      }

      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'type:', blob.type);

      if (blob.size === 0) {
        throw new Error('File rỗng');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.style.display = 'none';
      document.body.appendChild(a);
      
      console.log('Triggering download...');
      a.click();
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      showSuccess('Thành công', 'Đã xuất file Excel thành công');
    } catch (error: any) {
      console.error('Export error:', error);
      showError('Lỗi', error.message || 'Không thể xuất file Excel');
    }
  };

  // Import orders from Excel
  const importFromExcel = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3001/api/orders/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      showSuccess('Thành công', `Đã nhập ${result.imported} đơn hàng thành công`);
      fetchOrders(); // Refresh the orders list
    } catch (error: any) {
      console.error('Import error:', error);
      showError('Lỗi', error.message || 'Không thể nhập file Excel');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        importFromExcel(file);
      } else {
        showError('Lỗi', 'Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      }
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý đơn hàng</h1>
        <p className="text-gray-600">Xem và quản lý tất cả đơn hàng bán hàng</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date From */}
          <div>
            <input
              type="date"
              value={dateFilter.start_date}
              onChange={(e) => setDateFilter(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <input
              type="date"
              value={dateFilter.end_date}
              onChange={(e) => setDateFilter(prev => ({ ...prev, end_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="paid">Đã thanh toán</option>
              <option value="partial">Thanh toán một phần</option>
              <option value="unpaid">Chưa thanh toán</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Tìm thấy {filteredOrders.length} đơn hàng
          </div>
          <div className="flex items-center gap-2">
            {/* Import Button */}
            <label className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Nhập file
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            
            {/* Export Button */}
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Xuất file
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có đơn hàng</h3>
            <p className="text-gray-600">Chưa có đơn hàng nào được tạo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã hóa đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách cần trả
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{order.order_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.created_at).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.customer_name || 'Khách lẻ'}</div>
                      {order.customer_phone && (
                        <div className="text-sm text-gray-500">{order.customer_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN').format(order.subtotal)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Intl.NumberFormat('vi-VN').format(order.discount_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN').format(order.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.payment_status)}`}>
                        {getStatusText(order.payment_status)}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {getPaymentMethodText(order.payment_method)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchOrderDetail(order.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            showSuccess('Thông báo', 'Chức năng in đang được phát triển');
                          }}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="In hóa đơn"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Chi tiết đơn hàng {selectedOrder.order_number}
                </h2>
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Order Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Thông tin đơn hàng
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã đơn hàng:</span>
                      <span className="font-medium">{selectedOrder.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thời gian:</span>
                      <span className="font-medium">
                        {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.payment_status)}`}>
                        {getStatusText(selectedOrder.payment_status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phương thức thanh toán:</span>
                      <span className="font-medium">{getPaymentMethodText(selectedOrder.payment_method)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Thông tin khách hàng
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tên khách hàng:</span>
                      <span className="font-medium">{selectedOrder.customer_name || 'Khách lẻ'}</span>
                    </div>
                    {selectedOrder.customer_phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Số điện thoại:</span>
                        <span className="font-medium">{selectedOrder.customer_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Sản phẩm</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Sản phẩm</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Số lượng</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Đơn giá</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.product_name}</td>
                            <td className="px-4 py-2 text-sm text-center text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-900">
                              {new Intl.NumberFormat('vi-VN').format(item.unit_price)}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                              {new Intl.NumberFormat('vi-VN').format(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Tổng kết đơn hàng
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng tiền hàng:</span>
                    <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(selectedOrder.subtotal)} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giảm giá:</span>
                    <span className="font-medium text-red-600">-{new Intl.NumberFormat('vi-VN').format(selectedOrder.discount_amount)} đ</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Tổng cộng:</span>
                    <span className="text-blue-600">{new Intl.NumberFormat('vi-VN').format(selectedOrder.total_amount)} đ</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Ghi chú:</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders; 