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
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';

interface PayableItem {
  id: string;
  vendor_invoice_number: string;
  invoice_date: string;
  due_date: string;
  vendor_name: string;
  vendor_npwp?: string;
  description?: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  vendor_phone?: string;
  vendor_email?: string;
}

const CEOPayablesMonitor: React.FC = () => {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_FINANCE_API || 'http://localhost:3002/api';

  // State Management
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<PayableItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [payables, setPayables] = useState<PayableItem[]>([]);
  const [summary, setSummary] = useState({
    totalPayables: 0,
    totalAmount: 0,
    paid: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
    overdue: { count: 0, amount: 0 },
  });

  // CEO theme
  const ceoTheme = {
    primary: '#7C2D12',
    secondary: '#92400E',
    accent: '#D97706',
    light: '#FEF3C7',
  };

  // Fetch payables from API
  const fetchPayables = async () => {
    try {
      setIsLoading(true);
      console.log('📡 Fetching payables from API...');
      const response = await fetch(`${API_BASE}/payables`);
      if (response.ok) {
        const data = await response.json();
        const payablesArray = data.data || data || [];
        console.log('✅ Payables loaded:', payablesArray.length);
        
        // Transform data
        const transformed: PayableItem[] = payablesArray.map((pay: any) => ({
          id: pay.id,
          vendor_invoice_number: pay.vendor_invoice_number,
          invoice_date: pay.invoice_date?.split('T')[0] || pay.invoice_date,
          due_date: pay.due_date?.split('T')[0] || pay.due_date,
          vendor_name: pay.vendor_name,
          vendor_npwp: pay.vendor_npwp,
          description: pay.description,
          total_amount: parseFloat(pay.total_amount) || 0,
          paid_amount: parseFloat(pay.paid_amount) || 0,
          remaining_amount: parseFloat(pay.remaining_amount) || parseFloat(pay.total_amount) || 0,
          status: pay.status || 'PENDING',
          vendor_phone: pay.vendor_phone,
          vendor_email: pay.vendor_email,
        }));
        
        setPayables(transformed);
        calculateSummary(transformed);
      }
    } catch (error) {
      console.error('❌ Error fetching payables:', error);
      alert('❌ Error fetching payables. Make sure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary data
  const calculateSummary = (payableList: PayableItem[]) => {
    const total = payableList.length;
    const totalAmount = payableList.reduce((sum, pay) => sum + (pay.total_amount || 0), 0);
    
    const paidPayables = payableList.filter(pay => pay.status === 'PAID' || pay.paid_amount === pay.total_amount);
    const paidCount = paidPayables.length;
    const paidAmount = paidPayables.reduce((sum, pay) => sum + (pay.paid_amount || 0), 0);
    
    const overduePayables = payableList.filter(pay => pay.status === 'OVERDUE');
    const overdueCount = overduePayables.length;
    const overdueAmount = overduePayables.reduce((sum, pay) => sum + (pay.remaining_amount || 0), 0);
    
    const pendingCount = total - paidCount - overdueCount;
    const pendingAmount = totalAmount - paidAmount - overdueAmount;
    
    setSummary({
      totalPayables: total,
      totalAmount: totalAmount,
      paid: { count: paidCount, amount: paidAmount },
      pending: { count: pendingCount, amount: pendingAmount },
      overdue: { count: overdueCount, amount: overdueAmount },
    });
  };

  // Load data on mount
  useEffect(() => {
    fetchPayables();
  }, []);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPayables();
    setTimeout(() => setIsRefreshing(false), 500);
  };

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
      
      console.log('🎤 CEOPayablesMonitor received voice command:', command);
      
      // Filter commands
      if (command.includes('filter') || command.includes('tampilkan')) {
        if (command.includes('paid') || command.includes('lunas')) {
          setStatusFilter('Paid');
          setShowFilters(true);
          alert('✅ Filter diubah ke: PAID');
        } else if (command.includes('pending') || command.includes('belum')) {
          setStatusFilter('Pending');
          setShowFilters(true);
          alert('⏳ Filter diubah ke: PENDING');
        } else if (command.includes('overdue') || command.includes('telat')) {
          setStatusFilter('Overdue');
          setShowFilters(true);
          alert('⚠️ Filter diubah ke: OVERDUE');
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
        alert('🔄 Memuat ulang data payables...');
        window.location.reload();
      }
      // View first payable
      else if (command.includes('lihat detail') || command.includes('view detail')) {
        if (payables.length > 0) {
          setSelectedPayable(payables[0]);
          alert(`👁️ Menampilkan detail: ${payables[0].vendor_invoice_number}`);
        } else {
          alert('❌ Tidak ada payable untuk ditampilkan');
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
    const statusUpper = status?.toUpperCase() || '';
    
    if (statusUpper === 'PAID') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Lunas
        </span>
      );
    }
    if (statusUpper === 'PENDING' || statusUpper === 'APPROVED') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
          <ClockIcon className="w-4 h-4 mr-1" />
          Pending
        </span>
      );
    }
    if (statusUpper === 'OVERDUE') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
          Overdue
        </span>
      );
    }
    if (statusUpper === 'CANCELLED') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
        {status}
      </span>
    );
  };

  const handleExport = async () => {
    if (filteredPayables.length === 0) {
      alert('⚠️ Tidak ada data untuk di-export');
      return;
    }

    setIsExporting(true);
    try {
      // Create export data
      const exportData = filteredPayables.map(pay => ({
        'Supplier Invoice': pay.vendor_invoice_number,
        'Vendor': pay.vendor_name,
        'Invoice Date': pay.invoice_date,
        'Due Date': pay.due_date,
        'Total Amount': pay.total_amount,
        'Paid Amount': pay.paid_amount,
        'Remaining Amount': pay.remaining_amount,
        'Status': pay.status,
        'Contact': pay.vendor_phone || '-',
        'Email': pay.vendor_email || '-',
      }));

      // Create Excel file
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payables');
      
      // Format columns
      ws['!cols'] = [
        { wch: 18 }, // Supplier Invoice
        { wch: 25 }, // Vendor
        { wch: 12 }, // Invoice Date
        { wch: 12 }, // Due Date
        { wch: 15 }, // Total Amount
        { wch: 15 }, // Paid Amount
        { wch: 15 }, // Remaining Amount
        { wch: 10 }, // Status
        { wch: 15 }, // Contact
        { wch: 20 }, // Email
      ];

      // Download
      const fileName = `Payables_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      console.log('✅ Export successful');
      alert('✅ Data berhasil di-export ke Excel!');
    } catch (error) {
      console.error('Error exporting:', error);
      alert('❌ Error saat export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Get status for filtering
  const mapStatusForFilter = (status: string): string => {
    if (status === 'Pending' || status === 'PENDING' || status === 'APPROVED') return 'PENDING';
    if (status === 'Paid' || status === 'PAID') return 'PAID';
    if (status === 'Overdue' || status === 'OVERDUE') return 'OVERDUE';
    return status;
  };

  const filteredPayables = statusFilter === 'All' 
    ? payables 
    : payables.filter(pay => {
        const mappedFilter = mapStatusForFilter(statusFilter);
        return mapStatusForFilter(pay.status) === mappedFilter;
      });

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
            <h1 className="text-3xl font-bold text-white">💰 Monitoring Hutang (Payables)</h1>
            <p className="text-amber-100 mt-1">
              Pemantauan status hutang dan pembayaran kepada supplier
            </p>
          </div>
        </div>
      </div>

      {/* CEO Info Banner */}
      <div className="px-6 py-4">
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👁️</span>
            <div>
              <h3 className="font-semibold text-amber-900">Mode Monitoring CEO</h3>
              <p className="text-sm text-amber-700">
                Anda dapat melihat status payables. Operasional CRUD dilakukan oleh Finance Admin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Payables */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4" style={{ borderColor: ceoTheme.accent }}>
            <div className="flex items-center justify-between mb-4">
              <BanknotesIcon className="h-8 w-8" style={{ color: ceoTheme.accent }} />
              <ChartBarIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Payables</h3>
            <p className="text-3xl font-bold text-gray-900">{summary.totalPayables}</p>
            <p className="text-sm text-gray-600 mt-1">{formatCurrency(summary.totalAmount)}</p>
          </div>

          {/* Paid */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Lunas</h3>
            <p className="text-3xl font-bold text-green-900">{summary.paid.count}</p>
            <p className="text-sm text-green-600 font-semibold mt-1">
              {formatCurrency(summary.paid.amount)}
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
              {formatCurrency(summary.pending.amount)}
            </p>
          </div>

          {/* Overdue */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-red-500">
            <div className="flex items-center justify-between mb-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Overdue</h3>
            <p className="text-3xl font-bold text-red-900">{summary.overdue.count}</p>
            <p className="text-sm text-red-600 font-semibold mt-1">
              {formatCurrency(summary.overdue.amount)}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Payables Table */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ backgroundColor: ceoTheme.light }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: ceoTheme.primary }}>
                📋 Payables Terbaru
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  className="flex items-center gap-2 px-3 py-2 border-2 border-amber-300 rounded-lg hover:bg-amber-50 transition-all disabled:opacity-50"
                  title="Refresh data"
                >
                  <ArrowPathIcon className={`h-5 w-5 text-amber-700 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-amber-300 rounded-lg hover:bg-amber-50 transition-all"
                >
                  <FunnelIcon className="h-5 w-5 text-amber-700" />
                  <span className="text-sm font-medium text-amber-900">Filter</span>
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting || payables.length === 0}
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
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                {['All', 'PENDING', 'APPROVED', 'PAID', 'OVERDUE'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status === 'PENDING' ? 'Pending' : status === 'APPROVED' ? 'Pending' : status === 'PAID' ? 'Paid' : status === 'OVERDUE' ? 'Overdue' : 'All');
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      (status === 'All' ? statusFilter === 'All' : statusFilter === (status === 'PENDING' ? 'Pending' : status === 'APPROVED' ? 'Pending' : status === 'PAID' ? 'Paid' : status === 'OVERDUE' ? 'Overdue' : 'All'))
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
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-600"></div>
              </div>
            ) : filteredPayables.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>📭 Tidak ada payables untuk ditampilkan</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-amber-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                      Vendor Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                      Jatuh Tempo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                      Terbayar
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
                  {filteredPayables.map((payable) => (
                    <tr key={payable.id} className="hover:bg-amber-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <BanknotesIcon className="w-5 h-5 text-amber-600" />
                          <span className="text-sm font-semibold text-gray-900">
                            {payable.vendor_invoice_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{payable.vendor_name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(payable.total_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{payable.due_date}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(payable.paid_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(payable.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedPayable(payable)}
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
            )}
          </div>
        </div>
      </div>

      {/* Payment Performance */}
      <div className="px-6 py-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg border border-amber-200">
          <h3 className="font-semibold text-amber-900 mb-3">📊 Performa Pembayaran</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-amber-700">Payment Rate</p>
              <p className="text-2xl font-bold text-amber-900">
                {summary.totalPayables > 0 ? ((summary.paid.count / summary.totalPayables) * 100).toFixed(0) : 0}%
              </p>
            </div>
            <div>
              <p className="text-sm text-amber-700">Total Paid</p>
              <p className="text-2xl font-bold text-amber-900">
                {formatCurrency(summary.paid.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-amber-700">Total Outstanding</p>
              <p className="text-2xl font-bold text-amber-900">
                {formatCurrency(summary.pending.amount + summary.overdue.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-amber-700">Overdue Rate</p>
              <p className="text-2xl font-bold text-red-900">
                {summary.totalPayables > 0 ? ((summary.overdue.count / summary.totalPayables) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPayable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: ceoTheme.light }}>
              <h3 className="text-xl font-bold" style={{ color: ceoTheme.primary }}>
                Detail Payable
              </h3>
              <button
                onClick={() => setSelectedPayable(null)}
                className="p-2 hover:bg-amber-200 rounded-lg transition-all"
              >
                <XMarkIcon className="h-6 w-6 text-amber-900" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Vendor Invoice Number</p>
                  <p className="text-lg font-bold text-gray-900">{selectedPayable.vendor_invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vendor</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedPayable.vendor_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Invoice Date</p>
                  <p className="text-lg font-medium text-gray-900">{selectedPayable.invoice_date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="text-lg font-medium text-gray-900">{selectedPayable.due_date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(selectedPayable.total_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid Amount</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedPayable.paid_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(selectedPayable.remaining_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPayable.status)}</div>
                </div>
                {selectedPayable.vendor_phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-lg font-medium text-gray-900">{selectedPayable.vendor_phone}</p>
                  </div>
                )}
                {selectedPayable.vendor_email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-lg font-medium text-gray-900 truncate">{selectedPayable.vendor_email}</p>
                  </div>
                )}
              </div>
              {selectedPayable.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{selectedPayable.description}</p>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => navigate('/payables')}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all"
                >
                  Go to Payables Page
                </button>
                <button
                  onClick={() => setSelectedPayable(null)}
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

export default CEOPayablesMonitor;
