import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  BarChart3, 
  PieChart, 
  Users, 
  Activity,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Download
} from 'lucide-react';

interface ReportsProps {
  onNavigate?: (page: string) => void;
}

interface ReportSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  expanded: boolean;
  reports: {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
  }[];
}

const Reports: React.FC<ReportsProps> = ({ onNavigate }) => {
  const [sections, setSections] = useState<ReportSection[]>([
    {
      id: 'business',
      title: 'Kinh doanh',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      expanded: true,
      reports: [
        {
          id: 'business-overview',
          title: 'Tổng quan',
          description: 'Báo cáo tổng quan kinh doanh',
          icon: BarChart3
        },
        {
          id: 'profit-loss',
          title: 'Chi phí - Lợi nhuận',
          description: 'Báo cáo chi phí và lợi nhuận',
          icon: DollarSign
        }
      ]
    },
    {
      id: 'inventory',
      title: 'Hàng hóa',
      icon: Package,
      color: 'from-green-500 to-green-600',
      expanded: true,
      reports: [
        {
          id: 'inventory-overview',
          title: 'Tổng quan',
          description: 'Báo cáo tổng quan hàng hóa',
          icon: Package
        },
        {
          id: 'stock-level',
          title: 'Tồn kho',
          description: 'Báo cáo tình trạng tồn kho',
          icon: BarChart3
        },
        {
          id: 'consumption-forecast',
          title: 'Dự báo tiêu thụ',
          description: 'Dự báo nhu cầu tiêu thụ hàng hóa',
          icon: TrendingUp
        },
        {
          id: 'product-categories',
          title: 'Phân loại hàng hóa',
          description: 'Báo cáo theo phân loại sản phẩm',
          icon: PieChart
        }
      ]
    },
    {
      id: 'customers',
      title: 'Khách hàng',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      expanded: true,
      reports: [
        {
          id: 'customer-overview',
          title: 'Tổng quan',
          description: 'Báo cáo tổng quan khách hàng',
          icon: Users
        },
        {
          id: 'customer-segments',
          title: 'Phân loại khách hàng',
          description: 'Phân tích và phân loại khách hàng',
          icon: PieChart
        }
      ]
    },
    {
      id: 'performance',
      title: 'Hiệu quả',
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      expanded: true,
      reports: [
        {
          id: 'customer-debt',
          title: 'Công nợ khách hàng',
          description: 'Báo cáo công nợ và thanh toán',
          icon: FileText
        }
      ]
    }
  ]);

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(section => 
      section.id === sectionId 
        ? { ...section, expanded: !section.expanded }
        : section
    ));
  };

  const handleReportClick = (reportId: string) => {
    // Handle report navigation or generation
    console.log('Opening report:', reportId);
    
    // Navigate to specific report pages
    if (reportId === 'business-overview') {
      onNavigate?.('business-overview');
    } else if (reportId === 'inventory-overview') {
      onNavigate?.('product-overview');
    }
    // Add more report navigation logic here
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Báo cáo</h1>
          <p className="text-gray-600">Tổng hợp và phân tích dữ liệu kinh doanh</p>
        </div>

        {/* Report Sections in single column layout similar to the image */}
        <div className="space-y-6">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Section Header */}
                <div 
                  className="flex items-center justify-between p-4 bg-blue-50 border-b border-gray-200 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                  </div>
                  {section.expanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>

                {/* Section Content */}
                {section.expanded && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.reports.map((report) => {
                        return (
                          <div
                            key={report.id}
                            className="p-3 rounded-lg bg-gray-50 hover:bg-blue-50 cursor-pointer transition-colors border border-gray-200 hover:border-blue-300"
                            onClick={() => handleReportClick(report.id)}
                          >
                                                         <div className="flex items-center justify-between">
                               <div className="flex-1">
                                 <h3 className="font-medium text-gray-900 mb-1">{report.title}</h3>
                                 <p className="text-sm text-gray-600">{report.description}</p>
                               </div>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Báo cáo theo thời gian</h4>
                  <p className="text-sm text-gray-600">Chọn khoảng thời gian</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Xuất tất cả</h4>
                  <p className="text-sm text-gray-600">Tải về định dạng Excel</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Phân tích xu hướng</h4>
                  <p className="text-sm text-gray-600">Xem biểu đồ chi tiết</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 