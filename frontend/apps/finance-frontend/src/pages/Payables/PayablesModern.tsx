import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid, BanknotesIcon as BanknotesSolid } from '@heroicons/react/24/solid';
import THEME from '../../config/theme';

// Import Modal Components
import CreatePayableModal from '../../components/Payables/CreatePayableModal';
import EditPayableModal from '../../components/Payables/EditPayableModal';
import PayableDetailModal from '../../components/Payables/PayableDetailModal';
import PaymentModal from '../../components/Payables/PaymentModal';
import VoiceCommandWidget from '../../components/VoiceCommandWidget';

interface PayableItem {
  id: string;
  vendor_invoice_number: string;
  invoice_date: string;
  due_date: string;
  vendor_name: string;
  vendor_npwp?: string;
  description: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  payable_type?: 'PO' | 'OPERATIONAL' | 'PROJECT';
  po_id?: string;
  project_id?: string;
  created_at?: string;
}

const PayablesModern: React.FC = () => {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_FINANCE_API || 'http://localhost:3002/api';

  // Data States
  const [payables, setPayables] = useState<PayableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'vendor'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<PayableItem | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');

  // Fetch Data
  useEffect(() => {
    fetchPayables();
  }, []);

  const fetchPayables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/payables`);
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setPayables(result.data);
      } else {
        setPayables([]);
      }
    } catch (error) {
      console.error('Error fetching payables:', error);
      setPayables([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchPayables();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Voice Command Handler
  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    console.log('🎤 Voice Command received:', command);
    setVoiceTranscript(command);

    // Setujui / Approve
    if (lowerCommand.includes('setujui') || lowerCommand.includes('approve')) {
      if (selectedPayable && selectedPayable.status === 'PENDING') {
        handleApprove(selectedPayable.id);
      } else {
        alert('⚠️ Pilih payable dengan status PENDING terlebih dahulu');
      }
      return;
    }

    // Tolak / Reject
    if (lowerCommand.includes('tolak') || lowerCommand.includes('reject') || lowerCommand.includes('cancel')) {
      if (selectedPayable) {
        handleDelete(selectedPayable);
      } else {
        alert('⚠️ Pilih payable terlebih dahulu');
      }
      return;
    }

    // Filter Paid
    if (lowerCommand.includes('paid') || lowerCommand.includes('lunas') || lowerCommand.includes('bayar')) {
      setStatusFilter('PAID');
      setCurrentPage(1);
      return;
    }

    // Filter Pending
    if (lowerCommand.includes('pending') || lowerCommand.includes('belum')) {
      setStatusFilter('PENDING');
      setCurrentPage(1);
      return;
    }

    // Filter Approved
    if (lowerCommand.includes('approved') || lowerCommand.includes('disetujui')) {
      setStatusFilter('APPROVED');
      setCurrentPage(1);
      return;
    }

    // Export / Download
    if (lowerCommand.includes('export') || lowerCommand.includes('unduh') || lowerCommand.includes('download')) {
      handleExport();
      return;
    }

    // Lihat Detail
    if (lowerCommand.includes('detail') || lowerCommand.includes('lihat')) {
      if (selectedPayable) {
        setShowDetailModal(true);
      } else if (paginatedPayables.length > 0) {
        setSelectedPayable(paginatedPayables[0]);
        setShowDetailModal(true);
      } else {
        alert('⚠️ Tidak ada payable untuk ditampilkan');
      }
      return;
    }

    // Refresh
    if (lowerCommand.includes('refresh') || lowerCommand.includes('muat ulang') || lowerCommand.includes('reload')) {
      refreshData();
      return;
    }

    // Dashboard
    if (lowerCommand.includes('dashboard') || lowerCommand.includes('beranda')) {
      navigate('/dashboard');
      return;
    }

    // Laporan
    if (lowerCommand.includes('laporan') || lowerCommand.includes('report')) {
      navigate('/reports');
      return;
    }

    // Bantuan
    if (lowerCommand.includes('bantuan') || lowerCommand.includes('help') || lowerCommand.includes('perintah')) {
      alert(
        '🎤 Perintah Voice Command:\n\n' +
        '✓ "Setujui" / "Approve" - Approve payable yang dipilih\n' +
        '✓ "Tolak" / "Reject" - Cancel payable yang dipilih\n' +
        '✓ "Filter Paid" - Tampilkan yang sudah lunas\n' +
        '✓ "Filter Pending" - Tampilkan yang pending\n' +
        '✓ "Export" / "Unduh" - Download data\n' +
        '✓ "Lihat Detail" - Buka detail payable\n' +
        '✓ "Refresh" - Muat ulang data\n' +
        '✓ "Dashboard" / "Laporan" - Navigasi\n' +
        '✓ "Bantuan" - Tampilkan bantuan ini'
      );
      return;
    }

    // Unknown command
    alert(`⚠️ Perintah "${command}" tidak dikenali. Ucapkan "Bantuan" untuk melihat daftar perintah.`);
  };

  // Approve Handler
  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/payables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      
      if (response.ok) {
        alert('✅ Payable berhasil di-approve!');
        await refreshData();
      }
    } catch (error) {
      console.error('Error approving payable:', error);
      alert('❌ Gagal approve payable');
    }
  };

  // Export Handler
  const handleExport = () => {
    console.log('📥 Exporting payables data...');
    const csv = [
      ['Vendor', 'Invoice', 'Amount', 'Status', 'Due Date'].join(','),
      ...filteredPayables.map(p => 
        [p.vendor_name, p.vendor_invoice_number, p.total_amount, p.status, p.due_date].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payables-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    alert('✅ Data berhasil di-export!');
  };

  // Filtering & Sorting
  const filteredPayables = useMemo(() => {
    let filtered = [...payables];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.vendor_name?.toLowerCase().includes(query) ||
        p.vendor_invoice_number?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.vendor_npwp?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(p => p.payable_type === typeFilter);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'amount':
          comparison = a.total_amount - b.total_amount;
          break;
        case 'vendor':
          comparison = (a.vendor_name || '').localeCompare(b.vendor_name || '');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [payables, searchQuery, statusFilter, typeFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredPayables.length / itemsPerPage);
  const paginatedPayables = filteredPayables.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary
  const summary = useMemo(() => {
    return {
      total: payables.reduce((sum, p) => sum + (p.total_amount || 0), 0),
      pending: payables.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + (p.remaining_amount || p.total_amount || 0), 0),
      overdue: payables.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + (p.remaining_amount || 0), 0),
      paid: payables.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.paid_amount || 0), 0),
      count: payables.length,
    };
  }, [payables]);

  // Utility Functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: any }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: ClockIcon },
      APPROVED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircleIcon },
      PAID: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleSolid },
      OVERDUE: { bg: 'bg-red-100', text: 'text-red-800', icon: ExclamationTriangleIcon },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XMarkIcon },
    };
    
    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {status}
      </span>
    );
  };

  const getDaysUntilDue = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  // CRUD Handlers
  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleEdit = (payable: PayableItem) => {
    setSelectedPayable(payable);
    setShowEditModal(true);
  };

  const handleDelete = (payable: PayableItem) => {
    setSelectedPayable(payable);
    setShowDeleteModal(true);
  };

  const handleViewDetail = (payable: PayableItem) => {
    setSelectedPayable(payable);
    setShowDetailModal(true);
  };

  const handlePayment = (payable: PayableItem) => {
    setSelectedPayable(payable);
    setShowPaymentModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedPayable) return;
    
    try {
      const response = await fetch(`${API_BASE}/payables/${selectedPayable.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setPayables(prev => prev.filter(p => p.id !== selectedPayable.id));
        setShowDeleteModal(false);
        setSelectedPayable(null);
      } else {
        alert('Gagal menghapus payable');
      }
    } catch (error) {
      console.error('Error deleting payable:', error);
      alert('Terjadi kesalahan saat menghapus');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 px-8 py-10">
            <div className="flex items-center gap-4 mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                <BanknotesSolid className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-1">
                  Manajemen Hutang Usaha
                </h1>
                <p className="text-blue-100 text-lg font-medium">
                  💼 Kelola pembayaran ke vendor dengan mudah dan efisien
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 text-white transform hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <DocumentTextIcon className="w-7 h-7" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-90">Total Hutang</p>
                <p className="text-3xl font-black mt-1">{summary.count}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-white/20">
              <p className="text-2xl font-bold">{formatCurrency(summary.total)}</p>
              <p className="text-xs opacity-75 mt-1">Total keseluruhan</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 text-white transform hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <ClockIcon className="w-7 h-7" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-90">Pending</p>
                <p className="text-3xl font-black mt-1">
                  {payables.filter(p => p.status === 'PENDING').length}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-white/20">
              <p className="text-2xl font-bold">{formatCurrency(summary.pending)}</p>
              <p className="text-xs opacity-75 mt-1">Menunggu persetujuan</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 text-white transform hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <ExclamationTriangleIcon className="w-7 h-7" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-90">Overdue</p>
                <p className="text-3xl font-black mt-1">
                  {payables.filter(p => p.status === 'OVERDUE').length}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-white/20">
              <p className="text-2xl font-bold">{formatCurrency(summary.overdue)}</p>
              <p className="text-xs opacity-75 mt-1">Jatuh tempo</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 text-white transform hover:scale-105 duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <CheckCircleSolid className="w-7 h-7" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-90">Terbayar</p>
                <p className="text-3xl font-black mt-1">
                  {payables.filter(p => p.status === 'PAID').length}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-white/20">
              <p className="text-2xl font-bold">{formatCurrency(summary.paid)}</p>
              <p className="text-xs opacity-75 mt-1">Sudah lunas</p>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari vendor, invoice, atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
            >
              <option value="ALL">Semua Tipe</option>
              <option value="PO">Purchase Order</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="PROJECT">Project</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [by, order] = e.target.value.split('-');
                setSortBy(by as any);
                setSortOrder(order as any);
              }}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-medium"
            >
              <option value="date-desc">Terbaru</option>
              <option value="date-asc">Terlama</option>
              <option value="amount-desc">Nilai Tertinggi</option>
              <option value="amount-asc">Nilai Terendah</option>
              <option value="vendor-asc">Vendor A-Z</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">Refresh</span>
            </button>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5" />
              Tambah Hutang
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Memuat data...</p>
              </div>
            </div>
          ) : filteredPayables.length === 0 ? (
            <div className="text-center py-20">
              <DocumentTextIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-bold text-gray-600 mb-2">Tidak ada data</p>
              <p className="text-gray-500">Silakan tambah hutang baru atau ubah filter</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Tipe
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Terbayar
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Sisa
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedPayables.map((payable, index) => {
                      const daysUntilDue = getDaysUntilDue(payable.due_date);
                      const isOverdueSoon = daysUntilDue <= 7 && daysUntilDue > 0;
                      
                      return (
                        <tr
                          key={payable.id}
                          className={`hover:bg-blue-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">
                                  {payable.vendor_invoice_number}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {payable.description?.substring(0, 30)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-gray-900">
                              {payable.vendor_name}
                            </p>
                            {payable.vendor_npwp && (
                              <p className="text-xs text-gray-500">NPWP: {payable.vendor_npwp}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              payable.payable_type === 'PO'
                                ? 'bg-purple-100 text-purple-800'
                                : payable.payable_type === 'OPERATIONAL'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-cyan-100 text-cyan-800'
                            }`}>
                              {payable.payable_type || 'PO'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">
                                {formatDate(payable.invoice_date)}
                              </p>
                              <p className={`text-xs flex items-center gap-1 mt-1 ${
                                payable.status === 'OVERDUE'
                                  ? 'text-red-600 font-bold'
                                  : isOverdueSoon
                                  ? 'text-yellow-600 font-semibold'
                                  : 'text-gray-500'
                              }`}>
                                <CalendarDaysIcon className="w-3.5 h-3.5" />
                                {formatDate(payable.due_date)}
                                {isOverdueSoon && ` (${daysUntilDue} hari lagi)`}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold text-gray-900">
                              {formatCurrency(payable.total_amount)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {formatCurrency(payable.paid_amount)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className={`text-sm font-bold ${
                              payable.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {formatCurrency(payable.remaining_amount)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(payable.status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewDetail(payable)}
                                className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                                title="Lihat Detail"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              
                              {payable.status !== 'PAID' && (
                                <>
                                  <button
                                    onClick={() => handlePayment(payable)}
                                    className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                                    title="Bayar"
                                  >
                                    <BanknotesIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(payable)}
                                    className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <PencilSquareIcon className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              
                              <button
                                onClick={() => handleDelete(payable)}
                                className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredPayables.length)} dari {filteredPayables.length} data
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg bg-white border-2 border-gray-200 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                      </button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                              currentPage === page
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white border-2 border-gray-200 hover:border-blue-500'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg bg-white border-2 border-gray-200 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedPayable && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Konfirmasi Hapus</h3>
                <p className="text-gray-600">
                  Apakah Anda yakin ingin menghapus payable ini?
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {selectedPayable.vendor_invoice_number}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedPayable.vendor_name}
                </p>
                <p className="text-lg font-bold text-red-600 mt-2">
                  {formatCurrency(selectedPayable.total_amount)}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPayable(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        <CreatePayableModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={refreshData}
          apiBase={API_BASE}
        />

        {/* Detail Modal */}
        <PayableDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          payable={selectedPayable}
          onPayment={() => {
            setShowDetailModal(false);
            setShowPaymentModal(true);
          }}
        />

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          payable={selectedPayable}
          onSuccess={refreshData}
          apiBase={API_BASE}
        />

        {/* Edit Modal */}
        <EditPayableModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPayable(null);
          }}
          payable={selectedPayable}
          onSuccess={refreshData}
          apiBase={API_BASE}
        />

        {/* Voice Command Widget */}
        <VoiceCommandWidget onCommand={handleVoiceCommand} />
      </div>
    </div>
  );
};

export default PayablesModern;
