import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

interface Notification {
  id: string;
  type: 'approval_required' | 'approved' | 'rejected' | 'escalated' | 'comment' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  from: {
    name: string;
    role: string;
    avatar?: string;
  };
  timestamp: string;
  actionUrl?: string;
  actionType?: 'approve' | 'review' | 'respond';
  metadata?: {
    amount?: number;
    impactScore?: number;
    urgency?: string;
    relatedItems?: string[];
  };
  isRead: boolean;
  quickActions?: {
    label: string;
    action: 'approve' | 'reject' | 'delegate' | 'respond';
    variant: 'success' | 'danger' | 'warning' | 'primary';
  }[];
}

const SmartNotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, markAsRead } = useNotificationStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  // Filter notifications based on user role
  const userNotifications = notifications.filter((n) => {
    if (!n.recipientRole || n.recipientRole === 'ALL') return true;
    return n.recipientRole === user?.role;
  });

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;
  const urgentCount = userNotifications.filter((n) => n.priority === 'urgent').length;

  const filteredNotifications = userNotifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'urgent') return n.priority === 'urgent';
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleQuickAction = (notificationId: string, action: string) => {
    console.log(`Quick action: ${action} on notification ${notificationId}`);
    handleMarkAsRead(notificationId);
    
    // Simulate API call
    setTimeout(() => {
      alert(`Action "${action}" executed successfully!`);
    }, 500);
  };

  const handleNavigate = (notification: any) => {
    handleMarkAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'approval_required': return <CheckCircleIcon className="h-5 w-5 text-orange-600" />;
      case 'escalated': return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'approved': return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'rejected': return <XMarkIcon className="h-5 w-5 text-red-600" />;
      case 'comment': return <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600" />;
      case 'alert': return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      default: return <BellIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-600 rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed top-16 right-4 w-[480px] max-h-[600px] bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <BellIcon className="h-6 w-6" />
                  <h3 className="text-lg font-bold">Smart Notifications</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-white text-blue-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-white text-blue-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('urgent')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'urgent'
                      ? 'bg-white text-blue-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  🔥 Urgent ({urgentCount})
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[480px]">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No notifications</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleNavigate(notification)}
                    >
                      {/* Notification Header */}
                      <div className="flex items-start space-x-3 mb-2">
                        <div className="flex-shrink-0 mt-1">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-gray-900 truncate">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 h-2 w-2 bg-blue-600 rounded-full ml-2" />
                            )}
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                            {notification.message}
                          </p>

                          {/* Metadata */}
                          {notification.metadata && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {notification.metadata.amount && (
                                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                  <BanknotesIcon className="h-3 w-3 mr-1" />
                                  {formatCurrency(notification.metadata.amount)}
                                </span>
                              )}
                              {notification.metadata.impactScore && (
                                <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                                  <ChartBarIcon className="h-3 w-3 mr-1" />
                                  Impact: {notification.metadata.impactScore}/10
                                </span>
                              )}
                              {notification.metadata.urgency && (
                                <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">
                                  <ClockIcon className="h-3 w-3 mr-1" />
                                  {notification.metadata.urgency}
                                </span>
                              )}
                            </div>
                          )}

                          {/* From & Time */}
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <div className="flex items-center space-x-1">
                              <UserCircleIcon className="h-4 w-4" />
                              <span className="font-medium">{notification.from.name}</span>
                              <span>•</span>
                              <span>{notification.from.role}</span>
                            </div>
                            <span>{notification.timestamp}</span>
                          </div>

                          {/* Quick Actions */}
                          {notification.quickActions && notification.quickActions.length > 0 && (
                            <div className="flex space-x-2">
                              {notification.quickActions.map((action, idx) => (
                                <button
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickAction(notification.id, action.action);
                                  }}
                                  className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                                    action.variant === 'success'
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : action.variant === 'danger'
                                      ? 'bg-red-600 text-white hover:bg-red-700'
                                      : action.variant === 'warning'
                                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                View All Notifications →
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SmartNotificationCenter;
