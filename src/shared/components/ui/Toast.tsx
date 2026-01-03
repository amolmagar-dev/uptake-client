import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useAppStore } from '../../../store/appStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-status-success" />;
      case 'error':
        return <AlertCircle size={20} className="text-status-error" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-status-warning" />;
      case 'info':
        return <Info size={20} className="text-accent-info" />;
      default:
        return null;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-status-success';
      case 'error':
        return 'border-l-status-error';
      case 'warning':
        return 'border-l-status-warning';
      case 'info':
        return 'border-l-accent-info';
      default:
        return 'border-l-border';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3
            bg-bg-elevated border border-border rounded-lg
            border-l-4 ${getBorderColor(toast.type)}
            shadow-lg animate-slide-up
            min-w-[300px] max-w-[400px]
          `}
        >
          {getIcon(toast.type)}
          <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-text-muted hover:text-text-secondary transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

