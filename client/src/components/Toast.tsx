import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  onRemove 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show animation
    setTimeout(() => setIsVisible(true), 100);
    
    // Auto remove
    const timer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(id), 300);
  };

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: Check,
          iconBg: 'bg-green-100 text-green-600'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: AlertCircle,
          iconBg: 'bg-red-100 text-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: AlertTriangle,
          iconBg: 'bg-yellow-100 text-yellow-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: Info,
          iconBg: 'bg-blue-100 text-blue-600'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-800',
          icon: Info,
          iconBg: 'bg-gray-100 text-gray-600'
        };
    }
  };

  const styles = getToastStyles();
  const IconComponent = styles.icon;

  return (
    <div
      className={`
        ${styles.bg} border rounded-xl shadow-lg p-4 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isExiting ? 'translate-x-full opacity-0' : ''}
      `}
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${styles.iconBg} flex items-center justify-center mr-3`}>
          <IconComponent className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles.text}`}>
            {title}
          </p>
          {message && (
            <p className={`text-sm mt-1 ${styles.text} opacity-90`}>
              {message}
            </p>
          )}
        </div>
        
        <button
          onClick={handleRemove}
          className={`flex-shrink-0 ml-3 p-1 rounded-lg hover:bg-black hover:bg-opacity-10 transition-colors ${styles.text}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-3 w-full h-1 bg-black bg-opacity-10 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ease-linear ${
            type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`}
          style={{
            animation: `shrink ${duration}ms linear forwards`
          }}
        />
      </div>
      
      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastProps[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onRemove'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id, onRemove: removeToast }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showSuccess = (title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  };

  const showError = (title: string, message?: string) => {
    addToast({ type: 'error', title, message });
  };

  const showWarning = (title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  };

  const showInfo = (title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  };

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default Toast; 