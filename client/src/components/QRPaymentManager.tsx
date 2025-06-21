import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, Check, X, ExternalLink, Info, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './Toast';

interface QRPaymentManagerProps {
  onBack?: () => void;
}

interface PaymentProvider {
  id: string;
  name: string;
  fullName: string;
  logo: string;
  logoColor: string;
  status: 'connected' | 'not_connected';
  type: 'bank' | 'ewallet';
  accounts?: Array<{
    ownerName: string;
    accountNumber: string;
  }>;
}

interface RegistrationFormData {
  bank: string;
  accountNumber: string;
  ownerName: string;
  phoneNumber: string;
  agreeTerms: boolean;
}

// Separate component for Registration Modal to prevent unnecessary re-renders
const RegistrationModal: React.FC<{
  selectedProvider: PaymentProvider | null;
  showModal: boolean;
  onClose: () => void;
  onSubmit: (data: RegistrationFormData) => Promise<void>;
  isSubmitting: boolean;
}> = React.memo(({ selectedProvider, showModal, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    bank: selectedProvider?.name || '',
    accountNumber: '',
    ownerName: '',
    phoneNumber: '',
    agreeTerms: false
  });

  const [errors, setErrors] = useState<{
    accountNumber?: string;
    ownerName?: string;
    phoneNumber?: string;
    agreeTerms?: string;
  }>({});

  // Reset form when modal opens with new provider
  React.useEffect(() => {
    if (selectedProvider && showModal) {
      setFormData({
        bank: selectedProvider.name,
        accountNumber: '',
        ownerName: '',
        phoneNumber: '',
        agreeTerms: false
      });
      setErrors({});
    }
  }, [selectedProvider, showModal]);

  // Validation functions
  const validateAccountNumber = (value: string): string | undefined => {
    if (!value.trim()) return 'Vui lòng nhập số tài khoản';
    if (value.length < 6 || value.length > 20) return 'Số tài khoản phải có từ 6-20 ký tự';
    if (!/^[0-9]+$/.test(value)) return 'Số tài khoản chỉ được chứa các chữ số';
    return undefined;
  };

  const validateOwnerName = (value: string): string | undefined => {
    if (!value.trim()) return 'Vui lòng nhập tên chủ tài khoản';
    if (value.trim().length < 2) return 'Tên chủ tài khoản phải có ít nhất 2 ký tự';
    return undefined;
  };

  const validatePhoneNumber = (value: string): string | undefined => {
    if (!value.trim()) return 'Vui lòng nhập số điện thoại';
    const cleanPhone = value.replace(/\s+/g, '');
    if (!/^[0-9]{10,11}$/.test(cleanPhone)) return 'Số điện thoại không hợp lệ (10-11 chữ số)';
    return undefined;
  };

  const handleInputChange = useCallback((field: keyof RegistrationFormData) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Clear error when user starts typing
      if (errors[field as keyof typeof errors]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    };
  }, [errors]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    const accountError = validateAccountNumber(formData.accountNumber);
    if (accountError) newErrors.accountNumber = accountError;
    
    const ownerError = validateOwnerName(formData.ownerName);
    if (ownerError) newErrors.ownerName = ownerError;
    
    const phoneError = validatePhoneNumber(formData.phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Vui lòng đồng ý với điều khoản sử dụng';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    await onSubmit(formData);
  }, [formData, onSubmit]);

  if (!selectedProvider || !showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Đăng ký dịch vụ thông báo thanh toán QR
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Bank Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngân hàng <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.bank}
              onChange={handleInputChange('bank')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={selectedProvider.name}>{selectedProvider.name}</option>
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số tài khoản <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={handleInputChange('accountNumber')}
              placeholder="Nhập số tài khoản"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.accountNumber 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              autoComplete="off"
              spellCheck="false"
              required
            />
            {errors.accountNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
            )}
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chủ tài khoản <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={handleInputChange('ownerName')}
              placeholder="Nhập tên chủ tài khoản"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.ownerName 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              style={{ textTransform: 'uppercase' }}
              autoComplete="name"
              spellCheck="false"
              required
            />
            {errors.ownerName && (
              <p className="mt-1 text-sm text-red-600">{errors.ownerName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={handleInputChange('phoneNumber')}
              placeholder="Nhập số điện thoại đã đăng ký"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.phoneNumber 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              autoComplete="tel"
              spellCheck="false"
              required
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleInputChange('agreeTerms')}
              className={`mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                errors.agreeTerms ? 'border-red-300' : ''
              }`}
            />
            <div className="flex-1">
              <label htmlFor="agreeTerms" className="text-sm text-gray-600 leading-relaxed">
                Tôi đã đọc và đồng ý để {selectedProvider.name} cung cấp thông tin giao dịch 
                trên tài khoản của tôi cho KiotViet và đồng ý với{' '}
                <button className="text-blue-600 hover:text-blue-700 underline">
                  Điều kiện và điều khoản sử dụng dịch vụ
                </button>
              </label>
              {errors.agreeTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.agreeTerms}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Bỏ qua
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </div>
      </div>
    </div>
  );
});

const QRPaymentManager: React.FC<QRPaymentManagerProps> = ({ onBack }) => {
  const { showSuccess, showError } = useToast();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status on component mount
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!(token && user));
  }, []);

  const [providers, setProviders] = useState<PaymentProvider[]>([
    {
      id: 'vib',
      name: 'VIB',
      fullName: 'Ngân hàng Quốc Tế',
      logo: '🟡',
      logoColor: 'bg-yellow-500',
      status: 'connected',
      type: 'bank',
      accounts: [
        { ownerName: 'PHAN VAN DAT', accountNumber: '9969866687' },
        { ownerName: 'PHAN VAN HUONG', accountNumber: '9356877889' }
      ]
    },
    {
      id: 'bidv',
      name: 'BIDV',
      fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
      logo: '🔵',
      logoColor: 'bg-blue-600',
      status: 'not_connected',
      type: 'bank'
    },
    {
      id: 'vietinbank',
      name: 'VietinBank',
      fullName: 'Ngân Hàng TMCP Công Thương Việt Nam',
      logo: '🔵',
      logoColor: 'bg-blue-500',
      status: 'not_connected',
      type: 'bank'
    },
    {
      id: 'vietcombank',
      name: 'Vietcombank',
      fullName: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
      logo: '🟢',
      logoColor: 'bg-green-600',
      status: 'connected',
      type: 'bank',
      accounts: [
        { ownerName: 'NGUYEN VAN A', accountNumber: '1234567890' }
      ]
    },
    {
      id: 'mbbank',
      name: 'MB Bank',
      fullName: 'Ngân hàng TMCP Quân Đội',
      logo: '🔴',
      logoColor: 'bg-red-600',
      status: 'not_connected',
      type: 'bank'
    },
    {
      id: 'momo',
      name: 'MoMo',
      fullName: 'Siêu Ứng Dụng Thanh Toán số 1 Việt Nam',
      logo: '🟣',
      logoColor: 'bg-pink-500',
      status: 'not_connected',
      type: 'ewallet'
    },
    {
      id: 'zalopay',
      name: 'Zalopay',
      fullName: 'Ứng dụng thanh toán tích thưởng',
      logo: '🔵',
      logoColor: 'bg-blue-500',
      status: 'not_connected',
      type: 'ewallet'
    }
  ]);

  const handleConnect = (provider: PaymentProvider) => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      showError(
        'Chưa đăng nhập', 
        'Vui lòng đăng nhập vào hệ thống trước khi đăng ký dịch vụ QR Payment.\n\nBạn có thể đăng nhập bằng:\n• Tài khoản: admin\n• Mật khẩu: admin123'
      );
      return;
    }

    setSelectedProvider(provider);
    setShowRegistrationModal(true);
  };

  const handleViewDetails = (provider: PaymentProvider) => {
    setSelectedProvider(provider);
    setShowDetailsModal(true);
  };

  const handleRegistrationSubmit = async (data: RegistrationFormData) => {
    if (!selectedProvider) return;
    
    try {
      setIsSubmitting(true);
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        showError(
          'Chưa đăng nhập', 
          'Vui lòng đăng nhập vào hệ thống trước khi đăng ký dịch vụ QR Payment.\n\nBạn có thể đăng nhập bằng:\n• Tài khoản: admin\n• Mật khẩu: admin123'
        );
        return;
      }
      
      const registrationData = {
        provider_id: selectedProvider.id,
        provider_name: selectedProvider.name,
        provider_type: selectedProvider.type,
        account_number: data.accountNumber,
        account_owner: data.ownerName.toUpperCase(),
        phone_number: data.phoneNumber,
        terms_agreed: data.agreeTerms
      };

      console.log('Sending registration data:', registrationData);
      const response = await api.registerQRPayment(registrationData);
      console.log('Registration response:', response);
      
      // Show success message with detailed info
      showSuccess(
        'Đăng ký thành công!', 
        `${response.data.data.message}\n\n` +
        `Ngân hàng: ${response.data.data.provider_name}\n` +
        `Số tài khoản: ${response.data.data.account_number}\n` +
        `Chủ tài khoản: ${response.data.data.account_owner}\n` +
        `Số điện thoại: ${response.data.data.phone_number}`
      );
      
      // Close modal
      setShowRegistrationModal(false);
      
      // Reset form
      setSelectedProvider(null);
      
      // Update provider status to connected
      setProviders(prevProviders => 
        prevProviders.map(provider => 
          provider.id === selectedProvider.id 
            ? { 
                ...provider, 
                status: 'connected' as const,
                accounts: [
                  ...(provider.accounts || []),
                  {
                    ownerName: response.data.data.account_owner,
                    accountNumber: response.data.data.account_number
                  }
                ]
              }
            : provider
        )
      );
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Không thể đăng ký dịch vụ. Vui lòng thử lại.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'Thông tin đăng ký không hợp lệ. Vui lòng kiểm tra lại.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (error.response?.status === 403) {
        errorMessage = 'Không có quyền truy cập. Vui lòng đăng nhập với tài khoản có quyền quản trị.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi hệ thống. Vui lòng liên hệ quản trị viên.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.';
      }
      
      showError('Đăng ký thất bại', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAccount = (accountNumber: string) => {
    console.log('Canceling account:', accountNumber);
    // TODO: Implement account cancellation logic
  };

  // Details Modal Component
  const DetailsModal = () => {
    if (!selectedProvider || !showDetailsModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Thông tin đăng ký dịch vụ {selectedProvider.name}
            </h2>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-6">
              Danh sách tài khoản đã đăng ký dịch vụ
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                <div>Chủ tài khoản</div>
                <div>Tài khoản thanh toán</div>
                <div>Thao tác</div>
              </div>

              {selectedProvider.accounts?.map((account, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 text-sm py-3 border-b border-gray-100">
                  <div className="font-medium text-gray-900">{account.ownerName}</div>
                  <div className="text-gray-700">{account.accountNumber}</div>
                  <div>
                    <button
                      onClick={() => handleCancelAccount(account.accountNumber)}
                      className="px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors"
                    >
                      Hủy đăng ký
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Bỏ qua
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleConnect(selectedProvider);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đăng ký mới
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Login notification component
  const LoginNotification = () => {
    if (isLoggedIn) return null;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-yellow-600 mt-0.5">⚠️</div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">
              Cần đăng nhập để sử dụng tính năng này
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              Vui lòng đăng nhập vào hệ thống để đăng ký dịch vụ thông báo thanh toán QR.
            </p>
            <div className="bg-yellow-100 rounded-md p-3 mb-3">
              <p className="text-xs font-medium text-yellow-800 mb-1">Thông tin đăng nhập mặc định:</p>
              <p className="text-xs text-yellow-700">• Tài khoản: <span className="font-mono bg-yellow-200 px-1 rounded">admin</span></p>
              <p className="text-xs text-yellow-700">• Mật khẩu: <span className="font-mono bg-yellow-200 px-1 rounded">admin123</span></p>
            </div>
            <button
              onClick={() => window.location.href = '/login'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Đi tới trang đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderProviderCard = (provider: PaymentProvider) => {
    const isConnected = provider.status === 'connected';
    
    return (
      <div key={provider.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${provider.logoColor} rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
              {provider.name === 'VIB' && '🏦'}
              {provider.name === 'BIDV' && '🏛️'}
              {provider.name === 'VietinBank' && '🏦'}
              {provider.name === 'Vietcombank' && '🏛️'}
              {provider.name === 'MB Bank' && '⭐'}
              {provider.name === 'MoMo' && '📱'}
              {provider.name === 'Zalopay' && '💳'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{provider.name}</h3>
              <p className="text-sm text-gray-600 leading-tight">{provider.fullName}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {isConnected ? 'Đã đăng ký' : 'Chưa đăng ký'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleViewDetails(provider)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
          >
            Hướng dẫn
          </button>
          
          {isConnected ? (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => handleViewDetails(provider)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Xem chi tiết
              </button>
            </div>
          ) : (
            <div className="ml-auto">
              <button
                onClick={() => handleConnect(provider)}
                disabled={!isLoggedIn}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isLoggedIn 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={!isLoggedIn ? 'Vui lòng đăng nhập để sử dụng tính năng này' : ''}
              >
                {provider.id === 'bidv' ? 'Đăng ký' : provider.id === 'momo' || provider.id === 'zalopay' ? 'Kết nối' : 'Đăng ký'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const bankProviders = providers.filter(p => p.type === 'bank');
  const ewalletProviders = providers.filter(p => p.type === 'ewallet');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thông báo thanh toán QR</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">
                Nhận thông báo tiền về ngay trên màn hình thu ngân sau khi khách hàng thanh toán bằng mã QR. 
                <button className="text-blue-600 hover:text-blue-700 underline ml-1">
                  Tìm hiểu thêm
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Login Notification */}
        <LoginNotification />

        {/* Banks Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-wide">NGÂN HÀNG</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankProviders.map(provider => renderProviderCard(provider))}
          </div>
        </div>

        {/* E-wallets Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 tracking-wide">VÍ ĐIỆN TỬ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ewalletProviders.map(provider => renderProviderCard(provider))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <DetailsModal />
      <RegistrationModal
        selectedProvider={selectedProvider}
        showModal={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSubmit={handleRegistrationSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default QRPaymentManager; 