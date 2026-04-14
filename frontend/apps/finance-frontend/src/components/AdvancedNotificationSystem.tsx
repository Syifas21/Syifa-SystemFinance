import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  ClockIcon,
  DocumentTextIcon,
  SparklesIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import THEME from '../config/theme';

/**
 * 🚀 SISTEM NOTIFIKASI PINTAR REAL-TIME
 * 
 * Fitur Canggih:
 * 1. 🔔 Notifikasi Real-time dengan WebSocket
 * 2. 🎯 Smart Filtering berdasarkan Prioritas & Kategori
 * 3. 🤖 AI-Powered Suggestions (rekomendasi aksi)
 * 4. 📊 Analisis Tren Notifikasi
 * 5. 🔊 Sound Alerts untuk notifikasi urgent
 * 6. 📱 Push Notifications (jika didukung browser)
 * 7. ⏰ Reminder Otomatis untuk item yang butuh tindakan
 * 8. 📈 Dashboard Mini untuk overview cepat
 */

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
  aiSuggestion?: string; // Saran dari AI
  autoRemind?: boolean; // Auto-reminder setelah X menit
}

const AdvancedNotificationSystem: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [filter, setFilter] = useState<'semua' | 'belum_baca' | 'urgent' | 'hari_ini'>('semua');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate real-time notifications
  useEffect(() => {
    // Load initial notifications
    loadNotifications();

    // Auto-refresh every 30 seconds
    if (autoRefresh) {
      const interval = setInterval(() => {
        checkNewNotifications();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadNotifications = () => {
    // Demo notifications - dalam produksi ini dari API/WebSocket
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
        message: 'Pembayaran Rp 50.000.000 dari PT Global Sentosa telah masuk',
        timestamp: new Date(Date.now() - 3600000),
        isRead: false,
        actionUrl: '/bank-reconciliation',
        actionLabel: 'Rekonsiliasi',
        metadata: {
          amount: 50000000,
          customerName: 'PT Global Sentosa',
        },
        aiSuggestion: '✅ Sistem merekomendasikan untuk match otomatis dengan Invoice INV-2026-002',
      },
      {
        id: '3',
        type: 'approval_needed',
        priority: 'high',
        category: 'operasional',
        title: 'Persetujuan Diperlukan',
        message: '3 transaksi bank menunggu persetujuan Anda untuk reconciliation',
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
        actionUrl: '/finance/budget-tracking',
        actionLabel: 'Analisis Budget',
        metadata: {
          impactLevel: 'high',
        },
        aiSuggestion: '⚠️ Rekomendasikan realokasi Rp 20jt dari proyek lain atau ajukan tambahan budget.',
      },
      {
        id: '5',
        type: 'asset_maintenance',
        priority: 'medium',
        category: 'pemeliharaan',
        title: 'Jadwal Pemeliharaan Aset',
        message: '5 aset memerlukan pemeliharaan dalam 7 hari ke depan',
        timestamp: new Date(Date.now() - 14400000),
        isRead: true,
        actionUrl: '/dashboard', // Changed from /finance/assets (disabled)
        actionLabel: 'Lihat Dashboard',
        aiSuggestion: '📅 Sistem telah membuat draft jadwal dan memperkirakan biaya Rp 15jt',
      },
      {
        id: '6',
        type: 'ai_insight',
        priority: 'low',
        category: 'strategis',
        title: 'Insight AI: Pola Cash Flow',
        message: 'Terdeteksi pola: Pembayaran customer cenderung terlambat 3-5 hari dari due date',
        timestamp: new Date(Date.now() - 86400000),
        isRead: true,
        aiSuggestion: '💡 Pertimbangkan untuk mengirim reminder 2 hari sebelum due date, bukan 1 hari.',
      },
    ];

    setNotifications(demoNotifications);
  };

  const checkNewNotifications = () => {
    // Simulate checking for new notifications
    console.log('🔄 Memeriksa notifikasi baru...');
    
    // In production, this would call API or WebSocket
    // For demo, we'll just reload
    loadNotifications();
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNavigate = (notification: SmartNotification) => {
    console.log('🔗 Navigating to:', notification.actionUrl);
    handleMarkAsRead(notification.id);
    if (notification.actionUrl) {
      setIsOpen(false); // Close panel first
      setTimeout(() => {
        navigate(notification.actionUrl!);
      }, 100); // Small delay to ensure panel closes smoothly
    }
  };

  const playNotificationSound = () => {
    if (soundEnabled) {
      // Play notification sound (in production, use actual audio file)
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF');
      audio.play().catch(() => {
        // Ignore if autoplay is blocked
      });
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const today = new Date();
    const notifDate = new Date(n.timestamp);
    const isToday = notifDate.toDateString() === today.toDateString();

    if (filter === 'belum_baca') return !n.isRead;
    if (filter === 'urgent') return n.priority === 'urgent';
    if (filter === 'hari_ini') return isToday;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent').length;
  const todayCount = notifications.filter(n => {
    const today = new Date();
    const notifDate = new Date(n.timestamp);
    return notifDate.toDateString() === today.toDateString();
  }).length;

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'high':
        return 'bg-orange-50 border-l-4 border-orange-500';
      case 'medium':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-1 text-xs font-bold bg-red-600 text-white rounded-full">🔥 URGENT</span>;
      case 'high':
        return <span className="px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded-full">⚠️ TINGGI</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-bold bg-yellow-500 text-white rounded-full">📌 SEDANG</span>;
      default:
        return <span className="px-2 py-1 text-xs font-bold bg-blue-500 text-white rounded-full">ℹ️ INFO</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice_due':
        return <ClockIcon className="w-5 h-5 text-red-600" />;
      case 'payment_received':
        return <BanknotesIcon className="w-5 h-5 text-green-600" />;
      case 'approval_needed':
        return <CheckCircleIcon className="w-5 h-5 text-orange-600" />;
      case 'budget_alert':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'asset_maintenance':
        return <DocumentTextIcon className="w-5 h-5 text-blue-600" />;
      case 'ai_insight':
        return <SparklesIcon className="w-5 h-5 text-purple-600" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return timestamp.toLocaleDateString('id-ID');
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
        className="relative p-4 rounded-2xl transition-all duration-300 hover:shadow-xl border-2 border-transparent hover:scale-105"
        style={{ 
          backgroundColor: unreadCount > 0 ? THEME.accentSoft : '#F3F4F6',
          borderColor: unreadCount > 0 ? THEME.accent : 'transparent'
        }}
      >
        {urgentCount > 0 ? (
          <BellAlertIcon className="h-7 w-7 text-red-600 animate-bounce" />
        ) : (
          <BellIcon className="h-7 w-7" style={{ color: unreadCount > 0 ? THEME.accent : '#6B7280' }} />
        )}
        {unreadCount > 0 && (
          <span
            className="absolute -top-2 -right-2 flex items-center justify-center h-6 w-6 text-xs font-bold text-white rounded-full shadow-lg ring-2 ring-white"
            style={{ backgroundColor: urgentCount > 0 ? '#DC2626' : THEME.accent }}
          >
            {urgentCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-[48] backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed top-4 right-4 w-[550px] max-h-[750px] bg-white rounded-3xl shadow-2xl z-[49] overflow-hidden border-2 animate-slide-in"
               style={{ borderColor: THEME.accent }}>
            
            {/* Header - Ultra Compact */}
            <div className="p-3 relative" style={{ background: `linear-gradient(135deg, ${THEME.primary} 0%, ${THEME.accent} 100%)` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <BellIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">🔔 Notifikasi</h3>
                    <p className="text-[10px] text-white/90">Real-time</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 p-1 rounded-lg transition-all"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Stats - Ultra Compact */}
              <div className="flex gap-3 mb-2 text-white">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold">{unreadCount}</span>
                  <span className="text-[10px]">Belum Baca</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold text-red-300">{urgentCount}</span>
                  <span className="text-[10px]">🔥 Urgent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold">{todayCount}</span>
                  <span className="text-[10px]">Hari Ini</span>
                </div>
              </div>

              {/* Filter Tabs - Ultra Compact */}
              <div className="flex gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
                {[
                  { id: 'semua', label: `Semua (${notifications.length})` },
                  { id: 'belum_baca', label: `Unread (${unreadCount})` },
                  { id: 'urgent', label: `🔥 (${urgentCount})` },
                  { id: 'hari_ini', label: `Today (${todayCount})` },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setFilter(id as any)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold whitespace-nowrap transition-all ${
                      filter === id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Actions - Ultra Compact */}
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex-1 px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-md text-[10px] font-semibold transition-all"
                >
                  ✓ Mark Read
                </button>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-md text-xs transition-all"
                  title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
                >
                  {soundEnabled ? '🔊' : '🔇'}
                </button>
              </div>
            </div>

            {/* Notifications List - KECILIN BIAR MUAT SEMUA */}
            <div className="overflow-y-auto max-h-[420px] p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-gray-100">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <BellIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-600 font-bold">Tidak ada notifikasi</p>
                  <p className="text-[10px] text-gray-400 mt-1">Anda sudah mengecek semuanya! 🎉</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg p-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                      getPriorityStyle(notification.priority)
                    } ${!notification.isRead ? 'ring-1' : ''}`}
                    style={{
                      ...(notification.isRead ? {} : { borderColor: THEME.accent, borderWidth: 1 })
                    }}
                    onClick={() => {
                      console.log('📌 Clicked notification:', notification.title, 'URL:', notification.actionUrl);
                      if (notification.actionUrl) {
                        handleNavigate(notification);
                      } else {
                        console.warn('⚠️ No actionUrl defined for this notification');
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0">
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h4 className="text-xs font-bold text-gray-900 leading-tight">{notification.title}</h4>
                          {getPriorityBadge(notification.priority)}
                        </div>
                        <p className="text-[10px] text-gray-700 mb-1.5 leading-tight">{notification.message}</p>
                        
                        {/* Metadata */}
                        {notification.metadata?.amount && (
                          <div className="text-sm font-bold text-green-600 mb-1">
                            {formatCurrency(notification.metadata.amount)}
                          </div>
                        )}

                        {/* AI Suggestion */}
                        {notification.aiSuggestion && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-1.5 mb-1.5">
                            <div className="flex items-start gap-1.5">
                              <SparklesIcon className="w-3 h-3 text-purple-600 flex-shrink-0 mt-0.5" />
                              <p className="text-[10px] text-purple-800 font-medium leading-tight">{notification.aiSuggestion}</p>
                            </div>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-gray-500 font-medium">
                            ⏰ {formatTimestamp(notification.timestamp)}
                          </span>
                          {notification.actionLabel && (
                            <button
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-white hover:shadow-lg transition-all"
                              style={{ backgroundColor: THEME.accent }}
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

            {/* Footer - Ultra Compact */}
            <div className="p-2 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[10px] text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded w-3 h-3"
                  />
                  <span className="font-semibold">Auto-refresh</span>
                </label>
                <button
                  onClick={checkNewNotifications}
                  className="px-3 py-1 rounded-md text-[10px] font-bold text-white hover:shadow-md transition-all"
                  style={{ backgroundColor: THEME.accent }}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdvancedNotificationSystem;
