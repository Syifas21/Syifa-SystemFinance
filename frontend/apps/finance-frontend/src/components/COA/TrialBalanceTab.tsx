import React, { useState, useEffect } from 'react';
import THEME from '../../config/theme';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface TrialBalanceEntry {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
  balance: number;
}

interface TrialBalanceData {
  as_of_date: string;
  entries: TrialBalanceEntry[];
  total_debit: number;
  total_credit: number;
  difference: number;
  is_balanced: boolean;
}

interface AccountTypeSummary {
  account_type: string;
  debit: number;
  credit: number;
  balance: number;
  count: number;
}

const TrialBalanceTab: React.FC = () => {
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [groupByType, setGroupByType] = useState(false);
  const [filterAccountType, setFilterAccountType] = useState<string>('all');

  useEffect(() => {
    fetchTrialBalance();
  }, [asOfDate]);

  const fetchTrialBalance = async () => {
    setLoading(true);
    try {
      let url = '/api/reports/trial-balance'; // Use Vite proxy
      if (asOfDate) {
        url += `?asOfDate=${asOfDate}`;
      }

      console.log('📡 Fetching Trial Balance:', url);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Trial Balance data from DB:', data);
        console.log('📊 Entries count:', data.entries?.length || 0);
        console.log('⚖️ Is Balanced:', data.is_balanced);
        setTrialBalanceData(data);
      } else {
        console.error('❌ Failed to fetch trial balance:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching trial balance:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const exportToCSV = () => {
    if (!trialBalanceData) return;

    const headers = ['Kode Akun', 'Nama Akun', 'Tipe', 'Debit', 'Kredit', 'Saldo'];
    const rows = filteredEntries.map(entry => [
      entry.account_code,
      entry.account_name,
      entry.account_type,
      entry.debit.toString(),
      entry.credit.toString(),
      entry.balance.toString(),
    ]);

    const csv = [
      `Neraca Saldo per ${formatDate(trialBalanceData.as_of_date)}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `TOTAL,${trialBalanceData.total_debit},${trialBalanceData.total_credit}`,
      `Selisih,${trialBalanceData.difference}`,
      `Status,${trialBalanceData.is_balanced ? 'BALANCED' : 'NOT BALANCED'}`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neraca-saldo-${asOfDate}.csv`;
    a.click();
  };

  const getAccountTypeSummary = (): AccountTypeSummary[] => {
    if (!trialBalanceData) return [];

    const summary = new Map<string, AccountTypeSummary>();

    trialBalanceData.entries.forEach(entry => {
      if (!summary.has(entry.account_type)) {
        summary.set(entry.account_type, {
          account_type: entry.account_type,
          debit: 0,
          credit: 0,
          balance: 0,
          count: 0,
        });
      }

      const item = summary.get(entry.account_type)!;
      item.debit += entry.debit;
      item.credit += entry.credit;
      item.balance += entry.balance;
      item.count += 1;
    });

    return Array.from(summary.values());
  };

  const filteredEntries = trialBalanceData?.entries.filter(entry => 
    filterAccountType === 'all' || entry.account_type === filterAccountType
  ) || [];

  const accountTypes = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header Info */}
      <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: THEME.accentSoft, borderColor: THEME.accent }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: THEME.primary, fontFamily: 'inherit' }}>
              Neraca Saldo (Trial Balance)
            </h2>
            <p style={{ color: THEME.textMuted, fontFamily: 'inherit' }}>
              Validasi otomatis bahwa Total Debit = Total Kredit dari semua akun
            </p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={!trialBalanceData}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ color: THEME.accent, borderColor: THEME.accent, fontFamily: 'inherit' }}
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="inline h-5 w-5 mr-1" />
              Per Tanggal
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ outlineColor: THEME.accent, fontFamily: 'inherit' }}
            />
          </div>

          {/* Account Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'inherit' }}>
              Filter Tipe Akun
            </label>
            <select
              value={filterAccountType}
              onChange={(e) => setFilterAccountType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ outlineColor: THEME.accent, fontFamily: 'inherit' }}
            >
              <option value="all">Semua Tipe</option>
              {accountTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'inherit' }}>
              Tampilan
            </label>
            <button
              onClick={() => setGroupByType(!groupByType)}
              className="w-full px-4 py-2 rounded-lg border transition-all"
              style={{
                backgroundColor: groupByType ? THEME.accent : 'white',
                color: groupByType ? 'white' : THEME.textPrimary,
                borderColor: groupByType ? THEME.accent : '#D1D5DB',
                fontFamily: 'inherit'
              }}
            >
              <ChartBarIcon className="inline h-5 w-5 mr-2" />
              {groupByType ? 'Ringkasan per Tipe' : 'Detail per Akun'}
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={fetchTrialBalance}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ backgroundColor: THEME.accent, fontFamily: 'inherit' }}
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Loading State - Show FIRST before any content */}
      {loading && !trialBalanceData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: THEME.accent }}></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Memuat Neraca Saldo...
          </h3>
          <p className="text-gray-500">
            Sedang mengambil data dari database
          </p>
        </div>
      )}

      {/* Empty State - Show if no loading and no data */}
      {!loading && !trialBalanceData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Tidak Ada Data
          </h3>
          <p className="text-gray-500 mb-4">
            Belum ada transaksi atau data akun untuk tanggal yang dipilih. Silakan:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4">
            <li>✓ Buat Chart of Accounts terlebih dahulu</li>
            <li>✓ Masukkan Journal Entries</li>
            <li>✓ Pilih tanggal yang sesuai</li>
          </ul>
          <button
            onClick={fetchTrialBalance}
            className="px-6 py-2 text-white rounded-lg transition-all"
            style={{ backgroundColor: THEME.accent }}
          >
            Coba Muat Ulang
          </button>
        </div>
      )}

      {/* Information Box - Penjelasan Angka (Show only when data exists) */}
      {trialBalanceData && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-blue-900 mb-2">📊 Penjelasan Perbedaan Angka</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Journal Entries (58jt):</strong> Total SEMUA transaksi individual debit dan kredit. Dalam double-entry, total debit HARUS = total kredit.</p>
                <p><strong>Neraca Saldo (25jt):</strong> SALDO BERSIH per akun setelah debit dikurangi kredit. Contoh: Kas debit 50jt - kredit 40jt = saldo 10jt.</p>
                <p><strong>Neraca/Laporan Posisi Keuangan:</strong> Menampilkan hanya saldo akhir Asset, Liability, Equity (tidak termasuk Revenue/Expense).</p>
                <p className="pt-2 font-semibold">✓ Angka berbeda itu NORMAL dan BENAR dalam akuntansi!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Status Card */}
      {trialBalanceData && (
        <div className={`rounded-xl shadow-sm border p-6 ${
          trialBalanceData.is_balanced
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
            : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300'
        }`} style={{ fontFamily: 'inherit' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {trialBalanceData.is_balanced ? (
                <CheckCircleIcon className="h-12 w-12 text-emerald-600" />
              ) : (
                <XCircleIcon className="h-12 w-12 text-rose-600" />
              )}
              <div>
                <h3 className={`text-2xl font-bold ${
                  trialBalanceData.is_balanced ? 'text-emerald-900' : 'text-rose-900'
                }`} style={{ fontFamily: 'inherit' }}>
                  {trialBalanceData.is_balanced ? 'NERACA SEIMBANG ✓' : 'NERACA TIDAK SEIMBANG ✗'}
                </h3>
                <p className={`text-sm ${
                  trialBalanceData.is_balanced ? 'text-emerald-700' : 'text-rose-700'
                }`} style={{ fontFamily: 'inherit' }}>
                  Per {formatDate(trialBalanceData.as_of_date)}
                </p>
              </div>
            </div>
            {!trialBalanceData.is_balanced && (
              <div className="text-right">
                <div className="text-sm text-rose-700 mb-1" style={{ fontFamily: 'inherit' }}>Selisih</div>
                <div className="text-2xl font-bold text-rose-900" style={{ fontFamily: 'inherit' }}>
                  {formatCurrency(Math.abs(trialBalanceData.difference))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {trialBalanceData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg shadow-sm border p-5" style={{ backgroundColor: THEME.accentSoft, borderColor: THEME.accent, fontFamily: 'inherit' }}>
            <div className="text-sm font-medium mb-2" style={{ color: THEME.accent, fontFamily: 'inherit' }}>Total Debit</div>
            <div className="text-2xl font-bold" style={{ color: THEME.primary, fontFamily: 'inherit' }}>
              {formatCurrency(trialBalanceData.total_debit)}
            </div>
            <div className="text-xs text-gray-600 mt-2" style={{ fontFamily: 'inherit' }}>
              {trialBalanceData.entries.length} akun
            </div>
          </div>
          <div className="rounded-lg shadow-sm border p-5" style={{ backgroundColor: THEME.accentSoft, borderColor: THEME.accent, fontFamily: 'inherit' }}>
            <div className="text-sm font-medium mb-2" style={{ color: THEME.accent, fontFamily: 'inherit' }}>Total Kredit</div>
            <div className="text-2xl font-bold" style={{ color: THEME.primary, fontFamily: 'inherit' }}>
              {formatCurrency(trialBalanceData.total_credit)}
            </div>
            <div className="text-xs text-gray-600 mt-2" style={{ fontFamily: 'inherit' }}>
              {trialBalanceData.entries.length} akun
            </div>
          </div>
          <div className={`rounded-lg shadow-sm border-2 p-5 ${
            trialBalanceData.is_balanced
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300'
              : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300'
          }`} style={{ fontFamily: 'inherit' }}>
            <div className={`text-sm font-medium mb-2 ${
              trialBalanceData.is_balanced ? 'text-emerald-600' : 'text-rose-600'
            }`} style={{ fontFamily: 'inherit' }}>
              {trialBalanceData.is_balanced ? 'Status' : 'Selisih'}
            </div>
            <div className={`text-2xl font-bold ${
              trialBalanceData.is_balanced ? 'text-emerald-700' : 'text-rose-700'
            }`} style={{ fontFamily: 'inherit' }}>
              {trialBalanceData.is_balanced 
                ? '✓ BALANCED' 
                : formatCurrency(Math.abs(trialBalanceData.difference))
              }
            </div>
          </div>
        </div>
      )}

      {/* Summary by Account Type */}
      {trialBalanceData && groupByType && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Ringkasan per Tipe Akun
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipe Akun
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Jumlah Akun
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total Debit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total Kredit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getAccountTypeSummary().map((summary) => (
                  <tr key={summary.account_type} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-sm font-medium rounded-full" style={{ backgroundColor: THEME.accentSoft, color: THEME.accent, fontFamily: 'inherit' }}>
                        {summary.account_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">
                      {summary.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-700 font-medium">
                      {formatCurrency(summary.debit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-rose-700 font-medium">
                      {formatCurrency(summary.credit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                      {formatCurrency(summary.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Table */}
      {trialBalanceData && !groupByType && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Detail per Akun {filterAccountType !== 'all' && `(${filterAccountType})`}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nama Akun
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Debit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Kredit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada data untuk filter yang dipilih
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.account_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.account_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {entry.account_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: THEME.accentSoft, color: THEME.accent, fontFamily: 'inherit' }}>
                          {entry.account_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-700 font-medium">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-rose-700 font-medium">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {formatCurrency(entry.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredEntries.length > 0 && (
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">
                      TOTAL
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-emerald-700">
                      {formatCurrency(trialBalanceData.total_debit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-rose-700">
                      {formatCurrency(trialBalanceData.total_credit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {trialBalanceData.is_balanced ? (
                        <span className="text-emerald-700">✓ BALANCED</span>
                      ) : (
                        <span className="text-rose-700">✗ {formatCurrency(Math.abs(trialBalanceData.difference))}</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialBalanceTab;
