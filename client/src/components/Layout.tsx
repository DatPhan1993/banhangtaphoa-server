import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Boxes, 
  FileText, 
  Users, 
  Building2, 
  TrendingUp, 
  User, 
  Settings, 
  LogOut,
  Bell,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, hasRole } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Trang chủ',
      icon: BarChart3,
      roles: ['admin', 'sales', 'warehouse', 'accountant'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'pos',
      name: 'Bán hàng',
      icon: ShoppingCart,
      roles: ['admin', 'sales'],
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'products',
      name: 'Sản phẩm',
      icon: Package,
      roles: ['admin', 'sales', 'warehouse'],
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'inventory',
      name: 'Tồn kho',
      icon: Boxes,
      roles: ['admin', 'warehouse'],
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'orders',
      name: 'Đơn hàng',
      icon: FileText,
      roles: ['admin', 'sales', 'accountant'],
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'customers',
      name: 'Khách hàng',
      icon: Users,
      roles: ['admin', 'sales'],
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'suppliers',
      name: 'Nhà cung cấp',
      icon: Building2,
      roles: ['admin', 'warehouse'],
      color: 'from-teal-500 to-teal-600'
    },
    {
      id: 'reports',
      name: 'Báo cáo',
      icon: TrendingUp,
      roles: ['admin', 'accountant'],
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'users',
      name: 'Người dùng',
      icon: User,
      roles: ['admin'],
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'settings',
      name: 'Cài đặt',
      icon: Settings,
      roles: ['admin'],
      color: 'from-slate-500 to-slate-600'
    }
  ];

  const filteredMenuItems = menuItems.filter(item => hasRole(item.roles));

  const handleLogout = () => {
    logout();
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'from-red-500 to-red-600',
      sales: 'from-green-500 to-green-600',
      warehouse: 'from-blue-500 to-blue-600',
      accountant: 'from-purple-500 to-purple-600',
      delivery: 'from-orange-500 to-orange-600'
    };
    return colors[role as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getRoleText = (role: string) => {
    const roles = {
      admin: 'Quản trị viên',
      sales: 'Nhân viên bán hàng',
      warehouse: 'Nhân viên kho',
      accountant: 'Kế toán',
      delivery: 'Giao hàng'
    };
    return roles[role as keyof typeof roles] || role;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-2xl transform transition-all duration-300 ease-in-out border-r border-gray-200 ${
        sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'
      } lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center py-6 border-b border-gray-100 transition-all duration-300 ${
            sidebarCollapsed ? 'px-4 justify-center' : 'px-6'
          }`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'w-full'}`}>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🏪</span>
              </div>
              {!sidebarCollapsed && (
                <div className="ml-4">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    POS System
                  </h1>
                  <p className="text-sm text-gray-500">Hệ thống quản lý bán hàng</p>
                </div>
              )}
            </div>
            {/* Collapse Toggle Button - Desktop Only */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`hidden lg:flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${
                sidebarCollapsed ? 'absolute top-6 right-2' : 'ml-auto'
              }`}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>

          {/* User Info */}
          <div className={`py-6 border-b border-gray-100 transition-all duration-300 ${
            sidebarCollapsed ? 'px-4' : 'px-6'
          }`}>
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className={`w-12 h-12 bg-gradient-to-r ${getRoleColor(user?.role || 'admin')} rounded-xl flex items-center justify-center shadow-lg`}>
                <span className="text-white font-bold text-lg">
                  {user?.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              {!sidebarCollapsed && (
                <div className="ml-4 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{getRoleText(user?.role || 'admin')}</p>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-xs text-green-600 font-medium">Đang hoạt động</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {!sidebarCollapsed && (
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
                MENU CHÍNH
              </div>
            )}
            {filteredMenuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center text-sm font-medium rounded-xl transition-all duration-200 group ${
                    sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
                  } ${
                    currentPage === item.id
                      ? `bg-gradient-to-r ${item.color} text-white shadow-lg transform scale-105`
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:scale-105'
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <div className={`p-2 rounded-lg transition-all duration-200 ${
                    sidebarCollapsed ? 'mr-0' : 'mr-3'
                  } ${
                    currentPage === item.id
                      ? 'bg-white bg-opacity-20'
                      : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-medium">{item.name}</span>
                      {currentPage === item.id && (
                        <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-6 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200 group ${
                sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
              }`}
              title={sidebarCollapsed ? 'Đăng xuất' : undefined}
            >
              <div className={`p-2 rounded-lg bg-gray-100 group-hover:bg-red-100 transition-all duration-200 ${
                sidebarCollapsed ? 'mr-0' : 'mr-3'
              }`}>
                <LogOut className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && <span className="font-medium">Đăng xuất</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-1">
            {/* Mobile Menu & Search */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Search Bar */}
              <div className="hidden md:flex items-center bg-gray-50 rounded-xl px-4 py-2 min-w-80">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm, đơn hàng..."
                  className="bg-transparent border-none outline-none text-sm flex-1 text-gray-700 placeholder-gray-400"
                />
                <kbd className="hidden md:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-200 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Current Page Title */}
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {filteredMenuItems.find(item => item.id === currentPage)?.name || 'Dashboard'}
              </h1>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(user?.role || 'admin')} rounded-lg flex items-center justify-center shadow-md`}>
                    <span className="text-white font-bold text-sm">
                      {user?.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">{getRoleText(user?.role || 'admin')}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-40">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                      <p className="text-xs text-gray-500">{user?.username}</p>
                    </div>
                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Cài đặt tài khoản
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="h-full">
            {/* Page Content with Padding */}
            <div className="pl-2 pr-0 py-2">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* User menu overlay */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

export default Layout; 