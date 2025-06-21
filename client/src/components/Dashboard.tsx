import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  ShoppingCart,
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  BarChart3,
  PieChart,
  Banknote,
  CreditCard,
  Building2,
  Smartphone,
  Eye,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';

interface DashboardStats {
  total_products: number;
  out_of_stock: number;
  low_stock: number;
  total_inventory_value: number;
}

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  useEffect(() => {
    loadDashboardStats();
    // Auto refresh every 5 minutes
    const interval = setInterval(loadDashboardStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await api.getDashboardStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4" />;
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'transfer': return <Building2 className="w-4 h-4" />;
      case 'e_wallet': return <Smartphone className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getPaymentMethodText = (method: string) => {
    const methods = {
      cash: 'Tiền mặt',
      card: 'Thẻ',
      transfer: 'Chuyển khoản',
      e_wallet: 'Ví điện tử'
    };
    return methods[method as keyof typeof methods] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-2xl mx-auto animate-pulse-scale">
            <BarChart3 className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-4">
            <div className="spinner mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-900">Đang tải Dashboard</h2>
            <p className="text-gray-600 max-w-md">
              Chúng tôi đang thu thập dữ liệu mới nhất cho bạn...
            </p>
          </div>
          
          {/* Loading Cards Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 max-w-6xl">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/50 backdrop-blur-sm p-6 rounded-xl shadow-lg animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">
                    Chào mừng trở lại! 👋
                  </h1>
                  <p className="text-blue-100 text-lg mt-2">
                    Đây là tổng quan về kho hàng và sản phẩm
                  </p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-8 mt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats?.total_products.toLocaleString() || 0}</div>
                  <div className="text-blue-100 text-sm">Tổng sản phẩm</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{stats?.out_of_stock || 0}</div>
                  <div className="text-blue-100 text-sm">Hết hàng</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatCurrency(stats?.total_inventory_value || 0)}</div>
                  <div className="text-blue-100 text-sm">Giá trị kho</div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => onNavigate?.('pos')}
                className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
              >
                <ShoppingCart className="w-5 h-5" />
                Bán hàng ngay
              </button>
              <button 
                onClick={() => onNavigate?.('products')}
                className="px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
              >
                <Package className="w-5 h-5" />
                Quản lý sản phẩm
              </button>
            </div>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Products */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.total_products.toLocaleString() || 0}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Đang hoạt động
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Out of Stock */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hết hàng</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats?.out_of_stock || 0}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Cần nhập thêm
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Low Stock */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sắp hết hàng</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {stats?.low_stock || 0}
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Cần theo dõi
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Total Inventory Value */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng giá trị kho</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {formatCurrency(stats?.total_inventory_value || 0)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Tài sản hiện có
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            onClick={() => onNavigate?.('products')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quản lý sản phẩm</h3>
            <p className="text-gray-600 text-sm">Thêm, sửa, xóa sản phẩm và quản lý tồn kho</p>
          </div>

          <div 
            onClick={() => onNavigate?.('pos')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bán hàng</h3>
            <p className="text-gray-600 text-sm">Tạo đơn hàng và xử lý thanh toán</p>
          </div>

          <div 
            onClick={() => onNavigate?.('inventory')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tồn kho</h3>
            <p className="text-gray-600 text-sm">Theo dõi và điều chỉnh tồn kho</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 