import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Products from './components/Products';
import Users from './components/Users';
import Customers from './components/Customers';
import Orders from './components/Orders';
import Reports from './components/Reports';
import BusinessOverview from './components/BusinessOverview';
import ProductOverview from './components/ProductOverview';
import Settings from './components/Settings';
import StoreSetup from './components/StoreSetup';
import PrintTemplateManager from './components/PrintTemplateManager';
import QRPaymentManager from './components/QRPaymentManager';
import { ToastContainer, useToast } from './components/Toast';
import './index.css';

// Loading Component (currently unused but kept for future use)
// const LoadingSpinner: React.FC = () => (
//   <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
//     <div className="text-center">
//       <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg mx-auto animate-pulse-scale">
//         <span className="text-3xl">🏪</span>
//       </div>
//       <div className="spinner mx-auto mb-4"></div>
//       <p className="text-gray-600 font-medium">Đang tải...</p>
//     </div>
//   </div>
// );

// Page Not Found Component
const PageNotFound: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div className="text-center">
      <div className="w-32 h-32 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mb-8 mx-auto">
        <span className="text-6xl">❓</span>
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Trang không tìm thấy</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
      <button
        onClick={() => window.location.reload()}
        className="btn-primary"
      >
        Về trang chủ
      </button>
    </div>
  </div>
);

// Main App Component
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Handle page navigation with transition
  const handleNavigate = useCallback(async (page: string) => {
    if (page === currentPage) return;
    
    setIsLoading(true);
    // Simulate loading delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 300));
    setCurrentPage(page);
    setIsLoading(false);
  }, [currentPage]);

  // Listen for hash changes
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== currentPage) {
        handleNavigate(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Check initial hash
    handleHashChange();
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentPage, handleNavigate]);

  // Render page content with animation
  const renderPageContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải trang...</p>
          </div>
    </div>
  );
}

    const pageComponents = {
      dashboard: <Dashboard onNavigate={handleNavigate} />,
      pos: <POS />,
      products: <Products />,
      users: <Users />,
      inventory: <PageNotFound />,
      orders: <Orders />,
      customers: <Customers />,
      suppliers: <PageNotFound />,
      reports: <Reports onNavigate={handleNavigate} />,
      'business-overview': <BusinessOverview onBack={() => handleNavigate('reports')} />,
      'product-overview': <ProductOverview onBack={() => handleNavigate('reports')} />,
      settings: <Settings onNavigate={handleNavigate} />,
      'store-setup': <StoreSetup onNavigate={handleNavigate} />,
      'print-templates': <PrintTemplateManager onBack={() => handleNavigate('settings')} />,
      'qr-payment': <QRPaymentManager onBack={() => handleNavigate('settings')} />
    };

    const PageComponent = pageComponents[currentPage as keyof typeof pageComponents] || <PageNotFound />;
    
    return (
      <div className="animate-fade-in h-full">
        {PageComponent}
      </div>
    );
  };

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show main app layout
  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPageContent()}
    </Layout>
  );
};

// Root App with Error Boundary
const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppWithToast />
      </ToastProvider>
    </AuthProvider>
  );
};

const AppWithToast: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="App">
      <AppContent />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default App;
