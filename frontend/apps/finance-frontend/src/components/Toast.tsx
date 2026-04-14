import React, { useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-success/10 border-success',
    error: 'bg-danger/10 border-danger',
    warning: 'bg-warning/10 border-warning',
    info: 'bg-primary-light/10 border-primary-light',
  }[type];

  const textColor = {
    success: 'text-success',
    error: 'text-danger',
    warning: 'text-warning',
    info: 'text-primary-dark',
  }[type];

  const Icon = type === 'success' ? CheckCircleIcon : ExclamationCircleIcon;

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 ${bgColor} border-l-4 p-4 rounded-lg shadow-lg animate-slide-in max-w-md`}>
      <Icon className={`h-6 w-6 ${textColor}`} />
      <p className={`${textColor} flex-1`}>{message}</p>
      <button
        onClick={onClose}
        className={`${textColor} hover:opacity-70 transition-opacity`}
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Toast;
