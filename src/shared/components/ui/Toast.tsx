import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useAppStore } from '../../../store/appStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-[#00f5a0]" />;
      case 'error':
        return <AlertCircle size={20} className="text-[#ff4757]" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-[#ffa502]" />;
      case 'info':
        return <Info size={20} className="text-[#4cc9f0]" />;
      default:
        return null;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-[#00f5a0]';
      case 'error':
        return 'border-l-[#ff4757]';
      case 'warning':
        return 'border-l-[#ffa502]';
      case 'info':
        return 'border-l-[#4cc9f0]';
      default:
        return 'border-l-[#2a2a3a]';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3
            bg-[#1e1e2a] border border-[#2a2a3a] rounded-lg
            border-l-4 ${getBorderColor(toast.type)}
            shadow-lg animate-slide-up
            min-w-[300px] max-w-[400px]
          `}
        >
          {getIcon(toast.type)}
          <p className="flex-1 text-sm text-[#f0f0f5]">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-[#606070] hover:text-[#a0a0b0] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

