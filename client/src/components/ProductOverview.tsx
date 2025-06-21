import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
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
  Legend
);

interface ProductOverviewProps {
  onBack: () => void;
}

interface ProductStats {
  totalProductsSold: number;
  totalQuantitySold: number;
  netRevenue: number;
  grossProfit: number;
  topCategories: Array<{
    name: string;
    quantity_sold: number;
    quantity_returned: number;
    net_revenue: number;
    gross_profit: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity_sold: number;
    quantity_returned: number;
    net_revenue: number;
    gross_profit: number;
  }>;
  slowSellingProducts?: Array<{
    name: string;
    quantity_sold: number;
    stock_quantity: number;
    revenue: number;
    last_sale_date: string;
  }>;
  slowSellingCategories?: Array<{
    name: string;
    quantity_sold: number;
    stock_quantity: number;
    revenue: number;
    last_sale_date: string;
  }>;
}

const ProductOverview: React.FC<ProductOverviewProps> = ({ onBack }) => {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 17)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('quantity');
  const [showSlowSelling, setShowSlowSelling] = useState(false);

  const loadProductStats = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading product stats for date range:', dateRange.startDate, 'to', dateRange.endDate);
      const response = await api.getProductOverview(dateRange.startDate, dateRange.endDate);
      console.log('📊 API Response:', response.data);
      console.log('📊 Stats data:', response.data.data);
      setStats(response.data.data);
    } catch (error) {
      console.error('❌ Error loading product stats:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    loadProductStats();
  }, [loadProductStats]);

  const handleDateChange = (type: 'startDate' | 'endDate', value: string) => {
    console.log(`📅 Changing ${type} to:`, value);
    setDateRange(prev => ({ ...prev, [type]: value }));
  };

  const formatCurrency = (amount: number) => {
    if (!amount || amount === 0) return '0';
    return amount.toLocaleString('vi-VN');
  };

  // Tính toán tổng doanh thu
  const calculateTotalRevenue = () => {
    console.log('🔢 Calculating total revenue:', stats);
    if (!stats) return 0;
    console.log('💰 Total revenue:', stats.netRevenue);
    return stats.netRevenue;
  };

  // Tính toán doanh thu trung bình và lợi nhuận trung bình mỗi sản phẩm
  const calculateAverageRevenue = () => {
    console.log('🔢 Calculating average revenue:', stats);
    if (!stats || stats.totalProductsSold === 0) return 0;
    const avgRevenue = stats.netRevenue / stats.totalProductsSold;
    console.log('💰 Average revenue per product:', avgRevenue);
    return avgRevenue;
  };

  const calculateAverageProfit = () => {
    console.log('🔢 Calculating average profit:', stats);
    if (!stats || stats.totalProductsSold === 0) return 0;
    const avgProfit = stats.grossProfit / stats.totalProductsSold;
    console.log('💰 Average profit per product:', avgProfit);
    return avgProfit;
  };

  const formatAverageAmount = (amount: number) => {
    if (!amount || amount === 0) return '0';
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)} triệu`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)} nghìn`;
    }
    return amount.toFixed(0);
  };

  // Tính toán doanh thu trung bình mỗi ngày
  const calculateAverageDailyRevenue = () => {
    if (!stats || !stats.netRevenue) return 0;
    const daysDiff = Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return stats.netRevenue / daysDiff;
  };

  // Tạo dữ liệu cho mini charts
  const createMiniChartData = (data: number[], color: string) => {
    return {
      labels: Array.from({ length: data.length }, (_, i) => `${i + 1}`),
      datasets: [
        {
          data,
          borderColor: color,
          backgroundColor: 'transparent',
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2
        }
      ]
    };
  };

  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      point: { radius: 0 }
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Tổng quan hàng hóa</h1>
          </div>
          <div className="text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  // Sample data cho mini charts
  const sampleData1 = [30, 40, 35, 50, 49, 60, 70, 91, 125, 100, 85, 95];
  const sampleData2 = [20, 30, 25, 40, 35, 45, 55, 65, 75, 85, 90, 82];
  const sampleData3 = [100, 120, 110, 140, 130, 150, 160, 180, 200, 190, 185, 195];
  const sampleData4 = [40, 50, 45, 60, 55, 65, 70, 80, 90, 85, 88, 92];

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
            <h1 className="text-2xl font-bold text-gray-900">Tổng quan hàng hóa</h1>
          </div>
          
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 px-3 py-2">
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Số mặt hàng đã bán */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Số mặt hàng đã bán</h3>
            <p className="text-3xl font-bold text-gray-900 mb-4">{stats?.totalProductsSold || 34}</p>
            <div className="h-12">
              <Line data={createMiniChartData(sampleData1, '#3b82f6')} options={miniChartOptions} />
            </div>
          </div>

          {/* Số lượng thực bán */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Số lượng thực bán</h3>
            <p className="text-3xl font-bold text-gray-900 mb-4">{stats?.totalQuantitySold || 82}</p>
            <div className="h-12">
              <Line data={createMiniChartData(sampleData2, '#3b82f6')} options={miniChartOptions} />
            </div>
          </div>

          {/* Doanh thu TB/SP */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Doanh thu TB/SP</h3>
            <p className="text-3xl font-bold text-gray-900 mb-4">{formatCurrency(calculateTotalRevenue())}</p>
            <div className="h-12">
              <Line data={createMiniChartData(sampleData3, '#3b82f6')} options={miniChartOptions} />
            </div>
          </div>

          {/* TB doanh thu */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">TB doanh thu</h3>
            <p className="text-3xl font-bold text-gray-900 mb-4">{formatAverageAmount(calculateAverageDailyRevenue())}</p>
            <div className="h-12">
              <Line data={createMiniChartData(sampleData4, '#3b82f6')} options={miniChartOptions} />
            </div>
          </div>
        </div>

        {/* Top 10% nhóm hàng */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top 10% nhóm hàng</h3>
              <div className="text-sm text-blue-600 cursor-pointer">Chi tiết</div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setShowSlowSelling(false)}
                className={`px-3 py-1 text-sm border rounded ${!showSlowSelling ? 'border-blue-500 text-blue-600' : 'border-gray-300 text-gray-600'}`}
              >
                Bán chạy
              </button>
              <button 
                onClick={() => setShowSlowSelling(true)}
                className={`px-3 py-1 text-sm border rounded ${showSlowSelling ? 'border-blue-500 text-blue-600' : 'border-gray-300 text-gray-600'}`}
              >
                Bán chậm
              </button>
            </div>

            {/* Filter buttons - only show for "Bán chạy" */}
            {!showSlowSelling && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('quantity')}
                  className={`px-4 py-2 text-sm rounded ${activeTab === 'quantity' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Theo số lượng bán
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="p-6">
            {showSlowSelling ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-gray-600">Tên nhóm hàng</th>
                    <th className="text-right py-2 font-medium text-gray-600">Số lượng bán</th>
                    <th className="text-right py-2 font-medium text-gray-600">Tồn kho</th>
                    <th className="text-right py-2 font-medium text-gray-600">Doanh thu</th>
                    <th className="text-right py-2 font-medium text-gray-600">Ngày bán cuối</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.slowSellingCategories?.map((category, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 text-gray-900">{category.name}</td>
                      <td className="text-right py-3 text-gray-900">{category.quantity_sold}</td>
                      <td className="text-right py-3 text-gray-900">{category.stock_quantity}</td>
                      <td className="text-right py-3 text-gray-900">{formatCurrency(category.revenue)}</td>
                      <td className="text-right py-3 text-gray-900">
                        {category.last_sale_date ? new Date(category.last_sale_date).toLocaleDateString('vi-VN') : 'Chưa bán'}
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        Không có dữ liệu nhóm hàng bán chậm
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-gray-600">Tên nhóm hàng</th>
                    <th className="text-right py-2 font-medium text-gray-600">Số lượng bán</th>
                    <th className="text-right py-2 font-medium text-gray-600">Số lượng trả</th>
                    <th className="text-right py-2 font-medium text-gray-600">Doanh thu</th>
                    <th className="text-right py-2 font-medium text-gray-600">Lợi nhuận gộp</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.topCategories?.map((category, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 text-gray-900">{category.name}</td>
                      <td className="text-right py-3 text-gray-900">{category.quantity_sold}</td>
                      <td className="text-right py-3 text-gray-900">{category.quantity_returned}</td>
                      <td className="text-right py-3 text-gray-900">{formatCurrency(category.net_revenue)}</td>
                      <td className="text-right py-3 text-gray-900">{formatCurrency(category.gross_profit)}</td>
                    </tr>
                  )) || (
                    <>
                      <tr className="border-b">
                        <td className="py-3 text-gray-900">Bia, rượu, bánh kẹo, thuốc lá, Nước ngọt</td>
                        <td className="text-right py-3 text-gray-900">42</td>
                        <td className="text-right py-3 text-gray-900">0</td>
                        <td className="text-right py-3 text-gray-900">7,512,000</td>
                        <td className="text-right py-3 text-gray-900">3,230,500</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 text-gray-900">Mỹ chính, dầu ăn, nước mắm,...</td>
                        <td className="text-right py-3 text-gray-900">40</td>
                        <td className="text-right py-3 text-gray-900">0</td>
                        <td className="text-right py-3 text-gray-900">2,405,000</td>
                        <td className="text-right py-3 text-gray-900">1,215,000</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top 10% hàng hóa */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top 10% hàng hóa</h3>
              <div className="text-sm text-blue-600 cursor-pointer">Chi tiết</div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setShowSlowSelling(false)}
                className={`px-3 py-1 text-sm border rounded ${!showSlowSelling ? 'border-blue-500 text-blue-600' : 'border-gray-300 text-gray-600'}`}
              >
                Bán chạy
              </button>
              <button 
                onClick={() => setShowSlowSelling(true)}
                className={`px-3 py-1 text-sm border rounded ${showSlowSelling ? 'border-blue-500 text-blue-600' : 'border-gray-300 text-gray-600'}`}
              >
                Bán chậm
              </button>
            </div>

            {/* Filter buttons - only show for "Bán chạy" */}
            {!showSlowSelling && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('quantity')}
                  className={`px-4 py-2 text-sm rounded ${activeTab === 'quantity' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Theo số lượng bán
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="p-6">
            {showSlowSelling ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-gray-600">Tên hàng</th>
                    <th className="text-right py-2 font-medium text-gray-600">Số lượng bán</th>
                    <th className="text-right py-2 font-medium text-gray-600">Tồn kho</th>
                    <th className="text-right py-2 font-medium text-gray-600">Doanh thu</th>
                    <th className="text-right py-2 font-medium text-gray-600">Ngày bán cuối</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.slowSellingProducts?.map((product, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 text-gray-900">{product.name}</td>
                      <td className="text-right py-3 text-gray-900">{product.quantity_sold}</td>
                      <td className="text-right py-3 text-gray-900">{product.stock_quantity}</td>
                      <td className="text-right py-3 text-gray-900">{formatCurrency(product.revenue)}</td>
                      <td className="text-right py-3 text-gray-900">
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
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-gray-600">Tên hàng</th>
                    <th className="text-right py-2 font-medium text-gray-600">Số lượng bán</th>
                    <th className="text-right py-2 font-medium text-gray-600">Số lượng trả</th>
                    <th className="text-right py-2 font-medium text-gray-600">Doanh thu</th>
                    <th className="text-right py-2 font-medium text-gray-600">Lợi nhuận gộp</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.topProducts?.map((product, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 text-gray-900">{product.name}</td>
                      <td className="text-right py-3 text-gray-900">{product.quantity_sold}</td>
                      <td className="text-right py-3 text-gray-900">{product.quantity_returned}</td>
                      <td className="text-right py-3 text-gray-900">{formatCurrency(product.net_revenue)}</td>
                      <td className="text-right py-3 text-gray-900">{formatCurrency(product.gross_profit)}</td>
                    </tr>
                  )) || (
                    <>
                      <tr className="border-b">
                        <td className="py-3 text-gray-900">gao aan st21 5kg</td>
                        <td className="text-right py-3 text-gray-900">8</td>
                        <td className="text-right py-3 text-gray-900">0</td>
                        <td className="text-right py-3 text-gray-900">960,000</td>
                        <td className="text-right py-3 text-gray-900">40,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 text-gray-900">sữa chua có đường vnm</td>
                        <td className="text-right py-3 text-gray-900">8</td>
                        <td className="text-right py-3 text-gray-900">0</td>
                        <td className="text-right py-3 text-gray-900">187,000</td>
                        <td className="text-right py-3 text-gray-900">11,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 text-gray-900">lốc bò húc thái bht</td>
                        <td className="text-right py-3 text-gray-900">7</td>
                        <td className="text-right py-3 text-gray-900">0</td>
                        <td className="text-right py-3 text-gray-900">470,000</td>
                        <td className="text-right py-3 text-gray-900">470,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 text-gray-900">sữa đà lạt milk ít đường 180ml</td>
                        <td className="text-right py-3 text-gray-900">6</td>
                        <td className="text-right py-3 text-gray-900">0</td>
                        <td className="text-right py-3 text-gray-900">180,000</td>
                        <td className="text-right py-3 text-gray-900">180,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 text-gray-900">thùng sữa chua star</td>
                        <td className="text-right py-3 text-gray-900">6</td>
                        <td className="text-right py-3 text-gray-900">0</td>
                        <td className="text-right py-3 text-gray-900">1,440,000</td>
                        <td className="text-right py-3 text-gray-900">1,440,000</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductOverview; 