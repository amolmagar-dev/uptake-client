import React from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useAppStore } from "../../../store/appStore";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  const getAlertClass = (type: string) => {
    switch (type) {
      case "success":
        return "alert-success";
      case "error":
        return "alert-error";
      case "warning":
        return "alert-warning";
      case "info":
        return "alert-info";
      default:
        return "alert-neutral";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} />;
      case "error":
        return <AlertCircle size={20} />;
      case "warning":
        return <AlertTriangle size={20} />;
      case "info":
        return <Info size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className="toast toast-end toast-bottom z-9999">
      {toasts.map((toast) => (
        <div key={toast.id} className={`alert shadow-lg ${getAlertClass(toast.type)} animate-slide-up`}>
          {getIcon(toast.type)}
          <span className="flex-1 text-sm">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="btn btn-ghost btn-xs btn-circle">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
