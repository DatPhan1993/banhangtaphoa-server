import React, { useState } from 'react';

interface SettingsProps {
  onNavigate?: (page: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);

  const settingsItems = [
    {
      id: 'store-setup',
      title: 'Thiết lập cửa hàng',
      description: 'Cấu hình thông tin cửa hàng, địa chỉ, logo và thông tin liên hệ',
      icon: '🏪',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700'
    },
    {
      id: 'print-templates',
      title: 'Quản lý mẫu in',
      description: 'Thiết lập và quản lý các mẫu in hóa đơn, phiếu thu chi',
      icon: '🖨️',
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700'
    },
    {
      id: 'user-management',
      title: 'Quản lý người dùng',
      description: 'Quản lý tài khoản người dùng, phân quyền và bảo mật',
      icon: '👥',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700'
    },
    {
      id: 'branch-management',
      title: 'Quản lý chi nhánh',
      description: 'Thiết lập và quản lý thông tin các chi nhánh cửa hàng',
      icon: '🏢',
      color: 'from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700'
    },
    {
      id: 'qr-payment',
      title: 'Quản lý thanh toán QR',
      description: 'Cấu hình và quản lý các phương thức thanh toán QR code',
      icon: '📱',
      color: 'from-teal-500 to-teal-600',
      hoverColor: 'hover:from-teal-600 hover:to-teal-700'
    },
    {
      id: 'transaction-history',
      title: 'Lịch sử giao dịch',
      description: 'Xem và quản lý lịch sử các giao dịch đã thực hiện',
      icon: '📋',
      color: 'from-indigo-500 to-indigo-600',
      hoverColor: 'hover:from-indigo-600 hover:to-indigo-700'
    }
  ];

  const handleSettingClick = (settingId: string) => {
    setSelectedSetting(settingId);
    if (onNavigate) {
      if (settingId === 'store-setup') {
        onNavigate('store-setup');
      } else if (settingId === 'print-templates') {
        onNavigate('print-templates');
      } else if (settingId === 'qr-payment') {
        onNavigate('qr-payment');
      }
      // TODO: Handle other settings navigation
    }
    console.log(`Navigating to ${settingId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl flex items-center justify-center">
              <span className="text-xl">⚙️</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Cài đặt hệ thống</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Quản lý và cấu hình các thiết lập cho hệ thống POS của bạn
          </p>
        </div>

        {/* Settings List - Horizontal Layout */}
        <div className="space-y-4">
          {settingsItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSettingClick(item.id)}
              className={`
                bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer
                transition-all duration-300 hover:shadow-md hover:border-gray-300
                ${selectedSetting === item.id ? 'ring-2 ring-blue-500 shadow-md' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                {/* Left side - Icon, Title and Description */}
                <div className="flex items-center gap-4 flex-1">
                  <div className={`
                    w-16 h-16 bg-gradient-to-r ${item.color} rounded-xl 
                    flex items-center justify-center text-2xl shadow-md
                    transition-all duration-300 ${item.hoverColor}
                  `}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Right side - Action Button and Arrow */}
                <div className="flex items-center gap-4">
                  <button className={`
                    px-6 py-3 bg-gradient-to-r ${item.color} text-white rounded-lg
                    text-sm font-medium transition-all duration-300 ${item.hoverColor}
                    hover:shadow-md
                  `}>
                    Cấu hình
                  </button>
                  <div className="text-gray-400 text-xl">
                    →
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>⚡</span>
            Thao tác nhanh
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
              <div className="text-2xl mb-2">🔄</div>
              <div className="font-medium text-gray-900">Sao lưu dữ liệu</div>
              <div className="text-sm text-gray-600">Tạo bản sao lưu</div>
            </button>
            <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium text-gray-900">Xuất báo cáo</div>
              <div className="text-sm text-gray-600">Tạo báo cáo tổng hợp</div>
            </button>
            <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
              <div className="text-2xl mb-2">🔧</div>
              <div className="font-medium text-gray-900">Bảo trì hệ thống</div>
              <div className="text-sm text-gray-600">Kiểm tra và tối ưu</div>
            </button>
            <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
              <div className="text-2xl mb-2">❓</div>
              <div className="font-medium text-gray-900">Trợ giúp</div>
              <div className="text-sm text-gray-600">Hướng dẫn sử dụng</div>
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="mt-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Thông tin hệ thống</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-300">Phiên bản</div>
              <div className="font-medium">POS System v1.0.0</div>
            </div>
            <div>
              <div className="text-gray-300">Cập nhật cuối</div>
              <div className="font-medium">{new Date().toLocaleDateString('vi-VN')}</div>
            </div>
            <div>
              <div className="text-gray-300">Trạng thái</div>
              <div className="font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Hoạt động bình thường
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 