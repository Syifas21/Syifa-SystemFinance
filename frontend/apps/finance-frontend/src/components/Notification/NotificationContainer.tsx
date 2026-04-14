import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { designSystem } from '../../styles/designSystem';
import { Notification, useNotification } from '../../contexts/NotificationContext';

const NotificationToast: React.FC<{
  notification: Notification;
}> = ({ notification }) => {
  const { removeNotification } = useNotification();

  const colorMap: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    success: {
      bg: `${designSystem.colors.success.DEFAULT}10`,
      border: designSystem.colors.success.DEFAULT,
      text: designSystem.colors.success.DEFAULT,
      icon: <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem' }} />,
    },
    error: {
      bg: `${designSystem.colors.error.DEFAULT}10`,
      border: designSystem.colors.error.DEFAULT,
      text: designSystem.colors.error.DEFAULT,
      icon: <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem' }} />,
    },
    warning: {
      bg: `${designSystem.colors.warning.DEFAULT}10`,
      border: designSystem.colors.warning.DEFAULT,
      text: designSystem.colors.warning.DEFAULT,
      icon: <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem' }} />,
    },
    info: {
      bg: `${designSystem.colors.info.DEFAULT}10`,
      border: designSystem.colors.info.DEFAULT,
      text: designSystem.colors.info.DEFAULT,
      icon: <InformationCircleIcon style={{ width: '1.5rem', height: '1.5rem' }} />,
    },
  };

  const color = colorMap[notification.type];

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '1rem',
        backgroundColor: color.bg,
        border: `2px solid ${color.border}`,
        borderRadius: designSystem.borderRadius.lg,
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
        animation: 'slideInRight 300ms ease-out',
      }}
    >
      <div style={{ color: color.text, flexShrink: 0 }}>
        {color.icon}
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            marginBottom: '0.25rem',
            fontSize: designSystem.typography.fontSize.sm,
            fontWeight: designSystem.typography.fontWeight.bold,
            color: designSystem.colors.text.primary,
          }}
        >
          {notification.title}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: designSystem.typography.fontSize.xs,
            color: designSystem.colors.text.secondary,
          }}
        >
          {notification.message}
        </p>
      </div>
      <button
        onClick={() => removeNotification(notification.id)}
        style={{
          background: 'none',
          border: 'none',
          padding: '0',
          cursor: 'pointer',
          color: color.text,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <XMarkIcon style={{ width: '1.25rem', height: '1.25rem' }} />
      </button>
    </div>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotification();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '400px',
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
      {notifications.map((notification) => (
        <NotificationToast key={notification.id} notification={notification} />
      ))}
    </div>
  );
};
