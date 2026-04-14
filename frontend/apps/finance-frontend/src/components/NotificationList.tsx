import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ClockIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface SmartNotification {
  id: string;
  type: 'invoice_due' | 'payment_received' | 'approval_needed' | 'budget_alert' | 'reconciliation' | 'asset_maintenance' | 'ai_insight';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'keuangan' | 'operasional' | 'strategis' | 'pemeliharaan';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    amount?: number;
    customerName?: string;
    dueDate?: string;
    impactLevel?: 'low' | 'medium' | 'high';
  };
  aiSuggestion?: string;
  autoRemind?: boolean;
}

const NotificationList: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [filter, setFilter] = useState<'semua' | 'belum_baca' | 'urgent' | 'hari_ini'>('semua');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const demoNotifications: SmartNotification[] = [
      {
        id: '1',
        type: 'invoice_due',
        priority: 'urgent',
        category: 'keuangan',
        title: 'Invoice Jatuh Tempo Hari Ini',
        message: 'Invoice INV-2026-001 dari PT Maju Jaya senilai Rp 75.000.000 jatuh tempo hari ini',
        timestamp: new Date(),
        isRead: false,
        actionUrl: '/invoices',
        actionLabel: 'Lihat Invoice',
        metadata: {
          amount: 75000000,
          customerName: 'PT Maju Jaya',
          dueDate: new Date().toISOString(),
          impactLevel: 'high',
        },
        aiSuggestion: '💡 Kirim reminder otomatis ke customer dan siapkan draft surat teguran jika perlu.',
        autoRemind: true,
      },
      {
        id: '2',
        type: 'payment_received',
        priority: 'medium',
        category: 'keuangan',
        title: 'Pembayaran Diterima',
        message: 'PT Sukses Makmur telah melakukan pembayaran sebesar Rp 45.000.000 untuk Invoice INV-2026-002',
        timestamp: new Date(Date.now() - 3600000),
        isRead: false,
        actionUrl: '/bank-reconciliation',
        actionLabel: 'Rekonsiliasi',
      },
      {
        id: '3',
        type: 'reconciliation',
        priority: 'high',
        category: 'operasional',
        title: 'Pending Rekonsiliasi Bank',
        message: '5 transaksi perlu dicocokkan dengan rekening bank. Total nilai: Rp 125.000.000',
        timestamp: new Date(Date.now() - 7200000),
        isRead: false,
        actionUrl: '/bank-reconciliation',
        actionLabel: 'Setujui Sekarang',
        aiSuggestion: '🤖 2 transaksi memiliki confidence score 95%+ dan aman untuk di-approve.',
      },
      {
        id: '4',
        type: 'budget_alert',
        priority: 'urgent',
        category: 'strategis',
        title: 'Budget Proyek Kritis',
        message: 'Proyek "Digital Transformation" telah menggunakan 95% budget (Rp 285jt dari Rp 300jt)',
        timestamp: new Date(Date.now() - 10800000),
        isRead: false,
        actionUrl: '/budget-vs-actual',
        actionLabel: 'Analisis Budget',
        metadata: {
          impactLevel: 'high',
        },
        aiSuggestion: '⚠️ Rekomendasi: Freeze pengeluaran non-kritis dan review scope proyek.',
      },
    ];

    setNotifications(demoNotifications);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'belum_baca') return !n.isRead;
    if (filter === 'urgent') return n.priority === 'urgent';
    if (filter === 'hari_ini') {
      const today = new Date().toDateString();
      return n.timestamp.toDateString() === today;
    }
    return true;
  });

  const handleNavigate = (notification: SmartNotification) => {
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    markAsRead(notification.id);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const formatTimestamp = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return date.toLocaleDateString('id-ID');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'high':
        return <ClockIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-blue-100 text-blue-700',
      low: 'bg-gray-100 text-gray-700',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
        {(['semua', 'belum_baca', 'urgent', 'hari_ini'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === f
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'semua' && '📋 Semua'}
            {f === 'belum_baca' && '🔔 Belum Baca'}
            {f === 'urgent' && '⚠️ Urgent'}
            {f === 'hari_ini' && '📅 Hari Ini'}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p className="font-bold text-base">Tidak ada notifikasi</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNavigate(notification)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                notification.isRead
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getPriorityIcon(notification.priority)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-bold text-sm text-gray-800 line-clamp-1">
                      {notification.title}
                    </h4>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase whitespace-nowrap ml-2 ${getPriorityBadge(
                        notification.priority
                      )}`}
                    >
                      {notification.priority}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 mb-2 line-clamp-2">
                    {notification.message}
                  </p>

                  {notification.metadata?.amount && (
                    <div className="mb-2 py-1.5 px-2 bg-green-50 border border-green-200 rounded-lg inline-flex items-center gap-1.5">
                      <BanknotesIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-bold text-green-700">
                        {formatCurrency(notification.metadata.amount)}
                      </span>
                    </div>
                  )}

                  {notification.aiSuggestion && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-2">
                      <div className="flex items-start gap-2">
                        <SparklesIcon className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-purple-800 font-medium">
                          {notification.aiSuggestion}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-500 font-medium">
                      ⏰ {formatTimestamp(notification.timestamp)}
                    </span>
                    {notification.actionLabel && (
                      <button
                        className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-all hover:shadow-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(notification);
                        }}
                      >
                        {notification.actionLabel} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationList;
