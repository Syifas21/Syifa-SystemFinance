import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import VoiceCommandWidget from '../../../components/VoiceCommandWidget';

const CEOBankMonitor: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  // CEO theme
  const ceoTheme = {
    primary: '#7C2D12',
    secondary: '#92400E',
    accent: '#D97706',
    light: '#FEF3C7',
  };

  // Mock data
  const summary = {
    totalAccounts: 5,
    totalBalance: 8500000000,
    reconciled: { count: 3, balance: 6200000000 },
    pending: { count: 2, balance: 2300000000 },
    discrepancies: 3,
  };

  const accounts = [
    {
      id: 'ACC-001',
      bankName: 'Bank BCA',
      accountNumber: '1234567890',
      balance: 3500000000,
      reconciledBalance: 3500000000,
      status: 'Reconciled',
      lastReconciled: '2026-02-04',
    },
    {
      id: 'ACC-002',
      bankName: 'Bank Mandiri',
      accountNumber: '9876543210',
      balance: 2700000000,
      reconciledBalance: 2700000000,
      status: 'Reconciled',
      lastReconciled: '2026-02-03',
    },
    {
      id: 'ACC-003',
      bankName: 'Bank BNI',
      accountNumber: '5555666677',
      balance: 1500000000,
      reconciledBalance: 1480000000,
      status: 'Discrepancy',
      lastReconciled: '2026-02-02',
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Voice Command Handlers
  useEffect(() => {
    const handleVoiceCommand = (event: Event) => {
      const customEvent = event as CustomEvent;
      const command = customEvent.detail?.command?.toLowerCase() || '';
      
      console.log('🎤 CEOBankMonitor received voice command:', command);
      
      // Filter commands
      if (command.includes('filter') || command.includes('tampilkan')) {
        if (command.includes('reconciled') || command.includes('selesai')) {
          setStatusFilter('Reconciled');
          setShowFilters(true);
          alert('✅ Filter diubah ke: RECONCILED');
        } else if (command.includes('pending')) {
          setStatusFilter('Pending');
          setShowFilters(true);
          alert('⏳ Filter diubah ke: PENDING');
        } else if (command.includes('discrepancy') || command.includes('selisih')) {
          setStatusFilter('Discrepancy');
          setShowFilters(true);
          alert('⚠️ Filter diubah ke: DISCREPANCY/SELISIH');
        } else if (command.includes('semua') || command.includes('all')) {
          setStatusFilter('All');
          alert('📋 Filter diubah ke: SEMUA');
        }
      }
      // Export command
      else if (command.includes('export') || command.includes('unduh')) {
        handleExport();
      }
      // Refresh command
      else if (command.includes('refresh') || command.includes('muat ulang')) {
        alert('🔄 Memuat ulang data bank reconciliation...');
        window.location.reload();
      }
      // View first account
      else if (command.includes('lihat detail') || command.includes('view detail')) {
        const currentFiltered = statusFilter === 'All' 
          ? accounts 
          : accounts.filter(acc => acc.status === statusFilter);
        if (currentFiltered.length > 0) {
          setSelectedAccount(currentFiltered[0]);
          alert(`👁️ Menampilkan detail: ${currentFiltered[0].bankName}`);
        } else {
          alert('❌ Tidak ada account untuk ditampilkan');
        }
      }
    };

    window.addEventListener('voice-approve', handleVoiceCommand);
    window.addEventListener('voice-reject', handleVoiceCommand);
    
    const handleGenericVoice = (e: Event) => {
      handleVoiceCommand(e);
    };
    document.addEventListener('voiceCommand', handleGenericVoice);

    return () => {
      window.removeEventListener('voice-approve', handleVoiceCommand);
      window.removeEventListener('voice-reject', handleVoiceCommand);
      document.removeEventListener('voiceCommand', handleGenericVoice);
    };
  }, [statusFilter, showFilters]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Reconciled':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Reconciled
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      case 'Discrepancy':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Selisih
          </span>
        );
      default:
        return null;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('✅ Exporting bank reconciliation data...');
      alert('✅ Data bank reconciliation berhasil di-export ke Excel!');
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredAccounts = statusFilter === 'All' 
    ? accounts 
    : accounts.filter(acc => acc.status === statusFilter);

  return (
    <div className="min-h-screen" style={{ backgroundColor: ceoTheme.light }}>
      {/* Header */}
      <div
        className="px-6 py-8 shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${ceoTheme.primary} 0%, ${ceoTheme.secondary} 100%)`,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="p-4 rounded-xl shadow-md"
            style={{ backgroundColor: ceoTheme.accent }}
          >
            <BanknotesIcon className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">🏦 Monitoring Bank Reconciliation</h1>
            <p className="text-amber-100 mt-1">
              Pemantauan status rekonsiliasi bank dan saldo kas perusahaan
            </p>
          </div>
        </div>
      </div>


      {/* CEO Info Banner */
      <div className="px-6 py-4">
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👁️</span>
            <div>
              <h3 className="font-semibold text-amber-900">Mode Monitoring CEO</h3>
              <p className="text-sm text-amber-700">
                Anda dapat melihat status rekonsiliasi. Operasional rekonsiliasi dilakukan oleh Finance Admin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Accounts */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4" style={{ borderColor: ceoTheme.accent }}>
            <div className="flex items-center justify-between mb-4">
              <BanknotesIcon className="h-8 w-8" style={{ color: ceoTheme.accent }} />
              <ChartBarIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Rekening</h3>
            <p className="text-3xl font-bold text-gray-900">{summary.totalAccounts}</p>
            <p className="text-sm text-gray-600 mt-1">{formatCurrency(summary.totalBalance)}</p>
          </div>

          {/* Reconciled */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Reconciled</h3>
            <p className="text-3xl font-bold text-green-900">{summary.reconciled.count}</p>
            <p className="text-sm text-green-600 font-semibold mt-1">
              {formatCurrency(summary.reconciled.balance)}
            </p>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <span className="text-2xl">⏳</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-900">{summary.pending.count}</p>
            <p className="text-sm text-yellow-600 font-semibold mt-1">
              {formatCurrency(summary.pending.balance)}
            </p>
          </div>

          {/* Discrepancies */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-500">
            <div className="flex items-center justify-between mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Selisih</h3>
            <p className="text-3xl font-bold text-red-900">{summary.discrepancies}</p>
            <p className="text-sm text-red-600 font-semibold mt-1">Perlu Review</p>
          </div>
        </div>
      </div>

      {/* Bank Accounts Table */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ backgroundColor: ceoTheme.light }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: ceoTheme.primary }}>
                📋 Status Rekening Bank
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-amber-300 rounded-lg hover:bg-amber-50 transition-all"
                >
                  <FunnelIcon className="h-5 w-5 text-amber-700" />
                  <span className="text-sm font-medium text-amber-900">Filter</span>
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all disabled:opacity-50"
                >
                  {isExporting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  )}
                  <span className="text-sm font-medium">Export</span>
                </button>
              </div>
            </div>
            {showFilters && (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                {['All', 'Reconciled', 'Pending', 'Discrepancy'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      statusFilter === status
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-amber-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Bank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    No. Rekening
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Saldo Book
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Saldo Reconciled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Last Reconciled
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-amber-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-amber-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <BanknotesIcon className="w-5 h-5 text-amber-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {account.bankName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{account.accountNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(account.balance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(account.reconciledBalance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{account.lastReconciled}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(account.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setSelectedAccount(account)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-all"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span className="text-xs font-medium">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reconciliation Performance */}
      <div className="px-6 py-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg border border-amber-200">
          <h3 className="font-semibold text-amber-900 mb-3">📊 Performa Rekonsiliasi</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-amber-700">Reconciliation Rate</p>
              <p className="text-2xl font-bold text-amber-900">
                {((summary.reconciled.count / summary.totalAccounts) * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-amber-700">Avg Reconcile Time</p>
              <p className="text-2xl font-bold text-amber-900">2 hari</p>
            </div>
            <div>
              <p className="text-sm text-amber-700">Total Cash Position</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(summary.totalBalance)}
              </p>
            </div>
            <div>
              <p className="text-sm text-amber-700">Discrepancy Rate</p>
              <p className="text-2xl font-bold text-red-900">
                {((summary.discrepancies / summary.totalAccounts) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: ceoTheme.light }}>
              <h3 className="text-xl font-bold" style={{ color: ceoTheme.primary }}>
                Detail Bank Account
              </h3>
              <button
                onClick={() => setSelectedAccount(null)}
                className="p-2 hover:bg-amber-200 rounded-lg transition-all"
              >
                <XMarkIcon className="h-6 w-6 text-amber-900" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Bank Name</p>
                  <p className="text-lg font-bold text-gray-900">{selectedAccount.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Account Number</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedAccount.accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Book Balance</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedAccount.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reconciled Balance</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(selectedAccount.reconciledBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Variance</p>
                  <p className={`text-lg font-bold ${
                    selectedAccount.balance === selectedAccount.reconciledBalance 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(selectedAccount.balance - selectedAccount.reconciledBalance))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedAccount.status)}</div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Last Reconciled</p>
                  <p className="text-lg font-medium text-gray-900">{selectedAccount.lastReconciled}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => navigate('/bank-reconciliation')}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all"
                >
                  Go to Reconciliation
                </button>
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CEOBankMonitor;
