import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
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

interface InvoiceItem {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  invoice_date: string;
  due_date: string;
  customer_phone?: string;
  customer_email?: string;
  payment_terms?: string;
  notes?: string;
}

const CEOInvoiceMonitor: React.FC = () => {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_FINANCE_API || 'http://localhost:3002/api';
  
  // State Management
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    paid: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
    overdue: { count: 0, amount: 0 },
  });
  const [avgDSO, setAvgDSO] = useState(0);

  // CEO theme
  const ceoTheme = {
    primary: '#7C2D12',
    secondary: '#92400E',
    accent: '#D97706',
    light: '#FEF3C7',
  };

  // Fetch invoices from API
  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      console.log('📡 Fetching invoices from API...');
      const response = await fetch(`${API_BASE}/invoices`);
      if (response.ok) {
        const data = await response.json();
        const invoiceArray = data.data || data || [];
        console.log('✅ Invoices loaded:', invoiceArray.length);
        
        // Transform data
        const transformed = invoiceArray.map((inv: any) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          customer_name: inv.customer_name,
          total_amount: parseFloat(inv.total_amount) || 0,
          paid_amount: parseFloat(inv.paid_amount) || 0,
          remaining_amount: parseFloat(inv.remaining_amount) || parseFloat(inv.total_amount) || 0,
          status: inv.status || 'DRAFT',
          invoice_date: inv.invoice_date?.split('T')[0] || inv.invoice_date,
          due_date: inv.due_date?.split('T')[0] || inv.due_date,
          customer_phone: inv.customer_phone,
          customer_email: inv.customer_email,
          payment_terms: inv.payment_terms,
          notes: inv.notes,
        }));
        
        setInvoices(transformed);
        calculateSummary(transformed);
      }
    } catch (error) {
      console.error('❌ Error fetching invoices:', error);
      alert('❌ Error fetching invoices. Make sure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary data
  const calculateSummary = (invoiceList: InvoiceItem[]) => {
    const total = invoiceList.length;
    const totalAmount = invoiceList.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    
    const paidInvoices = invoiceList.filter(inv => inv.status === 'PAID' || inv.paid_amount === inv.total_amount);
    const paidCount = paidInvoices.length;
    const paidAmount = paidInvoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
    
    const overdueInvoices = invoiceList.filter(inv => inv.status === 'OVERDUE');
    const overdueCount = overdueInvoices.length;
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.remaining_amount || 0), 0);
    
    const pendingCount = total - paidCount - overdueCount;
    const pendingAmount = totalAmount - paidAmount - overdueAmount;
    
    setSummary({
      totalInvoices: total,
      totalAmount: totalAmount,
      paid: { count: paidCount, amount: paidAmount },
      pending: { count: pendingCount, amount: pendingAmount },
      overdue: { count: overdueCount, amount: overdueAmount },
    });
    
    // Calculate DSO
    if (total > 0) {
      const daysOutstanding = invoiceList.reduce((sum, inv) => {
        const dueDate = new Date(inv.due_date);
        const today = new Date();
        return sum + Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      }, 0);
      setAvgDSO(Math.round(daysOutstanding / total));
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInvoices();
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
      
      console.log('🎤 CEOInvoiceMonitor received voice command:', command);
      
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
        alert('🔄 Memuat ulang data invoice...');
        window.location.reload();
      }
      // View first invoice
      else if (command.includes('lihat detail') || command.includes('view detail')) {
        if (invoices.length > 0) {
          setSelectedInvoice(invoices[0]);
          alert(`👁️ Menampilkan detail: ${invoices[0].invoice_number}`);
        } else {
          alert('❌ Tidak ada invoice untuk ditampilkan');
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
    if (statusUpper === 'SENT' || statusUpper === 'PENDING') {
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
    if (statusUpper === 'DRAFT') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          <DocumentTextIcon className="w-4 h-4 mr-1" />
          Draft
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
    if (filteredInvoices.length === 0) {
      alert('⚠️ Tidak ada data untuk di-export');
      return;
    }

    setIsExporting(true);
    try {
      // Create export data
      const exportData = filteredInvoices.map(inv => ({
        'Invoice Number': inv.invoice_number,
        'Customer': inv.customer_name,
        'Invoice Date': inv.invoice_date,
        'Due Date': inv.due_date,
        'Total Amount': inv.total_amount,
        'Paid Amount': inv.paid_amount,
        'Remaining Amount': inv.remaining_amount,
        'Status': inv.status,
        'Contact': inv.customer_phone || '-',
        'Email': inv.customer_email || '-',
      }));

      // Create Excel file
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
      
      // Format columns
      ws['!cols'] = [
        { wch: 18 }, // Invoice Number
        { wch: 25 }, // Customer
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
      const fileName = `Invoice_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  // Get status as enum for filtering
  const mapStatusForFilter = (status: string): string => {
    if (status === 'Paid' || status === 'PAID') return 'PAID';
    if (status === 'Pending' || status === 'SENT') return 'SENT';
    if (status === 'Overdue' || status === 'OVERDUE') return 'OVERDUE';
    return status;
  };

  const filteredInvoices = statusFilter === 'All' 
    ? invoices 
    : invoices.filter(inv => {
        const mappedFilter = mapStatusForFilter(statusFilter);
        return mapStatusForFilter(inv.status) === mappedFilter;
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
            <DocumentTextIcon className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">📄 Monitoring Invoice & Piutang</h1>
            <p className="text-amber-100 mt-1">
              Pemantauan status invoice dan piutang perusahaan
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
                Anda dapat melihat status invoice. Operasional CRUD dilakukan oleh Finance Admin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Invoices */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4" style={{ borderColor: ceoTheme.accent }}>
            <div className="flex items-center justify-between mb-4">
              <DocumentTextIcon className="h-8 w-8" style={{ color: ceoTheme.accent }} />
              <ChartBarIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Invoice</h3>
            <p className="text-3xl font-bold text-gray-900">{summary.totalInvoices}</p>
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

      {/* Recent Invoices Table */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b" style={{ backgroundColor: ceoTheme.light }}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: ceoTheme.primary }}>
                📋 Invoice Terbaru
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
                  disabled={isExporting || invoices.length === 0}
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
                {['All', 'PAID', 'SENT', 'OVERDUE', 'DRAFT'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status === 'SENT' ? 'Pending' : status === 'PAID' ? 'Paid' : status === 'OVERDUE' ? 'Overdue' : 'All');
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      (status === 'All' ? statusFilter === 'All' : statusFilter === (status === 'SENT' ? 'Pending' : status === 'PAID' ? 'Paid' : status === 'OVERDUE' ? 'Overdue' : 'All'))
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
            ) : filteredInvoices.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>📭 Tidak ada invoice untuk ditampilkan</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-amber-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                      Invoice Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">
                      Customer
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
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-amber-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="w-5 h-5 text-amber-600" />
                          <span className="text-sm font-semibold text-gray-900">
                            {invoice.invoice_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{invoice.customer_name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(invoice.total_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{invoice.due_date}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(invoice.paid_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
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

      {/* Collection Performance */}
      <div className="px-6 py-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg border border-amber-200">
          <h3 className="font-semibold text-amber-900 mb-3">📊 Performa Penagihan</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-amber-700">Collection Rate</p>
              <p className="text-2xl font-bold text-amber-900">
                {summary.totalInvoices > 0 ? ((summary.paid.count / summary.totalInvoices) * 100).toFixed(0) : 0}%
              </p>
            </div>
            <div>
              <p className="text-sm text-amber-700">Days Sales Outstanding</p>
              <p className="text-2xl font-bold text-amber-900">{avgDSO} hari</p>
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
                {summary.totalInvoices > 0 ? ((summary.overdue.count / summary.totalInvoices) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ backgroundColor: ceoTheme.light }}>
              <h3 className="text-xl font-bold" style={{ color: ceoTheme.primary }}>
                Detail Invoice
              </h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 hover:bg-amber-200 rounded-lg transition-all"
              >
                <XMarkIcon className="h-6 w-6 text-amber-900" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="text-lg font-bold text-gray-900">{selectedInvoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedInvoice.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Invoice Date</p>
                  <p className="text-lg font-medium text-gray-900">{selectedInvoice.invoice_date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="text-lg font-medium text-gray-900">{selectedInvoice.due_date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Invoiced</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(selectedInvoice.total_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid Amount</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(selectedInvoice.paid_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Remaining</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(selectedInvoice.remaining_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                {selectedInvoice.customer_phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-lg font-medium text-gray-900">{selectedInvoice.customer_phone}</p>
                  </div>
                )}
                {selectedInvoice.customer_email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-lg font-medium text-gray-900 truncate">{selectedInvoice.customer_email}</p>
                  </div>
                )}
              </div>
              {selectedInvoice.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded">{selectedInvoice.notes}</p>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => navigate('/invoices')}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all"
                >
                  Go to Invoice Page
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
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

export default CEOInvoiceMonitor;
