import React, { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface AccountBalance {
  account_id: number;
  account_code: string;
  account_name: string;
  balance: number;
}

interface IncomeStatementData {
  period: {
    start_date: string;
    end_date: string;
  };
  revenue: {
    accounts: AccountBalance[];
    total: number;
  };
  cost_of_service: {
    accounts: AccountBalance[];
    total: number;
  };
  gross_profit: number;
  gross_profit_margin: number;
  expenses: {
    accounts: AccountBalance[];
    total: number;
  };
  net_profit: number;
  net_profit_margin: number;
}

const IncomeStatementTab: React.FC = () => {
  const [incomeStatementData, setIncomeStatementData] = useState<IncomeStatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quickFilter, setQuickFilter] = useState<'this-month' | 'this-quarter' | 'this-year' | 'custom'>('this-month');
  const [showDetails, setShowDetails] = useState(true);

  useEffect(() => {
    // Set default to current month
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(monthStart.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchIncomeStatement();
    }
  }, [startDate, endDate]);

  const applyQuickFilter = (filter: typeof quickFilter) => {
    setQuickFilter(filter);
    const today = new Date();
    
    switch (filter) {
      case 'this-month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(monthStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'this-quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
        setStartDate(quarterStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'this-year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        setStartDate(yearStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'custom':
        // User will set dates manually
        break;
    }
  };

  const fetchIncomeStatement = async () => {
    setLoading(true);
    try {
      let url = '/api/reports/income-statement'; // Use Vite proxy
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      console.log('📡 Fetching Income Statement:', url);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Income Statement data from DB:', data);
        console.log('📊 Total Revenue:', data.revenue?.total);
        console.log('📊 Total Expenses:', data.expenses?.total);
        console.log('💰 Net Income:', data.net_income || data.net_profit);
        
        // Normalize data dan pastikan semua nilai numerik valid
        const normalizedData = {
          period: data.period || { start_date: startDate, end_date: endDate },
          revenue: {
            accounts: data.revenue?.accounts || [],
            total: Number(data.revenue?.total) || 0
          },
          cost_of_service: {
            accounts: data.cost_of_service?.accounts || [],
            total: Number(data.cost_of_service?.total) || 0
          },
          gross_profit: Number(data.gross_profit) || 0,
          gross_profit_margin: Number(data.gross_profit_margin) || 0,
          expenses: {
            accounts: data.expenses?.accounts || [],
            total: Number(data.expenses?.total) || 0
          },
          net_profit: Number(data.net_profit || data.net_income) || 0,
          net_profit_margin: Number(data.net_profit_margin) || 0,
        };
        
        setIncomeStatementData(normalizedData);
      } else {
        console.error('❌ Failed to fetch income statement:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching income statement:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    // Handle null, undefined, atau NaN
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(validAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPercent = (value: number | null | undefined) => {
    // Handle null, undefined, atau NaN
    const validValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    return `${validValue.toFixed(2)}%`;
  };

  const exportToCSV = () => {
    if (!incomeStatementData) return;

    const csv = [
      `LAPORAN LABA RUGI (INCOME STATEMENT)`,
      `Periode: ${formatDate(incomeStatementData.period.start_date)} s/d ${formatDate(incomeStatementData.period.end_date)}`,
      '',
      'PENDAPATAN (REVENUE)',
      'Kode,Nama Akun,Jumlah',
      ...incomeStatementData.revenue.accounts.map(acc => 
        `${acc.account_code},${acc.account_name},${acc.balance}`
      ),
      `TOTAL PENDAPATAN,,${incomeStatementData.revenue.total}`,
      '',
      'HARGA POKOK PENJUALAN (COST OF SERVICE)',
      'Kode,Nama Akun,Jumlah',
      ...incomeStatementData.cost_of_service.accounts.map(acc => 
        `${acc.account_code},${acc.account_name},${acc.balance}`
      ),
      `TOTAL HPP,,${incomeStatementData.cost_of_service.total}`,
      '',
      `LABA KOTOR (GROSS PROFIT),,${incomeStatementData.gross_profit}`,
      `MARGIN LABA KOTOR,,${incomeStatementData.gross_profit_margin}%`,
      '',
      'BEBAN OPERASIONAL (EXPENSES)',
      'Kode,Nama Akun,Jumlah',
      ...incomeStatementData.expenses.accounts.map(acc => 
        `${acc.account_code},${acc.account_name},${acc.balance}`
      ),
      `TOTAL BEBAN,,${incomeStatementData.expenses.total}`,
      '',
      `LABA BERSIH (NET PROFIT),,${incomeStatementData.net_profit}`,
      `MARGIN LABA BERSIH,,${incomeStatementData.net_profit_margin}%`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laba-rugi-${startDate}-${endDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl shadow-sm border border-rose-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-rose-900 mb-2">
              Laporan Laba Rugi (Income Statement)
            </h2>
            <p className="text-rose-700">
              Laporan Kinerja: Pendapatan - HPP - Beban = Laba Bersih (dihitung otomatis)
            </p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={!incomeStatementData}
            className="flex items-center gap-2 px-4 py-2 bg-white text-rose-700 rounded-lg border border-rose-300 hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Information Box - Penjelasan Angka */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-blue-900 mb-2">📊 Penjelasan Laba/Rugi</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Laporan Laba/Rugi</strong> hanya menampilkan akun <strong>Revenue (Pendapatan)</strong> dan <strong>Expense (Beban)</strong> dalam periode tertentu.</p>
              <p><strong>TIDAK termasuk</strong> Asset, Liability, atau Equity.</p>
              <p className="pt-2"><strong>Rumus:</strong> Laba Bersih = Total Pendapatan - Total HPP - Total Beban Operasional - Total Beban Lainnya</p>
              <p className="pt-2 font-semibold">✓ Laba Bersih akan masuk ke Retained Earnings di Neraca</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Period Filter */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="inline h-5 w-5 mr-1" />
              Periode
            </label>
            <div className="flex gap-2 mb-2">
              {(['this-month', 'this-quarter', 'this-year', 'custom'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => applyQuickFilter(filter)}
                  className={`px-3 py-1 text-sm rounded-lg transition-all ${
                    quickFilter === filter
                      ? 'bg-rose-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'this-month' && 'Bulan Ini'}
                  {filter === 'this-quarter' && 'Kuartal Ini'}
                  {filter === 'this-year' && 'Tahun Ini'}
                  {filter === 'custom' && 'Custom'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setQuickFilter('custom');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setQuickFilter('custom');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* View Toggle & Refresh */}
          <div className="space-y-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`w-full px-4 py-2 rounded-lg border transition-all ${
                showDetails
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <CurrencyDollarIcon className="inline h-5 w-5 mr-2" />
              {showDetails ? 'Detail per Akun' : 'Ringkasan Total'}
            </button>
            <button
              onClick={fetchIncomeStatement}
              disabled={loading || !startDate || !endDate}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Memuat...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && !incomeStatementData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mx-auto mb-4 border-green-500"></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Memuat Laporan Laba/Rugi...
          </h3>
          <p className="text-gray-500">
            Sedang mengambil data dari database
          </p>
        </div>
      )}

      {/* Empty/Error State */}
      {!loading && !incomeStatementData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Tidak Ada Data Laporan Laba/Rugi
          </h3>
          <p className="text-gray-500 mb-4">
            Belum ada transaksi revenue atau expense untuk periode yang dipilih. Silakan:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4">
            <li>✓ Buat Chart of Accounts dengan Revenue & Expense accounts</li>
            <li>✓ Post Journal Entries dengan transaksi penjualan atau pengeluaran</li>
            <li>✓ Pilih periode yang sesuai (Bulan/Kuartal/Tahun)</li>
          </ul>
          <button
            onClick={fetchIncomeStatement}
            className="px-6 py-2 text-white rounded-lg hover:bg-green-700 transition-all bg-green-600"
          >
            Coba Muat Ulang
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {incomeStatementData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg shadow-sm border border-teal-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-teal-600">Pendapatan</div>
              <ArrowTrendingUpIcon className="h-5 w-5 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-teal-700">
              {formatCurrency(incomeStatementData.revenue.total)}
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {incomeStatementData.revenue.accounts.length} akun
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg shadow-sm border border-orange-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-orange-600">HPP</div>
              <ArrowTrendingDownIcon className="h-5 w-5 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-700">
              {formatCurrency(incomeStatementData.cost_of_service.total)}
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {incomeStatementData.cost_of_service.accounts.length} akun
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg shadow-sm border border-indigo-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-indigo-600">Beban</div>
              <ArrowTrendingDownIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-indigo-700">
              {formatCurrency(incomeStatementData.expenses.total)}
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {incomeStatementData.expenses.accounts.length} akun
            </div>
          </div>
          <div className={`rounded-lg shadow-sm border-2 p-5 ${
            incomeStatementData.net_profit >= 0
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300'
              : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm font-semibold ${
                incomeStatementData.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {incomeStatementData.net_profit >= 0 ? '💰 Laba Bersih' : '📉 Rugi Bersih'}
              </div>
              {incomeStatementData.net_profit >= 0 ? (
                <ArrowTrendingUpIcon className="h-6 w-6 text-emerald-400" />
              ) : (
                <ArrowTrendingDownIcon className="h-6 w-6 text-rose-400" />
              )}
            </div>
            <div className={`text-2xl font-bold mb-1 ${
              incomeStatementData.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {formatCurrency(incomeStatementData.net_profit)}
            </div>
            <div className={`text-xs font-medium ${
              incomeStatementData.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              Margin: {formatPercent(incomeStatementData.net_profit_margin)}
            </div>
          </div>
        </div>
      )}

      {/* Income Statement Details */}
      {incomeStatementData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Laporan Laba Rugi - {formatDate(incomeStatementData.period.start_date)} s/d {formatDate(incomeStatementData.period.end_date)}
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {/* REVENUE */}
            <div>
              <div className="bg-emerald-50 px-4 py-2 rounded-t-lg border-l-4 border-emerald-600">
                <h4 className="font-bold text-emerald-900">PENDAPATAN (REVENUE)</h4>
              </div>
              {showDetails && (
                <table className="w-full">
                  <tbody>
                    {incomeStatementData.revenue.accounts.map((account, idx) => (
                      <tr key={account.account_id ?? account.account_code ?? idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-600">{account.account_code}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{account.account_name}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-emerald-700">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="bg-emerald-100 px-4 py-3 flex justify-between items-center font-bold">
                <span className="text-emerald-900">Total Pendapatan</span>
                <span className="text-xl text-emerald-900">
                  {formatCurrency(incomeStatementData.revenue.total)}
                </span>
              </div>
            </div>

            {/* COST OF SERVICE */}
            <div>
              <div className="bg-orange-50 px-4 py-2 rounded-t-lg border-l-4 border-orange-600">
                <h4 className="font-bold text-orange-900">HARGA POKOK PENJUALAN (COST OF SERVICE)</h4>
              </div>
              {showDetails && (
                <table className="w-full">
                  <tbody>
                    {incomeStatementData.cost_of_service.accounts.map((account, idx) => (
                      <tr key={account.account_id ?? account.account_code ?? idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-600">{account.account_code}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{account.account_name}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-orange-700">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="bg-orange-100 px-4 py-3 flex justify-between items-center font-bold">
                <span className="text-orange-900">Total HPP</span>
                <span className="text-xl text-orange-900">
                  ({formatCurrency(incomeStatementData.cost_of_service.total)})
                </span>
              </div>
            </div>

            {/* GROSS PROFIT */}
            <div className={`px-6 py-4 rounded-lg ${
              incomeStatementData.gross_profit >= 0
                ? 'bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-300'
                : 'bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-300'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className={`font-bold text-lg ${
                    incomeStatementData.gross_profit >= 0 ? 'text-sky-900' : 'text-rose-900'
                  }`}>
                    LABA KOTOR (GROSS PROFIT)
                  </h4>
                  <p className="text-sm text-gray-600">
                    Margin: {formatPercent(incomeStatementData.gross_profit_margin)}
                  </p>
                </div>
                <span className={`text-3xl font-bold ${
                  incomeStatementData.gross_profit >= 0 ? 'text-sky-900' : 'text-rose-900'
                }`}>
                  {formatCurrency(incomeStatementData.gross_profit)}
                </span>
              </div>
            </div>

            {/* EXPENSES */}
            <div>
              <div className="bg-indigo-50 px-4 py-2 rounded-t-lg border-l-4 border-indigo-600">
                <h4 className="font-bold text-indigo-900">BEBAN OPERASIONAL (EXPENSES)</h4>
              </div>
              {showDetails && (
                <table className="w-full">
                  <tbody>
                    {incomeStatementData.expenses.accounts.map((account, idx) => (
                      <tr key={account.account_id ?? account.account_code ?? idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-600">{account.account_code}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{account.account_name}</td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-indigo-700">
                          {formatCurrency(account.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="bg-indigo-100 px-4 py-3 flex justify-between items-center font-bold">
                <span className="text-indigo-900">Total Beban</span>
                <span className="text-xl text-indigo-900">
                  ({formatCurrency(incomeStatementData.expenses.total)})
                </span>
              </div>
            </div>

            {/* NET PROFIT */}
            <div className={`px-8 py-6 rounded-lg shadow-lg ${
              incomeStatementData.net_profit >= 0
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                : 'bg-gradient-to-br from-rose-500 to-red-600'
            }`}>
              <div className="flex justify-between items-center text-white">
                <div>
                  <h4 className="font-bold text-2xl mb-2">
                    {incomeStatementData.net_profit >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}
                  </h4>
                  <p className="text-sm text-white/80">
                    Net Profit Margin: {formatPercent(incomeStatementData.net_profit_margin)}
                  </p>
                </div>
                <span className="text-5xl font-bold">
                  {formatCurrency(incomeStatementData.net_profit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!incomeStatementData && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <CurrencyDollarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Pilih Periode untuk Melihat Laporan Laba Rugi
          </h3>
          <p className="text-gray-500">
            Laporan akan dihitung otomatis dari Journal Entries dalam periode yang dipilih
          </p>
        </div>
      )}
    </div>
  );
};

export default IncomeStatementTab;
