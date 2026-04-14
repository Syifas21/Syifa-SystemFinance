import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

interface AccountBalance {
  account_id: number;
  account_code: string;
  account_name: string;
  balance: number;
}

interface BalanceSheetData {
  as_of_date: string;
  assets: {
    accounts: AccountBalance[];
    total: number;
  };
  liabilities: {
    accounts: AccountBalance[];
    total: number;
  };
  equity: {
    accounts: AccountBalance[];
    total: number;
  };
  total_liabilities_and_equity: number;
  is_balanced: boolean;
  difference: number;
}

const BalanceSheetTab: React.FC = () => {
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showDetails, setShowDetails] = useState(true);

  useEffect(() => {
    fetchBalanceSheet();
  }, [asOfDate]);

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      let url = '/api/reports/balance-sheet'; // Use Vite proxy
      if (asOfDate) {
        url += `?asOfDate=${asOfDate}`;
      }

      console.log('📡 Fetching Balance Sheet:', url);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Balance Sheet data from DB:', data);
        console.log('📊 Total Assets:', data.assets?.total);
        console.log('📊 Total Liabilities:', data.liabilities?.total);
        console.log('📊 Total Equity:', data.equity?.total);
        setBalanceSheetData(data);
      } else {
        console.error('❌ Failed to fetch balance sheet:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching balance sheet:', error);
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

  // Per-category color and style mappings. Adjust Tailwind classes here to match theme.
  const CATEGORY_STYLES = {
    assets: {
      summaryFrom: 'from-yellow-50',
      summaryTo: 'to-yellow-100',
      summaryBorder: 'border-yellow-200',
      summaryText: 'text-yellow-700',
      headerFrom: 'from-yellow-600',
      headerTo: 'to-yellow-500',
      amountText: 'text-yellow-700',
      footerBg: 'bg-yellow-50',
      footerText: 'text-yellow-900',
      tagBg: 'bg-yellow-100',
      tagText: 'text-yellow-700',
    },
    liabilities: {
      summaryFrom: 'from-sky-50',
      summaryTo: 'to-blue-50',
      summaryBorder: 'border-sky-200',
      summaryText: 'text-sky-700',
      headerFrom: 'from-sky-500',
      headerTo: 'to-blue-600',
      amountText: 'text-rose-700',
      footerBg: 'bg-rose-50',
      footerText: 'text-rose-900',
      tagBg: 'bg-rose-100',
      tagText: 'text-rose-700',
    },
    equity: {
      summaryFrom: 'from-indigo-50',
      summaryTo: 'to-blue-50',
      summaryBorder: 'border-indigo-200',
      summaryText: 'text-indigo-700',
      headerFrom: 'from-indigo-500',
      headerTo: 'to-blue-600',
      amountText: 'text-indigo-700',
      footerBg: 'bg-indigo-50',
      footerText: 'text-indigo-900',
      tagBg: 'bg-indigo-100',
      tagText: 'text-indigo-700',
    },
    totalsBalanced: 'bg-gradient-to-br from-yellow-600 to-yellow-500',
    totalsUnbalanced: 'bg-gradient-to-br from-rose-500 to-red-600',
  } as const;

  // Optional explicit overrides for account display names. Key by account_code.
  const ACCOUNT_NAME_OVERRIDES: Record<string, string> = {
    // Example: '1010': 'Beban Gaji',
    // Add specific account code -> display name mappings here.
  };

  const getDisplayAccountName = (account: AccountBalance) => {
    if (account.account_name && account.account_name.trim().length > 0) return account.account_name;
    if (account.account_code && ACCOUNT_NAME_OVERRIDES[account.account_code]) return ACCOUNT_NAME_OVERRIDES[account.account_code];
    return `Akun ${account.account_id}`;
  };

  const exportToCSV = () => {
    if (!balanceSheetData) return;

    const csv = [
      `NERACA (BALANCE SHEET)`,
      `Per ${formatDate(balanceSheetData.as_of_date)}`,
      '',
      'ASET (ASSETS)',
      'Kode,Nama Akun,Saldo',
      ...balanceSheetData.assets.accounts.map(acc => 
        `${acc.account_code},${acc.account_name},${acc.balance}`
      ),
      `TOTAL ASET,,${balanceSheetData.assets.total}`,
      '',
      'KEWAJIBAN (LIABILITIES)',
      'Kode,Nama Akun,Saldo',
      ...balanceSheetData.liabilities.accounts.map(acc => 
        `${acc.account_code},${acc.account_name},${acc.balance}`
      ),
      `TOTAL KEWAJIBAN,,${balanceSheetData.liabilities.total}`,
      '',
      'EKUITAS (EQUITY)',
      'Kode,Nama Akun,Saldo',
      ...balanceSheetData.equity.accounts.map(acc => 
        `${acc.account_code},${acc.account_name},${acc.balance}`
      ),
      `TOTAL EKUITAS,,${balanceSheetData.equity.total}`,
      '',
      `TOTAL KEWAJIBAN & EKUITAS,,${balanceSheetData.total_liabilities_and_equity}`,
      '',
      `STATUS,${balanceSheetData.is_balanced ? 'BALANCED' : 'NOT BALANCED'}`,
      `SELISIH,${balanceSheetData.difference}`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neraca-${asOfDate}.csv`;
    a.click();
  };

  const quickDateOptions = [
    { label: 'Hari Ini', value: new Date().toISOString().split('T')[0] },
    { 
      label: 'Akhir Bulan Lalu', 
      value: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0] 
    },
    { 
      label: 'Akhir Tahun Lalu', 
      value: new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split('T')[0] 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl shadow-sm border border-sky-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-sky-900 mb-2">
              Neraca (Balance Sheet)
            </h2>
            <p className="text-sky-700">
              Laporan Posisi Keuangan: Aset = Kewajiban + Ekuitas (dihitung otomatis)
            </p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={!balanceSheetData}
            className="flex items-center gap-2 px-4 py-2 bg-white text-sky-700 rounded-lg border border-sky-300 hover:bg-sky-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
            <h4 className="text-sm font-bold text-blue-900 mb-2">📊 Kenapa Angka Neraca Berbeda dengan Journal Entries?</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Neraca/Balance Sheet</strong> hanya menampilkan <strong>SALDO AKHIR</strong> dari akun Asset, Liability, dan Equity saja.</p>
              <p><strong>TIDAK termasuk</strong> Revenue dan Expense (karena sudah masuk ke Laba/Rugi).</p>
              <p className="pt-2"><strong>Contoh:</strong> Jika Kas punya transaksi debit 50jt dan kredit 30jt, di Neraca cuma muncul saldo 20jt.</p>
              <p className="pt-2 font-semibold">✓ Rumus: Total Asset = Total Liability + Total Equity</p>
            </div>
          </div>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
            <div className="flex gap-2 mt-2">
              {quickDateOptions.map(option => (
                <button
                  key={option.label}
                  onClick={() => setAsOfDate(option.value)}
                  className="px-3 py-1 text-xs bg-sky-50 text-sky-700 rounded hover:bg-sky-100 transition-all"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* View Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tampilan
            </label>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`w-full px-4 py-2 rounded-lg border transition-all ${
                showDetails
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ScaleIcon className="inline h-5 w-5 mr-2" />
              {showDetails ? 'Detail per Akun' : 'Ringkasan Total'}
            </button>
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={fetchBalanceSheet}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Memuat...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Balance Status Card */}
      {balanceSheetData && (
        <div className={`rounded-xl shadow-sm border p-6 ${
          balanceSheetData.is_balanced
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
            : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {balanceSheetData.is_balanced ? (
                <CheckCircleIcon className="h-12 w-12 text-emerald-600" />
              ) : (
                <XCircleIcon className="h-12 w-12 text-rose-600" />
              )}
              <div>
                <h3 className={`text-2xl font-bold ${
                  balanceSheetData.is_balanced ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  {balanceSheetData.is_balanced 
                    ? 'NERACA SEIMBANG ✓' 
                    : 'NERACA TIDAK SEIMBANG ✗'}
                </h3>
                <p className={`text-sm ${
                  balanceSheetData.is_balanced ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  Assets {balanceSheetData.is_balanced ? '=' : '≠'} Liabilities + Equity
                </p>
              </div>
            </div>
            {!balanceSheetData.is_balanced && (
              <div className="text-right">
                <div className="text-sm text-rose-700 mb-1">Selisih</div>
                <div className="text-2xl font-bold text-rose-900">
                  {formatCurrency(Math.abs(balanceSheetData.difference))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {balanceSheetData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`bg-gradient-to-br ${CATEGORY_STYLES.assets.summaryFrom} ${CATEGORY_STYLES.assets.summaryTo} rounded-lg shadow-sm ${CATEGORY_STYLES.assets.summaryBorder} p-5`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm font-medium ${CATEGORY_STYLES.assets.summaryText}`}>Total Aset</div>
              <div className={`text-xs ${CATEGORY_STYLES.assets.tagBg} ${CATEGORY_STYLES.assets.tagText} px-2 py-1 rounded font-medium`}>
                {balanceSheetData.assets.accounts.length} akun
              </div>
            </div>
            <div className={`text-2xl font-bold ${CATEGORY_STYLES.assets.amountText}`}>
              {formatCurrency(balanceSheetData.assets.total)}
            </div>
          </div>
          <div className={`bg-gradient-to-br ${CATEGORY_STYLES.liabilities.summaryFrom} ${CATEGORY_STYLES.liabilities.summaryTo} rounded-lg shadow-sm ${CATEGORY_STYLES.liabilities.summaryBorder} p-5`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm font-medium ${CATEGORY_STYLES.liabilities.summaryText}`}>Total Kewajiban</div>
              <div className={`text-xs ${CATEGORY_STYLES.liabilities.tagBg} ${CATEGORY_STYLES.liabilities.tagText} px-2 py-1 rounded font-medium`}>
                {balanceSheetData.liabilities.accounts.length} akun
              </div>
            </div>
            <div className={`text-2xl font-bold ${CATEGORY_STYLES.liabilities.footerText}`}>
              {formatCurrency(balanceSheetData.liabilities.total)}
            </div>
          </div>
          <div className={`bg-gradient-to-br ${CATEGORY_STYLES.equity.summaryFrom} ${CATEGORY_STYLES.equity.summaryTo} rounded-lg shadow-sm ${CATEGORY_STYLES.equity.summaryBorder} p-5`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm font-medium ${CATEGORY_STYLES.equity.summaryText}`}>Total Ekuitas</div>
              <div className={`text-xs ${CATEGORY_STYLES.equity.tagBg} ${CATEGORY_STYLES.equity.tagText} px-2 py-1 rounded font-medium`}>
                {balanceSheetData.equity.accounts.length} akun
              </div>
            </div>
            <div className={`text-2xl font-bold ${CATEGORY_STYLES.equity.amountText}`}>
              {formatCurrency(balanceSheetData.equity.total)}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !balanceSheetData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mx-auto mb-4 border-sky-500"></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Memuat Neraca...
          </h3>
          <p className="text-gray-500">
            Sedang mengambil data Balance Sheet dari database
          </p>
        </div>
      )}

      {/* Empty/Error State */}
      {!loading && !balanceSheetData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Tidak Ada Data Balance Sheet
          </h3>
          <p className="text-gray-500 mb-4">
            Belum ada akun dengan saldo untuk tanggal yang dipilih. Silakan:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4">
            <li>✓ Pastikan Chart of Accounts sudah dibuat (Aset, Liabilitas, Ekuitas)</li>
            <li>✓ Post Journal Entries untuk menciptakan saldo akun</li>
            <li>✓ Pilih tanggal yang sesuai dengan periode akuntansi</li>
          </ul>
          <button
            onClick={fetchBalanceSheet}
            className="px-6 py-2 text-white rounded-lg hover:bg-sky-700 transition-all bg-sky-600"
          >
            Coba Muat Ulang
          </button>
        </div>
      )}

      {/* Balance Sheet Table */}
      {balanceSheetData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT SIDE - ASSETS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className={`px-6 py-4 bg-gradient-to-r ${CATEGORY_STYLES.assets.headerFrom} ${CATEGORY_STYLES.assets.headerTo} text-white`}>
              <h3 className="text-lg font-bold">ASET (ASSETS)</h3>
              <p className="text-sm text-white/80">Sumber Daya Ekonomi</p>
            </div>
            {showDetails ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Kode
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Nama Akun
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {balanceSheetData.assets.accounts.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          Tidak ada akun aset
                        </td>
                      </tr>
                      ) : (
                      balanceSheetData.assets.accounts.map((account, idx) => (
                        <tr key={account.account_id ?? account.account_code ?? idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {account.account_code}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {getDisplayAccountName(account)}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-medium ${CATEGORY_STYLES.assets.amountText}`}>
                            {formatCurrency(account.balance)}
                          </td>
                        </tr>
                        ))
                    )}
                  </tbody>
                  <tfoot className={`${CATEGORY_STYLES.assets.footerBg} font-bold`}>
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm text-yellow-900">
                        TOTAL ASET
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-yellow-900">
                        {formatCurrency(balanceSheetData.assets.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Total Aset</div>
                  <div className={`text-4xl font-bold ${CATEGORY_STYLES.assets.amountText}`}>
                    {formatCurrency(balanceSheetData.assets.total)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {balanceSheetData.assets.accounts.length} akun
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE - LIABILITIES & EQUITY */}
          <div className="space-y-6">
            {/* LIABILITIES */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className={`px-6 py-4 bg-gradient-to-r ${CATEGORY_STYLES.liabilities.headerFrom} ${CATEGORY_STYLES.liabilities.headerTo} text-white`}>
                <h3 className="text-lg font-bold">KEWAJIBAN (LIABILITIES)</h3>
                <p className="text-sm text-white/80">Hutang & Kewajiban</p>
              </div>
              {showDetails ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Kode
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Nama Akun
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {balanceSheetData.liabilities.accounts.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                            Tidak ada akun kewajiban
                          </td>
                        </tr>
                        ) : (
                        balanceSheetData.liabilities.accounts.map((account, idx) => (
                          <tr key={account.account_id ?? account.account_code ?? idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {account.account_code}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {getDisplayAccountName(account)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-rose-700">
                              {formatCurrency(account.balance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-rose-50 font-bold">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-sm text-rose-900">
                          TOTAL KEWAJIBAN
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-rose-900">
                          {formatCurrency(balanceSheetData.liabilities.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Total Kewajiban</div>
                    <div className={`text-2xl font-bold ${CATEGORY_STYLES.liabilities.amountText}`}>
                      {formatCurrency(balanceSheetData.liabilities.total)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* EQUITY */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className={`px-6 py-4 bg-gradient-to-r ${CATEGORY_STYLES.equity.headerFrom} ${CATEGORY_STYLES.equity.headerTo} text-white`}>
                <h3 className="text-lg font-bold">EKUITAS (EQUITY)</h3>
                <p className="text-sm text-white/80">Modal & Laba Ditahan</p>
              </div>
              {showDetails ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Kode
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Nama Akun
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {balanceSheetData.equity.accounts.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                            Tidak ada akun ekuitas
                          </td>
                        </tr>
                      ) : (
                        balanceSheetData.equity.accounts.map((account, idx) => (
                          <tr key={account.account_id ?? account.account_code ?? idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {account.account_code}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {getDisplayAccountName(account)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium text-indigo-700">
                              {formatCurrency(account.balance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-indigo-50 font-bold">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-sm text-indigo-900">
                          TOTAL EKUITAS
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-indigo-900">
                          {formatCurrency(balanceSheetData.equity.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Total Ekuitas</div>
                    <div className={`text-2xl font-bold ${CATEGORY_STYLES.equity.amountText}`}>
                      {formatCurrency(balanceSheetData.equity.total)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TOTAL LIABILITIES & EQUITY */}
            <div className={`rounded-lg shadow-md p-4 ${
              balanceSheetData.is_balanced
                ? CATEGORY_STYLES.totalsBalanced
                : CATEGORY_STYLES.totalsUnbalanced
            }`}>
              <div className="text-center text-white">
                <div className="text-sm text-white/80 mb-2">
                  TOTAL KEWAJIBAN & EKUITAS
                </div>
                <div className="text-3xl font-bold">
                  {formatCurrency(balanceSheetData.total_liabilities_and_equity)}
                </div>
                {balanceSheetData.is_balanced && (
                  <div className="text-xs text-white/80 mt-2">
                    ✓ Seimbang dengan Total Aset
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSheetTab;
