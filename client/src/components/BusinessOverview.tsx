import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft,
  Calendar,
  BarChart3,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Đăng ký các component Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BusinessOverviewProps {
  onBack: () => void;
}

interface BusinessStats {
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgOrderValue: number;
  avgDailyRevenue: number;
  avgDailyCost: number;
  avgDailyProfit: number;
  orderGrowth: number;
  revenueGrowth: number;
  costGrowth: number;
  profitGrowth: number;
  topProducts: Array<{
    name: string;
    revenue: number;
    avgRevenue: number;
    growth: number;
  }>;
  topCategories: Array<{
    name: string;
    revenue: number;
    avgRevenue: number;
    growth: number;
  }>;
  dailyStats: Array<{
    date: string;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
  }>;
  topCategoriesByOrders: Array<{
    name: string;
    orders: number;
    growth: number;
  }>;
  topProductsByOrders: Array<{
    name: string;
    orders: number;
    growth: number;
  }>;
  slowSellingProducts: Array<{
    name: string;
    quantity_sold: number;
    stock_quantity: number;
    revenue: number;
    last_sale_date: string;
  }>;
  slowSellingCategories: Array<{
    name: string;
    quantity_sold: number;
    stock_quantity: number;
    revenue: number;
    last_sale_date: string;
  }>;
}

const BusinessOverview: React.FC<BusinessOverviewProps> = ({ onBack }) => {
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 17)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('orders');

  const loadBusinessStats = useCallback(async () => {
    try {
      if (stats) {
        setChartLoading(true); // Chỉ hiển thị chart loading nếu đã có dữ liệu trước đó
      } else {
        setLoading(true); // Full loading cho lần đầu
      }
      console.log('🔍 Loading business stats for date range:', dateRange.startDate, 'to', dateRange.endDate);
      const response = await api.getBusinessOverview(dateRange.startDate, dateRange.endDate);
      console.log('📊 API Response:', response.data);
      console.log('💾 Setting stats to:', response.data.data);
      setStats(response.data.data);
    } catch (error) {
      console.error('❌ Error loading business stats:', error);
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate, stats]);

  useEffect(() => {
    loadBusinessStats();
  }, [loadBusinessStats]);

  // Reload dữ liệu khi thay đổi dateRange
  useEffect(() => {
    const timer = setTimeout(() => {
      loadBusinessStats();
    }, 500); // Debounce 500ms để tránh gọi API liên tục khi user đang chọn ngày

    return () => clearTimeout(timer);
  }, [dateRange.startDate, dateRange.endDate, loadBusinessStats]);

  // Handler cho việc thay đổi ngày
  const handleDateChange = (type: 'startDate' | 'endDate', value: string) => {
    console.log(`📅 Changing ${type} to:`, value);
    setDateRange(prev => ({ ...prev, [type]: value }));
  };

  const formatCurrency = (amount: number) => {
    if (!amount || amount === 0) return '0';
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)} triệu`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)},${(amount % 1000).toString().padStart(3, '0')}`;
    }
    return amount.toLocaleString('vi-VN');
  };

  const formatGrowth = (growth: number) => {
    if (growth === 0) return '--';
    const sign = growth > 0 ? '+' : '';
    return `${sign}${growth.toFixed(2)}%`;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Tạo dữ liệu cho biểu đồ
  const createChartData = () => {
    if (!stats?.dailyStats || stats.dailyStats.length === 0) {
      return null;
    }

    const labels = stats.dailyStats.map(item => {
      const date = new Date(item.date);
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    });

    const revenueData = stats.dailyStats.map(item => parseFloat(item.revenue.toString()) / 1000000); // Convert to millions
    const costData = stats.dailyStats.map(item => parseFloat(item.cost.toString()) / 1000000);
    const profitData = stats.dailyStats.map(item => parseFloat(item.profit.toString()) / 1000000);
    const ordersData = stats.dailyStats.map(item => item.orders);

    return {
      labels,
      datasets: [
        {
          label: 'Doanh thu (triệu)',
          data: revenueData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: false,
          yAxisID: 'y'
        },
        {
          label: 'Số đơn hàng',
          data: ordersData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: false,
          yAxisID: 'y1'
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.yAxisID === 'y1') {
              label += context.parsed.y + ' đơn';
            } else {
              label += context.parsed.y.toFixed(2) + ' triệu';
            }
            return label;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Ngày'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Giá trị (triệu)'
        },
        grid: {
          drawOnChartArea: true,
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Số đơn hàng'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const chartData = createChartData();

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Tổng quan kinh doanh</h1>
          </div>
          <div className="text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Tổng quan kinh doanh</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3 py-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="border-none outline-none text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="border-none outline-none text-sm"
              />
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Xuất báo cáo
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Số hóa đơn */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Số hóa đơn</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-600">Trung bình/ngày</span>
                  <span className="text-sm font-medium">{Math.round((stats?.totalOrders || 0) / 18)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">So với kỳ trước</span>
                  <span className={`text-sm font-medium ${getGrowthColor(stats?.orderGrowth || 0)}`}>
                    {formatGrowth(stats?.orderGrowth || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Doanh thu */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Doanh thu</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-600">Trung bình/ngày</span>
                  <span className="text-sm font-medium">{formatCurrency(stats?.avgDailyRevenue || 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">So với kỳ trước</span>
                  <span className={`text-sm font-medium ${getGrowthColor(stats?.revenueGrowth || 0)}`}>
                    {formatGrowth(stats?.revenueGrowth || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Giá trị trả */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Giá trị trả</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-600">Trung bình/ngày</span>
                  <span className="text-sm font-medium">0</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">So với kỳ trước</span>
                  <span className="text-sm font-medium text-gray-600">--%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Doanh thu */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Doanh thu</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-600">Trung bình/ngày</span>
                  <span className="text-sm font-medium">{formatCurrency(stats?.avgDailyRevenue || 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">So với kỳ trước</span>
                  <span className={`text-sm font-medium ${getGrowthColor(stats?.revenueGrowth || 0)}`}>
                    {formatGrowth(stats?.revenueGrowth || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tổng giá vốn */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Tổng giá vốn</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.totalCost || 0)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-600">Trung bình/ngày</span>
                  <span className="text-sm font-medium">{formatCurrency(stats?.avgDailyCost || 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">So với kỳ trước</span>
                  <span className={`text-sm font-medium ${getGrowthColor(stats?.costGrowth || 0)}`}>
                    {formatGrowth(stats?.costGrowth || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TB doanh thu */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">TB doanh thu</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-600">Tổng doanh thu khoảng thời gian</span>
                  <span className="text-sm font-medium">
                    {Math.round(((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)} ngày
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">So với kỳ trước</span>
                  <span className={`text-sm font-medium ${getGrowthColor(stats?.revenueGrowth || 0)}`}>
                    {formatGrowth(stats?.revenueGrowth || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Chỉ số kinh doanh</h3>
            <div className="text-sm text-blue-600 cursor-pointer">Chi tiết</div>
          </div>
          
          <div className="h-96">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="spinner mx-auto mb-2"></div>
                  <p>Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Biểu đồ sẽ được hiển thị ở đây</p>
                  <p className="text-sm">Dữ liệu từ {dateRange.startDate} đến {dateRange.endDate}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'orders', label: 'Số hóa đơn' },
                { id: 'slow_selling', label: 'Bán chậm' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'orders' ? (
            <>
              {/* Top Categories by Orders */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Top 10 nhóm hàng</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Tên nhóm hàng</th>
                        <th className="text-right py-2">Số hóa đơn</th>
                        <th className="text-right py-2">So với kỳ trước</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.topCategoriesByOrders?.map((category: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{category.name || 'N/A'}</td>
                          <td className="text-right py-2">{category.order_count || 0}</td>
                          <td className="text-right py-2">
                            <span className={`${(category.growth_rate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(category.growth_rate || 0) >= 0 ? '+' : ''}{(category.growth_rate || 0).toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      )) || []}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Products by Orders */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Top 10 hàng hóa</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Tên hàng hóa</th>
                        <th className="text-right py-2">Số hóa đơn</th>
                        <th className="text-right py-2">So với kỳ trước</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.topProductsByOrders?.map((product: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{product.name || 'N/A'}</td>
                          <td className="text-right py-2">{product.order_count || 0}</td>
                          <td className="text-right py-2">
                            <span className={`${(product.growth_rate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {(product.growth_rate || 0) >= 0 ? '+' : ''}{(product.growth_rate || 0).toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      )) || []}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Slow Selling Products */}
              <div className="p-6">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Sản phẩm bán chậm</h3>
                  <p className="text-sm text-gray-600 mb-6">Những sản phẩm có số lượng bán ít trong khoảng thời gian đã chọn</p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Tên sản phẩm</th>
                          <th className="text-right py-2">Số lượng bán</th>
                          <th className="text-right py-2">Tồn kho</th>
                          <th className="text-right py-2">Doanh thu</th>
                          <th className="text-right py-2">Ngày bán cuối</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.slowSellingProducts?.map((product: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{product.name || 'N/A'}</td>
                            <td className="text-right py-2">{product.quantity_sold || 0}</td>
                            <td className="text-right py-2">{product.stock_quantity || 0}</td>
                            <td className="text-right py-2">{formatCurrency(product.revenue || 0)}</td>
                            <td className="text-right py-2">
                              {product.last_sale_date ? new Date(product.last_sale_date).toLocaleDateString('vi-VN') : 'Chưa bán'}
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              Không có dữ liệu sản phẩm bán chậm
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessOverview; 