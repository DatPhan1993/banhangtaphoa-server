import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';

interface StoreSettings {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  tax_rate: string;
  currency: string;
  receipt_footer: string;
  low_stock_threshold: string;
}

interface StoreSetupProps {
  onNavigate?: (page: string) => void;
}

const StoreSetup: React.FC<StoreSetupProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    tax_rate: '',
    currency: 'VND',
    receipt_footer: '',
    low_stock_threshold: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadStoreSettings();
  }, []);

  const loadStoreSettings = async () => {
    try {
      setLoading(true);
      const response = await api.getStoreSettings();
      if (response.data.success) {
        const settingsData: StoreSettings = {
          store_name: '',
          store_address: '',
          store_phone: '',
          store_email: '',
          tax_rate: '',
          currency: 'VND',
          receipt_footer: '',
          low_stock_threshold: ''
        };
        
        // Convert array of settings to object
        response.data.data.forEach((setting: any) => {
          if (setting.setting_key in settingsData) {
            (settingsData as any)[setting.setting_key] = setting.setting_value || '';
          }
        });
        
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error loading store settings:', error);
      showToast('Không thể tải thông tin cửa hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.updateStoreSettings(settings);
      if (response.data.success) {
        showToast('Cập nhật thông tin cửa hàng thành công', 'success');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving store settings:', error);
      showToast('Không thể cập nhật thông tin cửa hàng', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof StoreSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
            <span className="text-2xl">🏪</span>
          </div>
          <div className="text-gray-600">Đang tải thông tin cửa hàng...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleBack}
              className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              ←
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏪</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Thiết lập cửa hàng</h1>
                <p className="text-gray-600">Cấu hình thông tin cơ bản của cửa hàng</p>
              </div>
            </div>
          </div>
        </div>

        {/* Store Information Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Thông tin cửa hàng</h2>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên cửa hàng *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) => handleInputChange('store_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tên cửa hàng"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {settings.store_name || 'Chưa thiết lập'}
                  </div>
                )}
              </div>

              {/* Store Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại *
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={settings.store_phone}
                    onChange={(e) => handleInputChange('store_phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số điện thoại"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {settings.store_phone || 'Chưa thiết lập'}
                  </div>
                )}
              </div>

              {/* Store Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email cửa hàng
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={settings.store_email}
                    onChange={(e) => handleInputChange('store_email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập email cửa hàng"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {settings.store_email || 'Chưa thiết lập'}
                  </div>
                )}
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đơn vị tiền tệ
                </label>
                {isEditing ? (
                  <select
                    value={settings.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="VND">VND - Việt Nam Đồng</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {settings.currency === 'VND' ? 'VND - Việt Nam Đồng' : settings.currency}
                  </div>
                )}
              </div>

              {/* Tax Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thuế VAT (%)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.tax_rate}
                    onChange={(e) => handleInputChange('tax_rate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập thuế VAT"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {settings.tax_rate ? `${settings.tax_rate}%` : 'Chưa thiết lập'}
                  </div>
                )}
              </div>

              {/* Low Stock Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngưỡng cảnh báo hết hàng
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    value={settings.low_stock_threshold}
                    onChange={(e) => handleInputChange('low_stock_threshold', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập ngưỡng cảnh báo"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    {settings.low_stock_threshold || 'Chưa thiết lập'}
                  </div>
                )}
              </div>
            </div>

            {/* Store Address - Full Width */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ cửa hàng *
              </label>
              {isEditing ? (
                <textarea
                  value={settings.store_address}
                  onChange={(e) => handleInputChange('store_address', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập địa chỉ đầy đủ của cửa hàng"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                  {settings.store_address || 'Chưa thiết lập'}
                </div>
              )}
            </div>

            {/* Receipt Footer - Full Width */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Footer hóa đơn
              </label>
              {isEditing ? (
                <textarea
                  value={settings.receipt_footer}
                  onChange={(e) => handleInputChange('receipt_footer', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập lời cảm ơn hoặc thông tin liên hệ"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                  {settings.receipt_footer || 'Chưa thiết lập'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt bổ sung</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🔔</span>
                <h4 className="font-medium text-gray-900">Thông báo</h4>
              </div>
              <p className="text-sm text-gray-600">Cấu hình thông báo email và SMS</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🔒</span>
                <h4 className="font-medium text-gray-900">Bảo mật</h4>
              </div>
              <p className="text-sm text-gray-600">Thiết lập bảo mật và sao lưu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreSetup; 