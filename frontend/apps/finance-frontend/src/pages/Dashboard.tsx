import React, { useEffect, useState } from 'react';
import THEME from '../config/theme';
import {
  BanknotesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface DashboardStats {
  total_accounts: number;
  total_balance: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  accounts_receivable: number;
  accounts_payable: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboards/finance?period=month');
      if (response.ok) {
        const result = await response.json();
        setStats(result.data.summary);
        console.log('✅ Dashboard data loaded:', result.data.summary);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const dashboardCards = [
    {
      name: 'Total Akun',
      value: loading ? '...' : stats?.total_accounts?.toString() || '0',
      description: 'Bagan Akun',
      icon: DocumentTextIcon,
      iconBg: THEME.accentSoft,
      iconColor: THEME.accent,
    },
    {
      name: 'Total Saldo',
      value: loading ? '...' : formatCurrency(stats?.total_balance || 0),
      description: 'Saldo Keseluruhan',
      icon: BanknotesIcon,
      iconBg: THEME.accentSoft,
      iconColor: THEME.primary,
    },
    {
      name: 'Pendapatan',
      value: loading ? '...' : formatCurrency(stats?.total_revenue || 0),
      description: 'Total Revenue',
      icon: ArrowUpIcon,
      iconBg: '#ECFDF5',
      iconColor: '#10B981',
    },
    {
      name: 'Beban',
      value: loading ? '...' : formatCurrency(stats?.total_expenses || 0),
      description: 'Total Expenses',
      icon: ArrowDownIcon,
      iconBg: '#FEF2F2',
      iconColor: '#EF4444',
    },
  ];

  const quickLinks = [
    {
      title: 'Bagan Akun',
      description: 'Kelola akun keuangan dan buku besar Anda',
      path: '/coa',
      icon: DocumentTextIcon,
      iconBg: THEME.accentSoft,
      iconColor: THEME.accent,
    },
    {
      title: 'Kokpit Finansial',
      description: 'Lihat dashboard dan analitik keuangan',
      path: '/financial-cockpit',
      icon: ChartBarIcon,
      iconBg: THEME.accentSoft,
      iconColor: THEME.primary,
    },
    {
      title: 'Invoice & Piutang',
      description: 'Kelola invoice dan accounts receivable',
      path: '/invoices',
      icon: CurrencyDollarIcon,
      iconBg: '#ECFDF5',
      iconColor: '#10B981',
    },
    {
      title: 'Laporan Keuangan',
      description: 'Akses berbagai laporan keuangan',
      path: '/reports',
      icon: ArrowTrendingUpIcon,
      iconBg: THEME.accentSoft,
      iconColor: THEME.accent,
    },
  ];

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Welcome Section - Gradient Blue Header v2 */}
      <div className="mb-8">
        <div className="rounded-2xl shadow-lg p-8 relative overflow-hidden" style={{ 
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        }}>
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <BanknotesIcon className="w-10 h-10" style={{ color: 'white' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: 'white', fontFamily: 'inherit' }}>
                Dashboard Keuangan
              </h1>
              <p className="text-white/90" style={{ fontFamily: 'inherit' }}>
                Dasbor Perusahaan - Real-time Financial Intelligence
              </p>
              <p className="text-white/70 text-sm" style={{ fontFamily: 'inherit' }}>
                TSD FITUR 3.4.G - Analytics Dashboard
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 border-2"
            style={{ borderColor: index === 0 ? THEME.accent : THEME.cardBorder, fontFamily: 'inherit' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ 
                background: `linear-gradient(135deg, ${card.iconBg} 0%, ${card.iconBg}dd 100%)` 
              }}>
                <card.icon className="h-7 w-7" style={{ color: card.iconColor }} />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: THEME.textPrimary, fontFamily: 'inherit' }}>
              {card.value}
            </h3>
            <p className="text-sm font-semibold" style={{ color: THEME.textMuted, fontFamily: 'inherit' }}>
              {card.description}
            </p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF', fontFamily: 'inherit' }}>
              {card.name}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-6 flex items-center" style={{ color: THEME.textPrimary, fontFamily: 'inherit' }}>
          <span className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: THEME.accent }}></span>
          Akses Cepat
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              to={link.path}
              className="group bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300"
              style={{ border: `1px solid ${THEME.cardBorder}`, fontFamily: 'inherit' }}
            >
              <div className="flex flex-col items-center text-center">
                <div 
                  className="w-14 h-14 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: link.iconBg }}
                >
                  <link.icon className="h-7 w-7" style={{ color: link.iconColor }} />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: THEME.textPrimary, fontFamily: 'inherit' }}>
                  {link.title}
                </h3>
                <p className="text-sm" style={{ color: THEME.textMuted, fontFamily: 'inherit' }}>
                  {link.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6" style={{ border: `1px solid ${THEME.cardBorder}`, fontFamily: 'inherit' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: THEME.textMuted, fontFamily: 'inherit' }}>
                Laba/Rugi Bersih
              </h3>
              <ArrowTrendingUpIcon className="h-5 w-5" style={{ color: stats.net_profit >= 0 ? '#10B981' : '#EF4444' }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: stats.net_profit >= 0 ? '#10B981' : '#EF4444', fontFamily: 'inherit' }}>
              {formatCurrency(stats.net_profit || 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6" style={{ border: `1px solid ${THEME.cardBorder}`, fontFamily: 'inherit' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: THEME.textMuted, fontFamily: 'inherit' }}>
                Piutang Usaha
              </h3>
              <CurrencyDollarIcon className="h-5 w-5" style={{ color: THEME.accent }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: THEME.textPrimary, fontFamily: 'inherit' }}>
              {formatCurrency(stats.accounts_receivable || 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6" style={{ border: `1px solid ${THEME.cardBorder}`, fontFamily: 'inherit' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium" style={{ color: THEME.textMuted, fontFamily: 'inherit' }}>
                Utang Usaha
              </h3>
              <CurrencyDollarIcon className="h-5 w-5" style={{ color: '#EF4444' }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: THEME.textPrimary, fontFamily: 'inherit' }}>
              {formatCurrency(stats.accounts_payable || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6" style={{ border: `1px solid ${THEME.cardBorder}`, fontFamily: 'inherit' }}>
        <h2 className="text-xl font-bold mb-6 flex items-center" style={{ color: THEME.textPrimary, fontFamily: 'inherit' }}>
          <span className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: THEME.accent }}></span>
          Aktivitas Terkini
        </h2>
        <div className="space-y-3">
          {[
            { action: 'Bagan Akun diperbarui', time: '2 jam lalu', icon: DocumentTextIcon, iconBg: THEME.accentSoft, iconColor: THEME.accent },
            { action: 'Entri jurnal baru dibuat', time: '5 jam lalu', icon: BanknotesIcon, iconBg: '#ECFDF5', iconColor: '#10B981' },
            { action: 'Laporan keuangan dibuat', time: '1 hari lalu', icon: ChartBarIcon, iconBg: THEME.accentSoft, iconColor: THEME.primary },
          ].map((item, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-4 p-4 rounded-lg hover:shadow-sm transition-all" 
              style={{ backgroundColor: THEME.pageBg, fontFamily: 'inherit' }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.iconBg }}>
                <item.icon className="h-5 w-5" style={{ color: item.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: THEME.textPrimary, fontFamily: 'inherit' }}>
                  {item.action}
                </p>
                <p className="text-xs" style={{ color: THEME.textMuted, fontFamily: 'inherit' }}>
                  {item.time}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME.accent }}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
