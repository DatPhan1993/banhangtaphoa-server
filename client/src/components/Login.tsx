import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.login(formData);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        login(user, token);
      } else {
        setError('Đăng nhập thất bại');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      } else if (err.response?.status === 500) {
        setError('Lỗi server, vui lòng thử lại sau');
      } else {
        setError('Không thể kết nối đến server');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (username: string, password: string) => {
    setFormData({ username, password });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <span className="text-3xl">🏪</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            POS System
          </h1>
          <p className="text-gray-600 text-lg">Hệ thống quản lý bán hàng hiện đại</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 text-center">Đăng nhập</h2>
            <p className="text-gray-600 text-center mt-2">Chào mừng bạn trở lại!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  placeholder="Nhập mật khẩu"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang đăng nhập...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <LogIn className="h-5 w-5" />
                  <span>Đăng nhập</span>
                </div>
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-4 text-center">
              🎯 Tài khoản demo
            </h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin', 'admin123')}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl transition-all duration-200 text-sm border border-red-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-red-700">👑 Quản trị viên</span>
                    <div className="text-red-600 text-xs mt-1">admin / admin123</div>
                  </div>
                  <div className="text-red-500 text-xs">Toàn quyền</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleDemoLogin('sales', 'sales123')}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all duration-200 text-sm border border-green-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-green-700">💼 Nhân viên bán hàng</span>
                    <div className="text-green-600 text-xs mt-1">sales / sales123</div>
                  </div>
                  <div className="text-green-500 text-xs">POS + Khách hàng</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleDemoLogin('warehouse', 'warehouse123')}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-200 text-sm border border-blue-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-blue-700">📦 Nhân viên kho</span>
                    <div className="text-blue-600 text-xs mt-1">warehouse / warehouse123</div>
                  </div>
                  <div className="text-blue-500 text-xs">Kho + Sản phẩm</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© 2024 POS System. Phát triển bởi AI Assistant</p>
          <p className="mt-1 text-xs">Kết nối với MySQL Database</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 