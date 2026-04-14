import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface CashFlowData {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface ProfitabilityData {
  period: string;
  revenue: number;
  expenses: number;
  net_income: number;
}

interface ARAPSummary {
  total_receivable: number;
  total_payable: number;
  net_position: number;
  overdue_receivable: number;
  overdue_payable: number;
}

interface QuickStat {
  label: string;
  value: number;
  change_percentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface DashboardData {
  cash_flow: CashFlowData[];
  profitability: ProfitabilityData[];
  ar_ap_summary: ARAPSummary;
  quick_stats: QuickStat[];
}

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

const FinanceDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCompact = (amount: number) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}M`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}Jt`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toFixed(0);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/dashboards/finance?period=${period}`);
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#C8A870] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat Dashboard Keuangan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header Banner - Solid Blue */}
      <div className="rounded-2xl shadow-lg p-8 relative overflow-hidden" style={{ 
        backgroundColor: '#3B82F6',
      }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white" style={{ fontFamily: 'inherit' }}>Dashboard Keuangan</h1>
            <p className="text-white/90 text-base" style={{ fontFamily: 'inherit' }}>
              Dasbor Perusahaan - Real-time Financial Intelligence
            </p>
            <p className="text-xs text-white/70 mt-1" style={{ fontFamily: 'inherit' }}>TSD FITUR 3.4.G - Analytics Dashboard</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setPeriod('month')}
              className="px-4 py-2 rounded-lg font-semibold transition shadow-sm"
              style={{
                backgroundColor: period === 'month' ? 'white' : 'rgba(255,255,255,0.2)',
                color: period === 'month' ? '#3B82F6' : 'white',
                fontFamily: 'inherit'
              }}
            >
              6 Bulan
            </button>
            <button
              onClick={() => setPeriod('quarter')}
              className="px-4 py-2 rounded-lg font-semibold transition shadow-sm"
              style={{
                backgroundColor: period === 'quarter' ? 'white' : 'rgba(255,255,255,0.2)',
                color: period === 'quarter' ? '#3B82F6' : 'white',
                fontFamily: 'inherit'
              }}
            >
              4 Kuartal
            </button>
            <button
              onClick={() => setPeriod('year')}
              className="px-4 py-2 rounded-lg font-semibold transition shadow-sm"
              style={{
                backgroundColor: period === 'year' ? 'white' : 'rgba(255,255,255,0.2)',
                color: period === 'year' ? '#3B82F6' : 'white',
                fontFamily: 'inherit'
              }}
            >
              3 Tahun
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Key Metrics Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardData.quick_stats && dashboardData.quick_stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 overflow-hidden"
              style={{ fontFamily: 'inherit' }}
            >
              {/* Color Top Border */}
              <div 
                className="h-1.5"
                style={{ 
                  backgroundColor: index === 0 ? '#3B82F6' : index === 1 ? '#10B981' : index === 2 ? '#F59E0B' : '#EF4444'
                }}
              />
              
              {/* Card Content */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs text-gray-600 font-bold uppercase tracking-wider" style={{ fontFamily: 'inherit' }}>
                    {stat.label}
                  </p>
                  {stat.trend === 'up' && (
                    <ArrowTrendingUpIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                  {stat.trend === 'down' && (
                    <ArrowTrendingDownIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-lg font-bold text-gray-900 mb-3 leading-tight" style={{ fontFamily: 'inherit' }}>
                  {formatCurrency(stat.value)}
                </p>
                
                {stat.change_percentage !== undefined && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      className="text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center"
                      style={{ 
                        backgroundColor: stat.change_percentage >= 0 ? '#D1FAE5' : '#FEE2E2',
                        color: stat.change_percentage >= 0 ? '#059669' : '#DC2626',
                        fontFamily: 'inherit'
                      }}
                    >
                      {stat.change_percentage > 0 ? '+' : ''}
                      {stat.change_percentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap" style={{ fontFamily: 'inherit' }}>vs bulan lalu</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* AR/AP Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all border-2 border-gray-200 overflow-hidden" style={{ fontFamily: 'inherit' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-emerald-100 p-3 rounded-lg flex-shrink-0">
                <BanknotesIcon className="w-6 h-6 text-emerald-600" />
              </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 font-medium" style={{ fontFamily: 'inherit' }}>Total Piutang (AR)</p>
                  <p className="text-xl font-bold text-emerald-600 break-words" style={{ fontFamily: 'inherit' }}>
                    {formatCurrency(dashboardData.ar_ap_summary.total_receivable)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500" style={{ fontFamily: 'inherit' }}>
                Overdue: {formatCurrency(dashboardData.ar_ap_summary.overdue_receivable)}
              </div>
            </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all border-2 border-gray-200 overflow-hidden" style={{ fontFamily: 'inherit' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-rose-100 p-3 rounded-lg flex-shrink-0">
                <DocumentTextIcon className="w-6 h-6 text-rose-600" />
              </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 font-medium" style={{ fontFamily: 'inherit' }}>Total Utang (AP)</p>
                  <p className="text-xl font-bold text-rose-600 break-words" style={{ fontFamily: 'inherit' }}>
                    {formatCurrency(dashboardData.ar_ap_summary.total_payable)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500" style={{ fontFamily: 'inherit' }}>
                Overdue: {formatCurrency(dashboardData.ar_ap_summary.overdue_payable)}
              </div>
            </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all border-2 border-gray-200 overflow-hidden" style={{ fontFamily: 'inherit' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 font-medium" style={{ fontFamily: 'inherit' }}>Net Position</p>
                  <p
                    className="text-xl font-bold break-words"
                    style={{
                      color: dashboardData.ar_ap_summary.net_position >= 0 ? '#10B981' : '#EF4444',
                      fontFamily: 'inherit'
                    }}
                  >
                    {formatCurrency(dashboardData.ar_ap_summary.net_position)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500" style={{ fontFamily: 'inherit' }}>AR - AP</div>
            </div>
        </div>

        {/* Cash Flow Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2" style={{ fontFamily: 'inherit' }}>
              <CurrencyDollarIcon className="w-7 h-7 text-blue-600" />
              Arus Kas (Cash Flow)
            </h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Inflow</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Outflow</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Net</span>
            </div>
          </div>
          {dashboardData.cash_flow && dashboardData.cash_flow.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dashboardData.cash_flow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#D1D5DB' }}
                />
                <YAxis 
                  tickFormatter={(value) => formatCompact(value)} 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#D1D5DB' }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#1F2937' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="square"
                />
                <Bar dataKey="inflow" name="Masuk (Inflow)" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="outflow" name="Keluar (Outflow)" fill="#ef4444" radius={[8, 8, 0, 0]} />
                <Bar dataKey="net" name="Net Cash Flow" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-gray-500">
              <div className="text-center">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="font-medium">Belum ada data cash flow</p>
                <p className="text-sm">Transaksi akan muncul di sini</p>
              </div>
            </div>
          )}
        </div>

        {/* Profitability Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2" style={{ fontFamily: 'inherit' }}>
              <ChartBarIcon className="w-7 h-7 text-purple-600" />
              Profitabilitas (Revenue vs Expenses)
            </h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Revenue</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">Expenses</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Profit</span>
            </div>
          </div>
          {dashboardData.profitability && dashboardData.profitability.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={dashboardData.profitability}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#D1D5DB' }}
                />
                <YAxis 
                  tickFormatter={(value) => formatCompact(value)} 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#D1D5DB' }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#1F2937' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="square"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Pendapatan"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Beban"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fill="url(#colorExpenses)"
                />
                <Area
                  type="monotone"
                  dataKey="net_income"
                  name="Laba Bersih"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-gray-500">
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="font-medium">Belum ada data profitabilitas</p>
                <p className="text-sm">Transaksi revenue & expense akan muncul di sini</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
