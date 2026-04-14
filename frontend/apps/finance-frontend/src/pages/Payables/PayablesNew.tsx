import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import THEME from '../../config/theme';

interface PayableItem {
  id: string;
  vendor_invoice_number: string;
  invoice_date: string;
  due_date: string;
  vendor_name: string;
  vendor_npwp: string;
  description: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  payable_type?: 'PO' | 'OPERATIONAL' | 'PROJECT';
  po_id?: string;
  project_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PaymentData {
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  payment_reference: string;
  bank_account: string;
  notes: string;
}

const PayablesManagementNew: React.FC = () => {
  const navigate = useNavigate();
  
  // State Management
  const [payables, setPayables] = useState<PayableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal States
  const [showInputForm, setShowInputForm] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  
  // Selection States
  const [selectedPayableType, setSelectedPayableType] = useState<'PO' | 'OPERATIONAL' | 'PROJECT' | null>(null);
  const [selectedPayable, setSelectedPayable] = useState<PayableItem | null>(null);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachUploading, setAttachUploading] = useState(false);
  
  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'vendor'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'PO' | 'OPERATIONAL' | 'PROJECT'>('PO');

  
  const API_BASE = import.meta.env.VITE_FINANCE_API || 'http://localhost:3002/api';

  // Fetch payables from backend
  useEffect(() => {
    fetchPayables();
  }, []);

  const fetchPayables = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/payables`);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        setPayables([]);
        return;
      }
      
      const result = await response.json();
      if (result.success) {
        setPayables(result.data || []);
      } else {
        console.error('Failed to fetch payables:', result.message);
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
    setRefreshing(false);
  };

  // Filtered and Sorted Data
  const filteredPayables = useMemo(() => {
    let filtered = [...payables];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vendor_invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(p => p.payable_type === typeFilter);
    }

    // Sorting
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
          comparison = a.vendor_name.localeCompare(b.vendor_name);
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

  // Summary Calculations
  const summary = useMemo(() => {
    return {
      total: payables.reduce((sum, p) => sum + (p.total_amount || 0), 0),
      pending: payables.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + (p.total_amount || 0), 0),
      overdue: payables.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + (p.remaining_amount || 0), 0),
      paid: payables.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.paid_amount || 0), 0),
      count: payables.length,
      pendingCount: payables.filter(p => p.status === 'PENDING').length,
      overdueCount: payables.filter(p => p.status === 'OVERDUE').length,
      paidCount: payables.filter(p => p.status === 'PAID').length,
    };
  }, [payables]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyCompact = (amount: number) => {
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(amount);
    } catch (e) {
      return formatCurrency(amount);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'APPROVED':
        return 'bg-primary-light text-primary-dark border border-primary-light';
      case 'PAID':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Menunggu',
      APPROVED: 'Disetujui',
      PAID: 'Lunas',
      OVERDUE: 'Jatuh Tempo',
    };
    return labels[status] || status;
  };

  const handlePayment = (payable: PayableItem) => {
    // Redirect to Payment Gateway page (like Tokopedia checkout)
    navigate(`/finance/payment/${payable.id}`);
  };

  const handleViewDetail = (payable: PayableItem) => {
    setSelectedPayable(payable);
    setShowDetailModal(true);
  };

  const openAttachModal = (payable: PayableItem) => {
    setSelectedPayable(payable);
    setAttachFile(null);
    setShowAttachModal(true);
  };

  const handleAttachFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setAttachFile(f);
  };

  const handleSubmitAttach = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPayable) return alert('No payable selected');
    if (!attachFile) return alert('Pilih file terlebih dahulu');

    setAttachUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', attachFile);
      fd.append('related_type', 'payable');
      fd.append('related_id', selectedPayable.id);
      fd.append('description', `Attached to payable ${selectedPayable.vendor_invoice_number}`);
      // Choose document_type so repository categories/counts update immediately
      const docType = selectedPayable.payable_type === 'PO' ? 'po' : selectedPayable.payable_type === 'PROJECT' ? 'wo' : 'po';
      fd.append('document_type', docType);

      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `${res.status}`);
      }

      const json = await res.json();
      alert('Dokumen berhasil diupload dan dilampirkan.');
      setShowAttachModal(false);
      setAttachFile(null);
      // optionally refresh lists
      fetchPayables();
    } catch (err: any) {
      console.error('Attach upload failed', err);
      alert('Upload gagal: ' + (err?.message || err));
    } finally {
      setAttachUploading(false);
    }
  };

  const handleSubmitManualPayable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const totalAmount = Number(formData.get('total_amount'));
    const subtotal = totalAmount / 1.11; // Reverse calculate subtotal
    
    const description = formData.get('description') as string;
    const typePrefix = selectedPayableType === 'PO' ? '[PO] ' : selectedPayableType === 'OPERATIONAL' ? '[OPERATIONAL] ' : '[PROJECT] ';

    // Determine vendor_invoice_number: if empty or non-PO type, auto-generate a unique one
    let vendorInvoice = (formData.get('vendor_invoice_number') as string) || '';
    if (!vendorInvoice || (selectedPayableType && selectedPayableType !== 'PO')) {
      const stamp = Date.now();
      if (selectedPayableType === 'OPERATIONAL') vendorInvoice = `OP-${stamp}`;
      else if (selectedPayableType === 'PROJECT') vendorInvoice = `PRJ-${stamp}`;
      else vendorInvoice = `INV-${stamp}`;
    }

    const payableData = {
      vendor_name: formData.get('vendor_name') as string,
      vendor_npwp: formData.get('vendor_npwp') as string || '',
      vendor_invoice_number: vendorInvoice,
      invoice_date: formData.get('invoice_date') as string,
      due_date: formData.get('due_date') as string,
      description: typePrefix + description,
      total_amount: totalAmount,
      po_id: selectedPayableType === 'PO' && formData.get('po_reference') 
        ? formData.get('po_reference') as string 
        : selectedPayableType === 'OPERATIONAL' ? 'OP-' + Date.now() : 'PRJ-' + Date.now(),
      notes: `Type: ${selectedPayableType}${selectedPayableType === 'PROJECT' && formData.get('project_reference') ? ', Project: ' + formData.get('project_reference') : ''}`,
      items: [
        {
          description: description,
          quantity: 1,
          unit_price: subtotal,
          total: subtotal,
        }
      ]
    };

    try {
      const response = await fetch(`${API_BASE}/payables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payableData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('✅ Payable berhasil dibuat!');
        setShowInputForm(false);
        setShowTypeSelection(false);
        setSelectedPayableType(null);
        form.reset();
        // Optimistically prepend created payable so it appears immediately
        try {
          setPayables(prev => [result.data, ...prev]);
        } catch (e) {
          // fallback to full refresh
          fetchPayables();
        }
      } else {
        // Handle duplicate vendor invoice number (409) with retry option
        const msg = result?.message || 'Unknown error';
        if (response.status === 409 || /vendor_invoice_number|already exists|duplicate/i.test(msg)) {
          const tryAuto = window.confirm('Nomor invoice sudah ada. Tambahkan timestamp ke nomor invoice dan coba lagi?');
          if (tryAuto) {
            // Append timestamp to create a unique vendor_invoice_number and retry once
            payableData.vendor_invoice_number = (payableData.vendor_invoice_number || 'INV') + '-' + Date.now();
            try {
              const retryRes = await fetch(`${API_BASE}/payables`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payableData),
              });
              const retryResult = await retryRes.json();
              if (retryRes.ok && retryResult.success) {
                alert('✅ Payable berhasil dibuat (dengan nomor invoice unik)!');
                setShowInputForm(false);
                setShowTypeSelection(false);
                setSelectedPayableType(null);
                form.reset();
                try {
                  setPayables(prev => [retryResult.data, ...prev]);
                } catch (e) {
                  fetchPayables();
                }
                return;
              }
              alert(`âŒ Gagal membuat payable setelah retry: ${retryResult?.message || 'Unknown error'}`);
              return;
            } catch (err: any) {
              console.error('Retry error creating payable:', err);
              alert('âŒ Gagal saat mencoba ulang: ' + err?.message);
              return;
            }
          }
        }
        alert(`âŒ Gagal membuat payable: ${msg}`);
      }
    } catch (error: any) {
      console.error('Error creating payable:', error);
      alert('âŒ Gagal menghubungi server: ' + error.message);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    if (!selectedPayable) return;

    console.log('ðŸ’° Processing payment with file upload...');
    console.log('ðŸ“ API URL:', `${API_BASE}/payables/${selectedPayable.id}/payments`);

    // Log FormData contents for debugging
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
    }

    try {
      // Send FormData directly (no JSON, no Content-Type header - browser sets it with boundary)
      const response = await fetch(`${API_BASE}/payables/${selectedPayable.id}/payments`, {
        method: 'POST',
        body: formData // Send FormData as-is
      });

      console.log('ðŸ“¥ Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        alert(`âŒ Gagal memproses pembayaran!\n\nHTTP Error: ${response.status} ${response.statusText}\n\n${errorText}\n\nPastikan Finance Service berjalan di ${API_BASE}`);
        return;
      }
      
      const result = await response.json();
      console.log('ðŸ“¥ Response data:', result);
      
      if (result.success) {
        const amount = parseFloat(formData.get('amount') as string);
        const paymentMethod = formData.get('payment_method') as string;
        const proofFile = formData.get('payment_proof') as File;
        
        alert('✅ Pembayaran berhasil dicatat!\n\nDetail:\n- Jumlah: ' + formatCurrency(amount) + '\n- Metode: ' + paymentMethod + '\n- Bukti: ' + (proofFile ? proofFile.name : 'Tidak ada') + '\n- Status: LUNAS âœ“');
        setShowPaymentModal(false);
        fetchPayables(); // Refresh data
      } else {
        alert('âŒ Gagal memproses pembayaran!\n\nError: ' + (result.message || 'Unknown error') + '\n\nSilakan cek console untuk detail.');
      }
    } catch (error: any) {
      console.error('âŒ Error processing payment:', error);
      alert('âŒ Gagal menghubungi server!\n\nError: ' + error.message + '\n\nPastikan Finance Service berjalan di ' + API_BASE);
    }
  };

  // Calculate totals
  const totalPayable = payables.reduce((sum, p) => sum + p.remaining_amount, 0);
  const totalPending = payables.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.remaining_amount, 0);
  const totalOverdue = payables.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.remaining_amount, 0);
  const totalPaid = payables.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.paid_amount, 0);

  // Filter by type - keep all existing data as PO for backward compatibility
  const poPayables = payables.filter(p => 
    p.description?.startsWith('[PO]') || 
    (!p.description?.startsWith('[OPERATIONAL]') && !p.description?.startsWith('[PROJECT]') && 
     !p.po_id?.startsWith('OP-') && !p.po_id?.startsWith('PRJ-'))
  );
  const operationalPayables = payables.filter(p => 
    p.description?.startsWith('[OPERATIONAL]') || 
    p.po_id?.startsWith('OP-')
  );
  const projectPayables = payables.filter(p => 
    p.description?.startsWith('[PROJECT]') || 
    p.po_id?.startsWith('PRJ-')
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#C8A870] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Payables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div style={{ height: 8, backgroundColor: THEME.primary, borderRadius: 6, marginTop: -20 }}></div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div style={{ backgroundColor: THEME.accentSoft, borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CurrencyDollarIcon style={{ width: 32, height: 32, color: THEME.accent }} />
                </div>
                <h1 className="text-3xl font-bold" style={{ color: THEME.primary }}>Manajemen Hutang Usaha</h1>
              </div>
              <p className="text-gray-600 text-lg font-medium">
                 Kelola hutang dan pembayaran ke vendor
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-primary-light/10 rounded-2xl shadow-sm hover:shadow-lg transition p-4 md:p-6 border-2 border-primary-light min-h-[120px] flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-dark mb-2"> Total Hutang</p>
            <div>
              <span className="text-base md:text-lg font-bold text-primary-dark">{formatCurrency(totalPayable)}</span>
            </div>
          </div>
          <p className="text-xs text-primary-dark/70 mt-2">Belum dibayar</p>
        </div>

        <div className="bg-yellow-50 rounded-2xl shadow-sm hover:shadow-lg transition p-4 md:p-6 border-2 border-yellow-200 min-h-[120px] flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-yellow-800 mb-2"> Pending</p>
            <div>
              <span className="text-base md:text-lg font-bold text-yellow-900">{formatCurrency(totalPending)}</span>
            </div>
          </div>
          <p className="text-xs text-yellow-700 mt-2">Menunggu persetujuan</p>
        </div>

        <div className="bg-red-50 rounded-2xl shadow-sm hover:shadow-lg transition p-4 md:p-6 border-2 border-red-200 min-h-[120px] flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-red-800 mb-2"> Overdue</p>
            <div>
              <span className="text-base md:text-lg font-bold text-red-900">{formatCurrency(totalOverdue)}</span>
            </div>
          </div>
          <p className="text-xs text-red-700 mt-2">Jatuh tempo</p>
        </div>

        <div className="bg-green-50 rounded-2xl shadow-sm hover:shadow-lg transition p-4 md:p-6 border-2 border-green-200 min-h-[120px] flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-green-800 mb-2"> Terbayar</p>
            <div>
              <span className="text-base md:text-lg font-bold text-green-900">{formatCurrency(totalPaid)}</span>
            </div>
          </div>
          <p className="text-xs text-green-700 mt-2">Sudah lunas</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 border border-blue-200">
        <div className="flex gap-4">
          <button
            onClick={() => setShowTypeSelection(true)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
          >
            ➕ Input Payable Manual
          </button>
          <button
            onClick={() => setShowCSVUpload(true)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
          >
            📤 Upload CSV
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <FunnelIcon className="w-6 h-6 text-blue-600" />
          <h3 className="font-bold text-gray-800 text-lg">🔍 Filter berdasarkan Tipe Hutang:</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveTab('PO')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'PO'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-400'
            }`}
          >
            📋 PO <span className="ml-2 font-bold">({poPayables.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('OPERATIONAL')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'OPERATIONAL'
                ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-400'
            }`}
          >
            ⚙️ Operasional <span className="ml-2 font-bold">({operationalPayables.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('PROJECT')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'PROJECT'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-400'
            }`}
          >
            🏗️ Project <span className="ml-2 font-bold">({projectPayables.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ALL' as any)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
              activeTab === 'ALL'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-400'
            }`}
          >
            📊 Semua <span className="ml-2 font-bold">({payables.length})</span>
          </button>
        </div>
      </div>

      {/* Unified Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header dengan title berdasarkan filter */}
        <div className={`px-6 py-4 ${
          activeTab === 'PO' ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
          activeTab === 'OPERATIONAL' ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
          activeTab === 'PROJECT' ? 'bg-gradient-to-r from-purple-600 to-purple-700' :
          'bg-gradient-to-r from-gray-700 to-gray-800'
        }`}>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {activeTab === 'PO' && ' Hutang dari Purchase Order (PO)'}
            {activeTab === 'OPERATIONAL' && ' Hutang Operasional'}
            {activeTab === 'PROJECT' && ' Hutang dari Project'}
            {activeTab === 'ALL' && ' Semua Hutang Usaha'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">No. Ref</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Jatuh Tempo</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Terbayar</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Sisa</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(() => {
                const displayPayables = 
                  activeTab === 'PO' ? poPayables :
                  activeTab === 'OPERATIONAL' ? operationalPayables :
                  activeTab === 'PROJECT' ? projectPayables :
                  payables;

                if (displayPayables.length === 0) {
                  return (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        <p className="text-lg font-semibold mb-2">Tidak ada data hutang</p>
                        <p className="text-sm">Silakan input payable baru</p>
                      </td>
                    </tr>
                  );
                }

                return displayPayables.map((payable) => (
                  <tr key={payable.id} className="hover:bg-gray-50 transition-colors">
                    {/* Tipe Column */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                        payable.description?.startsWith('[PO]') || (!payable.description?.startsWith('[OPERATIONAL]') && !payable.description?.startsWith('[PROJECT]'))
                          ? 'bg-blue-100 text-blue-800'
                          : payable.description?.startsWith('[OPERATIONAL]')
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {payable.description?.startsWith('[PO]') || (!payable.description?.startsWith('[OPERATIONAL]') && !payable.description?.startsWith('[PROJECT]')) ? 'PO' :
                         payable.description?.startsWith('[OPERATIONAL]') ? 'OPS' : 'PRJ'}
                      </span>
                    </td>

                    {/* No. Ref */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{payable.po_id || '-'}</p>
                    </td>

                    {/* Invoice */}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{payable.vendor_invoice_number}</p>
                          <p className="text-xs text-gray-500">{formatDate(payable.invoice_date)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Vendor */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{payable.vendor_name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{payable.description?.replace(/^\[(PO|OPERATIONAL|PROJECT)\]\s*/, '')}</p>
                    </td>

                    {/* Jatuh Tempo */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`flex items-center text-sm ${payable.status === 'OVERDUE' ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                        <CalendarDaysIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                        {formatDate(payable.due_date)}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(payable.total_amount)}</p>
                    </td>

                    {/* Terbayar */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(payable.paid_amount || 0)}</p>
                    </td>

                    {/* Sisa */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <p className={`text-sm font-bold ${payable.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(payable.remaining_amount)}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(payable.status)}`}>
                        {payable.status === 'PAID' && <CheckCircleSolid className="w-3.5 h-3.5 mr-1" />}
                        {payable.status === 'PENDING' && <ClockIcon className="w-3.5 h-3.5 mr-1" />}
                        {payable.status === 'OVERDUE' && <ExclamationTriangleIcon className="w-3.5 h-3.5 mr-1" />}
                        {getStatusLabel(payable.status)}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {payable.status !== 'PAID' && (
                          <button
                            onClick={() => handlePayment(payable)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-bold hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                          >
                            <BanknotesIcon className="w-4 h-4" />
                            Bayar
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetail(payable)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          title="Lihat Detail"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openAttachModal(payable)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                          title="Lampirkan Dokumen"
                        >
                          <DocumentArrowUpIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>

            {/* TOTAL ROW - GRAND TOTAL */}
            <tfoot className="bg-gradient-to-r from-gray-700 to-gray-800 text-white font-bold">
              <tr>
                <td colSpan={5} className="px-4 py-4 text-right text-base">
                  <span className="flex items-center justify-end gap-2">
                    <DocumentTextIcon className="w-5 h-5" />
                    TOTAL KESELURUHAN:
                  </span>
                </td>
                <td className="px-4 py-4 text-right text-base">
                  {formatCurrency(
                    (activeTab === 'PO' ? poPayables :
                     activeTab === 'OPERATIONAL' ? operationalPayables :
                     activeTab === 'PROJECT' ? projectPayables :
                     payables).reduce((sum, p) => sum + p.total_amount, 0)
                  )}
                </td>
                <td className="px-4 py-4 text-right text-base text-green-300">
                  {formatCurrency(
                    (activeTab === 'PO' ? poPayables :
                     activeTab === 'OPERATIONAL' ? operationalPayables :
                     activeTab === 'PROJECT' ? projectPayables :
                     payables).reduce((sum, p) => sum + (p.paid_amount || 0), 0)
                  )}
                </td>
                <td className="px-4 py-4 text-right text-base text-red-300">
                  {formatCurrency(
                    (activeTab === 'PO' ? poPayables :
                     activeTab === 'OPERATIONAL' ? operationalPayables :
                     activeTab === 'PROJECT' ? projectPayables :
                     payables).reduce((sum, p) => sum + p.remaining_amount, 0)
                  )}
                </td>
                <td colSpan={2} className="px-4 py-4 text-center text-sm">
                  {(activeTab === 'PO' ? poPayables :
                    activeTab === 'OPERATIONAL' ? operationalPayables :
                    activeTab === 'PROJECT' ? projectPayables :
                    payables).length} item
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Type Selection Modal */}
      {showTypeSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-primary-dark p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">ðŸ“‹ Pilih Tipe Payable</h2>
                <button onClick={() => setShowTypeSelection(false)} className="text-white hover:text-gray-200">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 mb-6">Pilih jenis hutang yang akan diinput:</p>
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => {
                    setSelectedPayableType('PO');
                    setShowTypeSelection(false);
                    setShowInputForm(true);
                  }}
                  className="flex items-center gap-4 p-6 border-2 border-primary-light rounded-xl hover:border-primary-dark hover:bg-primary-light/10 transition-all text-left">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-primary-dark" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Purchase Order (PO)</h3>
                    <p className="text-sm text-gray-600">Hutang dari pembelian barang/jasa berdasarkan PO</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSelectedPayableType('OPERATIONAL');
                    setShowTypeSelection(false);
                    setShowInputForm(true);
                  }}
                  className="flex items-center gap-4 p-6 border-2 border-orange-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-left"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Pengeluaran Operasional</h3>
                    <p className="text-sm text-gray-600">Hutang untuk biaya operasional perusahaan</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSelectedPayableType('PROJECT');
                    setShowTypeSelection(false);
                    setShowInputForm(true);
                  }}
                  className="flex items-center gap-4 p-6 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Project Expense</h3>
                    <p className="text-sm text-gray-600">Hutang dari project/tender</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Manual Form Modal */}
      {showInputForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="bg-primary-dark p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  âž• Input Payable - {selectedPayableType === 'PO' ? ' Purchase Order' : selectedPayableType === 'OPERATIONAL' ? ' Operasional' : ' Project'}
                </h2>
                <button onClick={() => { setShowInputForm(false); setSelectedPayableType(null); }} className="text-white hover:text-gray-200">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmitManualPayable} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {selectedPayableType === 'PO' && (
                <div className="bg-primary-light/10 border-2 border-primary-light rounded-xl p-4">
                  <label className="block text-sm font-semibold text-primary-dark mb-2">No. PO (Opsional)</label>
                  <input name="po_reference" type="text" className="w-full px-4 py-3 border-2 border-primary-light rounded-xl focus:ring-2 focus:ring-primary-light" placeholder="Contoh: PO-2025-001" />
                </div>
              )}
              {selectedPayableType === 'PROJECT' && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-purple-900 mb-2">Kode Project (Opsional)</label>
                  <input name="project_reference" type="text" className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400" placeholder="Contoh: PRJ-2025-001" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {selectedPayableType === 'OPERATIONAL' ? 'Nama Penerima/Vendor *' : 'Nama Vendor *'}
                  </label>
                  <input name="vendor_name" type="text" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" placeholder={selectedPayableType === 'OPERATIONAL' ? 'Contoh: PLN, PDAM, Landlord' : 'Contoh: PT. Supplier ABC'} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {selectedPayableType === 'OPERATIONAL' ? 'NPWP (Opsional)' : 'NPWP Vendor'}
                  </label>
                  <input name="vendor_npwp" type="text" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" placeholder="01.234.567.8-901.000" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {selectedPayableType === 'OPERATIONAL' ? 'No. Tagihan/Invoice *' : selectedPayableType === 'PROJECT' ? 'No. Invoice Project *' : 'No. Invoice Vendor *'}
                  </label>
                  <input name="vendor_invoice_number" type="text" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" placeholder={selectedPayableType === 'OPERATIONAL' ? 'Contoh: INV-PLN-123' : 'Contoh: INV-2025-001'} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Invoice *</label>
                  <input name="invoice_date" type="date" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jatuh Tempo *</label>
                  <input name="due_date" type="date" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {selectedPayableType === 'OPERATIONAL' ? 'Keterangan Pengeluaran *' : selectedPayableType === 'PROJECT' ? 'Deskripsi Pekerjaan *' : 'Deskripsi *'}
                  </label>
                  <textarea name="description" rows={3} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" placeholder={selectedPayableType === 'OPERATIONAL' ? 'Contoh: Tagihan listrik bulan November 2025' : selectedPayableType === 'PROJECT' ? 'Contoh: Progress termin 2 pembangunan gedung' : 'Contoh: Pembelian barang dari PO-2025-001'} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Total Amount (Rp) *</label>
                  <input name="total_amount" type="number" step="0.01" min="0" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8A870]" placeholder="10000000" required />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowInputForm(false)} className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-semibold">
                  Batal
                </button>
                <button type="submit" className="flex-1 px-6 py-3 bg-primary-dark text-white rounded-xl hover:bg-primary-light/80 transition-colors font-semibold">
                  Simpan Payable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCSVUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-primary-dark p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white"> Upload CSV Payables</h2>
                <button onClick={() => setShowCSVUpload(false)} className="text-white hover:text-gray-200">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="border-4 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-[#C8A870] transition-colors">
                <input type="file" accept=".csv" className="hidden" id="csv-upload" />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="mb-4">
                    <DocumentArrowUpIcon className="w-16 h-16 mx-auto text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">Klik atau drag & drop file CSV</p>
                  <p className="text-sm text-gray-600">Format: vendor_invoice_number, vendor_name, ...</p>
                </label>
              </div>
              <div className="bg-primary-light/10 border border-primary-light rounded-xl p-4">
                <h3 className="text-sm font-bold text-primary-dark mb-2">ðŸ“‹ Format CSV:</h3>
                <code className="text-xs text-primary-dark block">
                  vendor_invoice_number,invoice_date,due_date,vendor_name,vendor_npwp,description,total_amount
                </code>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowCSVUpload(false)} 
                  className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button 
                  className="flex-1 px-6 py-3 bg-primary-dark text-white rounded-xl hover:bg-primary-light/80 transition-colors font-semibold"
                >
                  Upload & Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPayable && (
        <div className="fixed inset-0 bg-[#06103A]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 border-2 border-[#4E88BE]/30">
            {/* Header */}
            <div className="bg-primary-dark px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CurrencyDollarIcon className="w-6 h-6" />
                  Proses Pembayaran Hutang
                </h2>
                <button 
                  onClick={() => setShowPaymentModal(false)} 
                  className="text-white hover:text-[#C8A870] transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Detail Hutang Card */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                  Detail Hutang
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">Vendor:</span>
                    <span className="text-gray-900 font-bold text-right">{selectedPayable.vendor_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">No. Invoice:</span>
                    <span className="text-gray-900 font-bold">{selectedPayable.vendor_invoice_number}</span>
                  </div>
                  <div className="py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium block mb-1">ðŸ“ Deskripsi Hutang:</span>
                    <span className="text-gray-900 font-semibold text-sm bg-yellow-50 px-3 py-2 rounded block">{selectedPayable.description || 'Tidak ada deskripsi'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">Tanggal Invoice:</span>
                    <span className="text-gray-900 font-bold">{formatDate(selectedPayable.invoice_date)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">Jatuh Tempo:</span>
                    <span className="text-red-600 font-bold">{formatDate(selectedPayable.due_date)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium"> Total Hutang:</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(selectedPayable.total_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">✅ Sudah Dibayar:</span>
                    <span className="text-primary-dark font-bold">{formatCurrency(selectedPayable.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3 mt-3">
                    <span className="text-gray-900 font-bold text-base">â³ Sisa Tagihan:</span>
                    <span className="text-green-600 font-bold text-xl">{formatCurrency(selectedPayable.remaining_amount)}</span>
                  </div>
                  <div className="bg-primary-light/10 border border-primary-light rounded-lg p-3 mt-3">
                    <p className="text-xs text-primary-dark">
                      <span className="font-bold">ðŸ’¡ Info:</span> "Sisa Tagihan" adalah jumlah yang masih harus dibayar. Jika sudah dibayar penuh, status akan berubah menjadi <span className="font-bold">LUNAS (PAID)</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Pembayaran */}
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                {/* Row 1: Tanggal & Jumlah */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tanggal Pembayaran <span className="text-red-500">*</span>
                    </label>
                    <input 
                      name="payment_date"
                      type="date" 
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Jumlah Bayar <span className="text-red-500">*</span>
                    </label>
                    <input 
                      name="amount"
                      type="number" 
                      defaultValue={selectedPayable.remaining_amount}
                      min="0"
                      max={selectedPayable.remaining_amount}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                      required 
                    />
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Metode Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="payment_method"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" 
                    required
                  >
                    <option value="">Pilih metode...</option>
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="CHECK">Cek</option>
                    <option value="CASH">Tunai</option>
                    <option value="GIRO">Giro</option>
                  </select>
                </div>

                {/* Detail Bank */}
                <div className="bg-primary-light/10 border-2 border-primary-light rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-primary-dark flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                    </svg>
                    Detail Transfer Bank
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Bank Tujuan <span className="text-red-500">*</span>
                      </label>
                      <input 
                        name="bank_name"
                        type="text" 
                        placeholder="Contoh: BCA, Mandiri, BNI"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light text-sm" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nomor Rekening Tujuan <span className="text-red-500">*</span>
                      </label>
                      <input 
                        name="account_number"
                        type="text" 
                        placeholder="1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light text-sm" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nama Pemilik Rekening
                      </label>
                      <input 
                        name="account_holder"
                        type="text" 
                        placeholder="Nama di rekening tujuan"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nomor Referensi Transfer
                      </label>
                      <input 
                        name="reference_number"
                        type="text" 
                        placeholder="No. transaksi / referensi"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light text-sm" 
                      />
                    </div>
                  </div>
                </div>

                {/* Upload Bukti Transfer */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                    </svg>
                    Upload Bukti Transfer <span className="text-red-500">*</span>
                  </label>
                  <input 
                    name="payment_proof"
                    type="file" 
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const preview = document.getElementById('proof-preview') as HTMLImageElement;
                          if (preview && file.type.startsWith('image/')) {
                            preview.src = reader.result as string;
                            preview.classList.remove('hidden');
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-dashed border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white cursor-pointer hover:border-green-500" 
                    required 
                  />
                  <p className="text-xs text-gray-500 mt-2">Format: JPG, PNG, PDF (Max 5MB)</p>
                  
                  {/* Preview */}
                  <img 
                    id="proof-preview" 
                    className="hidden mt-3 rounded-lg border-2 border-green-300 max-h-48 object-contain"
                    alt="Preview bukti transfer"
                  />
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catatan Tambahan
                  </label>
                  <textarea 
                    name="notes"
                    rows={3} 
                    placeholder="Catatan pembayaran (opsional)"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none" 
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button 
                    type="button" 
                    onClick={() => setShowPaymentModal(false)} 
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold shadow-sm hover:shadow-md"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    Konfirmasi Bayar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal with Payment History */}
      {showDetailModal && selectedPayable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
            {/* Header */}
            <div className="bg-primary-dark px-6 py-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <DocumentTextIcon className="w-6 h-6" />
                  Detail Payable & Payment History
                </h2>
                <button 
                  onClick={() => setShowDetailModal(false)} 
                  className="text-white hover:text-[#C8A870] transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Payable Info */}
              <div className="bg-white border-2 border-primary-light rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">ðŸ“„ Informasi Hutang</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Invoice Number</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPayable.vendor_invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">ID Payable</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPayable.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Vendor</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPayable.vendor_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">NPWP</p>
                    <p className="text-sm font-bold text-gray-900">{selectedPayable.vendor_npwp}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tanggal Invoice</p>
                    <p className="text-sm font-bold text-gray-900">{formatDate(selectedPayable.invoice_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Jatuh Tempo</p>
                    <p className="text-sm font-bold text-red-600">{formatDate(selectedPayable.due_date)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600 mb-1">Deskripsi</p>
                    <p className="text-sm text-gray-700">{selectedPayable.description}</p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-primary-light/10 border-2 border-primary-light rounded-xl p-4">
                  <p className="text-xs font-semibold text-primary-dark mb-1">Total Amount</p>
                  <p className="text-xl font-bold text-primary-dark">{formatCurrency(selectedPayable.total_amount)}</p>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-800 mb-1">Paid Amount</p>
                  <p className="text-xl font-bold text-green-900">{formatCurrency(selectedPayable.paid_amount)}</p>
                </div>
                <div className={`${selectedPayable.remaining_amount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border-2 rounded-xl p-4`}>
                  <p className={`text-xs font-semibold mb-1 ${selectedPayable.remaining_amount > 0 ? 'text-red-800' : 'text-green-800'}`}>
                    Remaining
                  </p>
                  <p className={`text-xl font-bold ${selectedPayable.remaining_amount > 0 ? 'text-red-900' : 'text-green-900'}`}>
                    {formatCurrency(selectedPayable.remaining_amount)}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
                <span className="text-sm font-semibold text-gray-700">Status Pembayaran:</span>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(selectedPayable.status)}`}>
                  {selectedPayable.status === 'PAID' && <CheckCircleIcon className="w-5 h-5 mr-2" />}
                  {selectedPayable.status === 'PENDING' && <ClockIcon className="w-5 h-5 mr-2" />}
                  {selectedPayable.status === 'OVERDUE' && <ExclamationTriangleIcon className="w-5 h-5 mr-2" />}
                  {getStatusLabel(selectedPayable.status)}
                </span>
              </div>

              {/* Payment History - Mock untuk demo */}
              <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-green-600 px-4 py-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CurrencyDollarIcon className="w-5 h-5" />
                    Payment History
                  </h3>
                </div>
                {selectedPayable.status === 'PAID' ? (
                  <div className="p-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-green-900">Payment #1</span>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">
                          COMPLETED
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-600">Date</p>
                          <p className="font-semibold text-gray-900">{formatDate(selectedPayable.due_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Amount</p>
                          <p className="font-bold text-green-600">{formatCurrency(selectedPayable.paid_amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Method</p>
                          <p className="font-semibold text-gray-900">Transfer Bank</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Reference</p>
                          <p className="font-semibold text-gray-900">TRX-{selectedPayable.id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <ClockIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Belum ada pembayaran</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowDetailModal(false)} 
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  Tutup
                </button>
                {selectedPayable.status !== 'PAID' && (
                  <button 
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <CurrencyDollarIcon className="w-5 h-5" />
                    Proses Pembayaran
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attach Document Modal */}
      {showAttachModal && selectedPayable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-primary-dark p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">📎 Lampirkan Dokumen</h2>
                <button onClick={() => { setShowAttachModal(false); setSelectedPayable(null); }} className="text-white hover:text-gray-200">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-gray-700">Upload dokumen pendukung untuk payable <span className="font-bold text-primary-dark">{selectedPayable.vendor_invoice_number}</span></p>
              <div className="border-4 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-[#C8A870] transition-colors">
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" id="document-upload" />
                <label htmlFor="document-upload" className="cursor-pointer">
                  <div className="mb-4">
                    <DocumentArrowUpIcon className="w-16 h-16 mx-auto text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">Klik atau drag & drop file</p>
                  <p className="text-sm text-gray-600">PDF, JPG, PNG (max 10MB)</p>
                </label>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowAttachModal(false)} className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-semibold">
                  Batal
                </button>
                <button className="flex-1 px-6 py-3 bg-primary-dark text-white rounded-xl hover:bg-primary-light/80 transition-colors font-semibold">
                  Upload Dokumen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayablesManagementNew;

