import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface JournalEntry {
  id: string;
  transaction_date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference_id?: string;
  reference_type?: string;
}

interface GeneralLedgerData {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  opening_balance: number;
  closing_balance: number;
  total_debit: number;
  total_credit: number;
  entries: JournalEntry[];
}

interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
}

const GeneralLedgerTab: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [allLedgerData, setAllLedgerData] = useState<GeneralLedgerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  
  // Date filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Quick date filters
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'this-week' | 'this-month' | 'this-year' | 'custom'>('this-month');

  // Load accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Load ledger when dates change
  useEffect(() => {
    if (viewMode === 'all') {
      fetchAllGeneralLedgers();
    } else if (selectedAccountId) {
      fetchSingleGeneralLedger();
    }
  }, [viewMode, selectedAccountId, startDate, endDate]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/chartofaccounts');
      if (response.ok) {
        const data = await response.json();
        const accountsData = data.data || data;
        setAccounts(accountsData);
        if (accountsData.length > 0 && !selectedAccountId) {
          setSelectedAccountId(accountsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchAllGeneralLedgers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const accountsToFetch = accounts.length > 0 ? accounts : await fetchAccountsForLedger();
      
      const ledgerPromises = accountsToFetch.map(async (account) => {
        let url = `/api/reports/general-ledger/${account.id}`;
        if (params.toString()) url += `?${params.toString()}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const ledgerData = await response.json();
          // Pastikan nama akun dari list accounts digunakan
          if (ledgerData && account) {
            ledgerData.account_code = account.account_code || ledgerData.account_code;
            ledgerData.account_name = account.account_name || ledgerData.account_name;
            ledgerData.account_type = account.account_type || ledgerData.account_type;
          }
          return ledgerData;
        }
        return null;
      });

      const results = await Promise.all(ledgerPromises);
      const validLedgers = results.filter((ledger): ledger is GeneralLedgerData => 
        ledger !== null && (ledger.entries?.length > 0 || ledger.opening_balance !== 0)
      );
      
      console.log('✅ Loaded all ledgers:', validLedgers.length, 'accounts with activity');
      setAllLedgerData(validLedgers);
    } catch (error) {
      console.error('❌ Error fetching all general ledgers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountsForLedger = async (): Promise<Account[]> => {
    const response = await fetch('/api/chartofaccounts');
    if (response.ok) {
      const data = await response.json();
      return data.data || data;
    }
    return [];
  };

  const fetchSingleGeneralLedger = async () => {
    if (!selectedAccountId) return;
    
    setLoading(true);
    try {
      let url = `/api/reports/general-ledger/${selectedAccountId}`;
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Ambil nama akun dari list accounts
        const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
        if (data && selectedAccount) {
          data.account_code = selectedAccount.account_code || data.account_code;
          data.account_name = selectedAccount.account_name || data.account_name;
          data.account_type = selectedAccount.account_type || data.account_type;
        }
        setAllLedgerData([data]);
      }
    } catch (error) {
      console.error('❌ Error fetching general ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyQuickFilter = (filter: typeof quickFilter) => {
    setQuickFilter(filter);
    const today = new Date();
    
    switch (filter) {
      case 'today':
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'this-week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        setStartDate(weekStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'this-month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(monthStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'this-year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        setStartDate(yearStart.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'all':
        setStartDate('');
        setEndDate('');
        break;
      case 'custom':
        // User will set dates manually
        break;
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
      month: 'short',
      year: 'numeric',
    });
  };

  const getFriendlyDescription = (entry: JournalEntry) => {
    if (entry.description && entry.description.trim() !== '') return entry.description;

    const type = (entry.reference_type || '').toString().toUpperCase();

    const mapping: Record<string, string> = {
      'PAYABLE_PAID': 'Pembayaran kepada vendor',
      'PAYABLE': 'Tagihan vendor',
      'PAYABLE_PAYMENT': 'Pembayaran hutang',
      'INVOICE': 'Faktur penjualan',
      'SALES_INVOICE': 'Faktur penjualan',
      'RECEIPT': 'Penerimaan kas',
      'BANK_TRANSFER': 'Transfer bank',
      'SALARY': 'Beban gaji',
      'GENERAL_JOURNAL': 'Jurnal umum',
      'PURCHASE': 'Pembelian',
      'EXPENSE': 'Beban operasional',
      'ASSET': 'Transaksi aset',
      'DEFAULT': '-',
    };

    if (mapping[type]) return mapping[type];

    // Fallback: create a readable label from reference_type if present
    if (type) return type.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, s => s.toUpperCase());

    return '-';
  };

  const getAccountDisplayName = (ledgerData: GeneralLedgerData) => {
    const name = ledgerData.account_name && String(ledgerData.account_name).trim() !== '' ? String(ledgerData.account_name) : null;
    const code = ledgerData.account_code && String(ledgerData.account_code).trim() !== '' ? String(ledgerData.account_code) : null;

    const type = String(ledgerData.account_type || '');
    const typeMap: Record<string, string> = {
      'Expense': 'Beban',
      'Revenue': 'Pendapatan',
      'Asset': 'Aset',
      'Liability': 'Kewajiban',
      'Equity': 'Ekuitas',
      'CostOfService': 'Harga Pokok',
    };

    // Langsung nama tipe tanpa kata "Akun"
    const typeName = typeMap[type] || type || 'Unknown';
    const accountId = ledgerData.account_id ? ` #${ledgerData.account_id}` : '';

    if (code && name) return `${code} - ${name}`;
    if (code && !name) return `${code} - ${typeName}${accountId}`;
    if (!code && name) return `${name}`;
    return `${typeName}${accountId}`;
  };

  const exportToCSV = () => {
    if (allLedgerData.length === 0) return;

    const csvParts: string[] = [
      `Buku Besar - ${viewMode === 'all' ? 'Semua Akun' : 'Per Akun'}`,
      `Periode: ${startDate ? formatDate(startDate) : 'Awal'} s/d ${endDate ? formatDate(endDate) : 'Akhir'}`,
      '',
    ];

    allLedgerData.forEach(ledger => {
      csvParts.push(`\nAkun: ${ledger.account_code} - ${ledger.account_name}`);
      csvParts.push('Tanggal,Deskripsi,Referensi,Debit,Kredit,Saldo');
      
      ledger.entries.forEach(entry => {
        csvParts.push(
          `${formatDate(entry.transaction_date)},${entry.description || '-'},${entry.reference_id || '-'},${entry.debit},${entry.credit},${entry.balance}`
        );
      });
      
      csvParts.push(`Total,,,${ledger.total_debit},${ledger.total_credit},${ledger.closing_balance}`);
      csvParts.push('');
    });

    const csv = csvParts.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buku-besar-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredAccounts = accounts.filter(
    account =>
      account.account_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.account_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-sm border border-emerald-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">
              Buku Besar (General Ledger)
            </h2>
            <p className="text-emerald-700">
              Detail transaksi {viewMode === 'all' ? 'semua akun' : 'per akun'} dengan saldo berjalan yang dihitung otomatis dari Journal Entries
            </p>
            <div className="mt-3 p-3 bg-white/70 rounded-lg border border-emerald-200">
              <p className="text-xs text-emerald-800">
                💡 <strong>Tips:</strong> Buku Besar menampilkan setiap transaksi per akun dengan running balance. 
                Total Debit dan Credit di sini adalah total transaksi per akun, bukan grand total semua akun.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-white rounded-lg border border-emerald-300 p-1">
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 text-sm rounded transition-all ${
                  viewMode === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Semua Akun
              </button>
              <button
                onClick={() => setViewMode('single')}
                className={`px-4 py-2 text-sm rounded transition-all ${
                  viewMode === 'single'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Per Akun
              </button>
            </div>
            <button
              onClick={exportToCSV}
              disabled={allLedgerData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-lg border border-emerald-300 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <DocumentArrowDownIcon className="h-5 w-5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Selector (only show in single mode) */}
          {viewMode === 'single' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Akun
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari kode atau nama akun..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedAccountId || ''}
                onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">-- Pilih Akun --</option>
                {filteredAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name} ({account.account_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode
            </label>
            <div className="flex gap-2 mb-2">
              {(['all', 'today', 'this-week', 'this-month', 'this-year', 'custom'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => applyQuickFilter(filter)}
                  className={`px-3 py-1 text-sm rounded-lg transition-all ${
                    quickFilter === filter
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'all' && 'Semua'}
                  {filter === 'today' && 'Hari Ini'}
                  {filter === 'this-week' && 'Minggu Ini'}
                  {filter === 'this-month' && 'Bulan Ini'}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={() => {
              if (viewMode === 'all') {
                fetchAllGeneralLedgers();
              } else {
                fetchSingleGeneralLedger();
              }
            }}
            disabled={(viewMode === 'single' && !selectedAccountId) || loading}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Memuat...' : 'Tampilkan'}
          </button>
        </div>
      </div>

      {/* Ledger Data - All Accounts */}
      {allLedgerData.length > 0 && (
        <div className="space-y-6">
          {allLedgerData.map((ledgerData) => (
            <div key={ledgerData.account_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Account Header */}
              <div className="bg-gradient-to-r from-primary-dark to-primary-light px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white/70 mb-1">Akun</div>
                    <h3 className="text-xl font-bold text-white">
                      {getAccountDisplayName(ledgerData)}
                    </h3>
                    <p className="text-sm text-white/90 mt-1">{ledgerData.account_type || ''}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-emerald-100">Saldo Akhir</div>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(ledgerData.closing_balance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50">
                <div className="text-center">
                  <div className="text-xs text-gray-600 mb-1">Saldo Awal</div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(ledgerData.opening_balance)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-emerald-600 mb-1">Total Debit</div>
                  <div className="text-lg font-bold text-emerald-700">
                    {formatCurrency(ledgerData.total_debit)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-rose-600 mb-1">Total Kredit</div>
                  <div className="text-lg font-bold text-rose-700">
                    {formatCurrency(ledgerData.total_credit)}
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              {ledgerData.entries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Tanggal
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Deskripsi
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Referensi
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Debit
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Kredit
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ledgerData.entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(entry.transaction_date)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {getFriendlyDescription(entry)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {entry.reference_type && entry.reference_id
                              ? `${entry.reference_type}-${entry.reference_id.substring(0, 8)}`
                              : '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-emerald-700 font-medium">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-rose-700 font-medium">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                            {formatCurrency(entry.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-8 text-center text-gray-500 text-sm">
                  Tidak ada transaksi untuk periode ini
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {allLedgerData.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FunnelIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {viewMode === 'single' ? 'Pilih Akun untuk Melihat Buku Besar' : 'Klik Tampilkan untuk Melihat Semua Buku Besar'}
          </h3>
          <p className="text-gray-500">
            {viewMode === 'single' 
              ? 'Pilih akun dan periode untuk menampilkan detail transaksi dengan saldo berjalan'
              : 'Klik tombol Tampilkan untuk memuat buku besar semua akun dengan aktivitas transaksi'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default GeneralLedgerTab;
