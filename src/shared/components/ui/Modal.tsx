import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = "md", showClose = true }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] max-h-[95vh]",
  };

  return (
    <dialog className="modal modal-open">
      <div
        className={`
          modal-box relative w-full ${sizes[size]} p-0
          bg-base-100 border border-base-300 rounded-xl shadow-2xl
          max-h-[90vh] flex flex-col
        `}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between p-5 border-b border-base-300">
            {title && <h2 className="text-xl font-semibold">{title}</h2>}
            {showClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto -mr-2">
                <X size={20} />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <button className="cursor-default">close</button>
      </div>
    </dialog>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  const iconColors = {
    danger: "bg-error/20 text-error",
    warning: "bg-warning/20 text-warning",
    info: "bg-info/20 text-info",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${iconColors[variant]}`}>
          {variant === "danger" && (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-base-content/70 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm} isLoading={isLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
