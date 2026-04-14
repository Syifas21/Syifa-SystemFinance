import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification {
  id: string;
  type: 'approval_required' | 'approved' | 'rejected' | 'escalated' | 'comment' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  from: {
    name: string;
    role: string;
  };
  timestamp: string;
  actionUrl?: string;
  metadata?: any;
  isRead: boolean;
  recipientRole?: 'CEO' | 'FINANCE_ADMIN' | 'ALL';
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  getUnreadCount: () => number;
}

// Broadcast Channel for cross-tab communication
const notificationChannel = typeof window !== 'undefined' 
  ? new BroadcastChannel('notifications')
  : null;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif_${Date.now()}_${Math.random()}`,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
        }));

        // Broadcast to other tabs
        if (notificationChannel) {
          notificationChannel.postMessage({
            type: 'NEW_NOTIFICATION',
            notification: newNotification,
          });
        }
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));

        // Broadcast to other tabs
        if (notificationChannel) {
          notificationChannel.postMessage({
            type: 'MARK_READ',
            notificationId: id,
          });
        }
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length;
      },
    }),
    {
      name: 'notification-storage',
    }
  )
);

// Listen to broadcast messages from other tabs
if (notificationChannel) {
  notificationChannel.onmessage = (event) => {
    const { type, notification, notificationId } = event.data;

    if (type === 'NEW_NOTIFICATION') {
      // Add notification without broadcasting (avoid loop)
      useNotificationStore.setState((state) => ({
        notifications: [notification, ...state.notifications].slice(0, 50),
      }));
    } else if (type === 'MARK_READ') {
      useNotificationStore.setState((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
      }));
    }
  };
}
