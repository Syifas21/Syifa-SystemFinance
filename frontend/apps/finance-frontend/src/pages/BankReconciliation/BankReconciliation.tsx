// Bank Reconciliation & Payment Matching
// Import mutasi rekening BCA dan match dengan invoice
// NOW WITH AUTO BANK TRANSACTION FEED!

import React, { useState, useEffect } from 'react';
import {
  BanknotesIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import THEME from '../../config/theme';
import AutoBankTransactionFeed from '../../components/AutoBankTransactionFeed';

interface BankTransaction {
  id: string;
  transaction_date: string;
  sender_name: string;
  sender_account?: string;
  amount: number;
  description: string;
  status: 'PENDING' | 'MATCHED' | 'APPROVED' | 'REJECTED';
  matched_invoice_id?: string;
  matched_invoice_number?: string;
  confidence_score?: number; // AI matching confidence 0-100
  notes?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  remaining_amount: number;
  status: string;
  invoice_date: string;
}

const BankReconciliation: React.FC = () => {
  // Tab state for Auto Feed vs Manual Upload
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');

  // Mock data untuk simulasi
  const mockBankTransactions: BankTransaction[] = [
    {
      id: 'TRX-2026-001',
      transaction_date: '2026-01-28',
      sender_name: 'PT PERTAMINA EP',
      sender_account: '1234567890',
      amount: 150000000,
      description: 'PEMBAYARAN INV-2026-045',
      status: 'MATCHED',
      matched_invoice_id: '1',
      matched_invoice_number: 'INV-2026-045',
      confidence_score: 98,
    },
    {
      id: 'TRX-2026-002',
      transaction_date: '2026-01-28',
      sender_name: 'PT TELKOM INDONESIA',
      sender_account: '9876543210',
      amount: 85000000,
      description: 'TRF PELUNASAN INVOICE',
      status: 'MATCHED',
      matched_invoice_id: '2',
      matched_invoice_number: 'INV-2026-046',
      confidence_score: 95,
    },
    {
      id: 'TRX-2026-003',
      transaction_date: '2026-01-27',
      sender_name: 'CV MAJU BERSAMA',
      sender_account: '5555666677',
      amount: 45000000,
      description: 'BAYAR TAGIHAN PROJECT',
      status: 'PENDING',
      confidence_score: 0,
    },
    {
      id: 'TRX-2026-004',
      transaction_date: '2026-01-27',
      sender_name: 'PT UNILEVER INDONESIA',
      sender_account: '1111222233',
      amount: 120000000,
      description: 'PEMBAYARAN DP 50%',
      status: 'MATCHED',
      matched_invoice_id: '3',
      matched_invoice_number: 'INV-2026-047',
      confidence_score: 92,
    },
    {
      id: 'TRX-2026-005',
      transaction_date: '2026-01-26',
      sender_name: 'PT ASTRA INTERNATIONAL',
      sender_account: '3333444455',
      amount: 200000000,
      description: 'TRANSFER INVOICE INV-2026-048',
      status: 'APPROVED',
      matched_invoice_id: '4',
      matched_invoice_number: 'INV-2026-048',
      confidence_score: 100,
    },
    {
      id: 'TRX-2026-006',
      transaction_date: '2026-01-26',
      sender_name: 'UNKNOWN SENDER',
      sender_account: '9999888877',
      amount: 25000000,
      description: 'TRANSFER',
      status: 'REJECTED',
      notes: 'Pengirim tidak dikenal - perlu verifikasi',
      confidence_score: 0,
    },
    {
      id: 'TRX-2026-007',
      transaction_date: '2026-01-25',
      sender_name: 'PT PUPUK INDONESIA',
      sender_account: '6666777788',
      amount: 75000000,
      description: 'BAYAR INV',
      status: 'PENDING',
      confidence_score: 0,
    },
    {
      id: 'TRX-2026-008',
      transaction_date: '2026-01-25',
      sender_name: 'PT PLN PERSERO',
      sender_account: '4444555566',
      amount: 95000000,
      description: 'PEMBAYARAN INVOICE 2026',
      status: 'MATCHED',
      matched_invoice_id: '5',
      matched_invoice_number: 'INV-2026-049',
      confidence_score: 89,
    },
  ];

  const [transactions, setTransactions] = useState<BankTransaction[]>(mockBankTransactions);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [transactionToReject, setTransactionToReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch unpaid invoices for matching
  useEffect(() => {
    fetchUnpaidInvoices();
  }, []);

  const fetchUnpaidInvoices = async () => {
    try {
      const response = await fetch('/api/invoices?status=SENT,PARTIALLY_PAID');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setInvoices(data.data);
          console.log(`✅ Loaded ${data.data.length} unpaid invoices for matching`);
        }
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Transform bank data to BankTransaction format
        const transactions: BankTransaction[] = jsonData.map((row: any, index) => ({
          id: `TRX-${Date.now()}-${index}`,
          transaction_date: row['Tanggal'] || row['Date'] || new Date().toISOString().split('T')[0],
          sender_name: row['Nama Pengirim'] || row['Sender Name'] || row['Description'] || 'Unknown',
          sender_account: row['Rekening'] || row['Account'] || '',
          amount: parseFloat(row['Nominal'] || row['Amount'] || row['Credit'] || 0),
          description: row['Keterangan'] || row['Description'] || row['Remarks'] || '',
          status: 'PENDING',
        }));

        // Auto-match by amount and customer name
        const matchedTransactions = autoMatchTransactions(transactions);
        setTransactions(matchedTransactions);

        alert(`✅ ${transactions.length} transaksi berhasil diimport!\n${matchedTransactions.filter(t => t.status === 'MATCHED').length} transaksi otomatis ter-match dengan invoice.`);
        setShowUploadModal(false);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('❌ Gagal import file. Pastikan format sesuai template.');
    } finally {
      setIsLoading(false);
    }
  };

  const autoMatchTransactions = (transactions: BankTransaction[]): BankTransaction[] => {
    return transactions.map(trx => {
      // Try to match by exact amount first
      let matchingInvoices = invoices.filter(inv => 
        Math.abs(inv.remaining_amount - trx.amount) < 1
      );

      // If no exact match, try fuzzy matching with customer name
      if (matchingInvoices.length === 0) {
        matchingInvoices = invoices.filter(inv => 
          Math.abs(inv.remaining_amount - trx.amount) < inv.remaining_amount * 0.05 && // 5% tolerance
          (trx.sender_name.toLowerCase().includes(inv.customer_name.toLowerCase().split(' ')[0]) ||
           inv.customer_name.toLowerCase().includes(trx.sender_name.toLowerCase().split(' ')[0]))
        );
      }

      // Calculate confidence score based on match quality
      let confidenceScore = 0;
      if (matchingInvoices.length === 1) {
        const invoice = matchingInvoices[0];
        const amountDiff = Math.abs(invoice.remaining_amount - trx.amount);
        const nameMatch = trx.sender_name.toLowerCase().includes(invoice.customer_name.toLowerCase().split(' ')[0]);
        
        confidenceScore = 100;
        if (amountDiff > 1) confidenceScore -= 10; // Not exact amount match
        if (!nameMatch) confidenceScore -= 20; // Name doesn't match
        
        return {
          ...trx,
          status: confidenceScore >= 70 ? 'MATCHED' : 'PENDING',
          matched_invoice_id: confidenceScore >= 70 ? invoice.id : undefined,
          matched_invoice_number: confidenceScore >= 70 ? invoice.invoice_number : undefined,
          confidence_score: confidenceScore,
        };
      }

      return { ...trx, confidence_score: 0 };
    });
  };

  const handleManualMatch = (transactionId: string, invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    setTransactions(prev => prev.map(trx => 
      trx.id === transactionId
        ? {
            ...trx,
            status: 'MATCHED',
            matched_invoice_id: invoice.id,
            matched_invoice_number: invoice.invoice_number,
            confidence_score: 95, // Manual match = high confidence
          }
        : trx
    ));
  };

  const handleBulkApprove = async () => {
    if (selectedTransactions.length === 0) {
      alert('❌ Pilih minimal 1 transaksi untuk disetujui!');
      return;
    }

    const matchedSelected = selectedTransactions.filter(id => {
      const trx = transactions.find(t => t.id === id);
      return trx?.status === 'MATCHED';
    });

    if (matchedSelected.length === 0) {
      alert('❌ Tidak ada transaksi yang ter-match untuk disetujui!');
      return;
    }

    if (!confirm(`⚠️ Konfirmasi Bulk Approval:\n\n${matchedSelected.length} transaksi akan disetujui.\nInvoice akan LUNAS dan jurnal akan tercatat.\n\nLanjutkan?`)) {
      return;
    }

    setIsLoading(true);
    try {
      for (const id of matchedSelected) {
        await handleApprovePayment(id);
      }
      setSelectedTransactions([]);
      setShowBulkApproveModal(false);
      alert(`✅ ${matchedSelected.length} transaksi berhasil disetujui!`);
    } catch (error) {
      console.error('Error bulk approve:', error);
      alert('❌ Gagal approve beberapa transaksi!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectTransaction = (transactionId: string) => {
    setTransactionToReject(transactionId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!transactionToReject) return;
    if (!rejectReason.trim()) {
      alert('❌ Alasan penolakan wajib diisi!');
      return;
    }

    setTransactions(prev => prev.map(trx => 
      trx.id === transactionToReject
        ? {
            ...trx,
            status: 'REJECTED',
            notes: rejectReason,
          }
        : trx
    ));

    alert(`✅ Transaksi ditolak!\n\nAlasan: ${rejectReason}`);
    setShowRejectModal(false);
    setTransactionToReject(null);
    setRejectReason('');
  };

  const toggleSelectTransaction = (id: string) => {
    setSelectedTransactions(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id));
    }
  };

  const handleApprovePayment = async (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction || !transaction.matched_invoice_id) {
      alert('❌ Transaksi belum di-match dengan invoice!');
      return;
    }

    if (!confirm(`⚠️ Konfirmasi pembayaran:\n\nTransaksi: ${formatCurrency(transaction.amount)}\nDari: ${transaction.sender_name}\nUntuk Invoice: ${transaction.matched_invoice_number}\n\nSetelah approve, invoice akan otomatis LUNAS dan jurnal tercatat.\n\nLanjutkan?`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Call API to record payment
      const response = await fetch(`/api/invoices/${transaction.matched_invoice_id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_date: transaction.transaction_date,
          amount: transaction.amount,
          method: 'TRANSFER',
          notes: `Bank transfer from ${transaction.sender_name} - Auto-matched via Bank Reconciliation`,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal mencatat pembayaran');
      }

      // Update transaction status
      setTransactions(prev => prev.map(trx =>
        trx.id === transactionId ? { ...trx, status: 'APPROVED' } : trx
      ));

      // Refresh invoices
      await fetchUnpaidInvoices();

      alert(
        `✅ PEMBAYARAN DISETUJUI!\n\n` +
        `📄 Invoice: ${transaction.matched_invoice_number}\n` +
        `💰 Amount: ${formatCurrency(transaction.amount)}\n` +
        `👤 From: ${transaction.sender_name}\n\n` +
        `✨ Invoice status updated to PAID\n` +
        `✨ Journal entry created automatically:\n` +
        `   - Debit: Kas/Bank\n` +
        `   - Kredit: Piutang Usaha\n\n` +
        `📊 All reports updated automatically!`
      );
    } catch (error: any) {
      console.error('Error approving payment:', error);
      alert('❌ Gagal approve pembayaran: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
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
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'MATCHED': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'APPROVED': return 'bg-green-100 text-green-800 border border-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 border border-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Belum Match',
      MATCHED: 'Sudah Match',
      APPROVED: 'Disetujui',
      REJECTED: 'Ditolak',
    };
    return labels[status] || status;
  };

  const filteredTransactions = transactions.filter(trx => {
    const matchesSearch = trx.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trx.matched_invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || trx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPending = transactions.filter(t => t.status === 'PENDING').reduce((sum, t) => sum + t.amount, 0);
  const totalMatched = transactions.filter(t => t.status === 'MATCHED').reduce((sum, t) => sum + t.amount, 0);
  const totalApproved = transactions.filter(t => t.status === 'APPROVED').reduce((sum, t) => sum + t.amount, 0);
  const totalRejected = transactions.filter(t => t.status === 'REJECTED').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('auto')}
            className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'auto'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🤖 Auto Bank Feed
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'manual'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📤 Manual Upload
          </button>
        </div>
      </div>

      {/* Auto Feed Tab */}
      {activeTab === 'auto' && (
        <AutoBankTransactionFeed />
      )}

      {/* Manual Upload Tab */}
      {activeTab === 'manual' && (
        <>
      {/* Header - Ultra Compact */}
      <div className="bg-white rounded-2xl shadow-lg p-4 relative overflow-hidden">
        <div style={{ height: 6, backgroundColor: THEME.primary, borderRadius: 4, marginTop: -12 }} />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
                <BanknotesIcon className="w-8 h-8" style={{ color: THEME.accent }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: THEME.primary }}>Rekonsiliasi Bank</h1>
                <p className="text-sm font-medium" style={{ color: THEME.primary, opacity: 0.7 }}>Bank Reconciliation & Payment Matching</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-white/80 border border-gray-200 shadow-sm">
                📊 {transactions.length} Transaksi
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-white/80 border border-gray-200 shadow-sm">
                💰 {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-green-100 text-green-700 border border-green-300 shadow-sm">
                ✅ {transactions.filter(t => t.status === 'APPROVED').length} Disetujui
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full font-bold bg-blue-100 text-blue-700 border border-blue-300 shadow-sm">
                🔄 {transactions.filter(t => t.status === 'MATCHED').length} Matched
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-5 py-3 rounded-xl transition-all font-bold shadow-md hover:shadow-xl flex items-center gap-2 text-sm"
              style={{ backgroundColor: THEME.accent, color: '#ffffff' }}
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
              Impor Mutasi BCA
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards - Clean & Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-yellow-500 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">⏳ Belum Match</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-gray-500">{transactions.filter(t => t.status === 'PENDING').length} transaksi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">🔄 Sudah Match</p>
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-1">{formatCurrency(totalMatched)}</p>
              <p className="text-xs text-gray-500">{transactions.filter(t => t.status === 'MATCHED').length} transaksi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">✅ Disetujui</p>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-1">{formatCurrency(totalApproved)}</p>
              <p className="text-xs text-gray-500">{transactions.filter(t => t.status === 'APPROVED').length} transaksi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-500 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-red-100 p-2 rounded-lg">
                  <XMarkIcon className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">❌ Ditolak</p>
              </div>
              <p className="text-2xl font-bold text-red-600 mb-1">{formatCurrency(totalRejected)}</p>
              <p className="text-xs text-gray-500">{transactions.filter(t => t.status === 'REJECTED').length} transaksi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pengirim atau invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">⏳ Belum Match</option>
            <option value="MATCHED">🔄 Sudah Match</option>
            <option value="APPROVED">✅ Disetujui</option>
            <option value="REJECTED">❌ Ditolak</option>
          </select>
        </div>
        
        {/* Bulk Action Buttons */}
        {selectedTransactions.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border-2 border-blue-200">
            <span className="text-sm font-bold text-blue-800">
              {selectedTransactions.length} transaksi dipilih
            </span>
            <button
              onClick={handleBulkApprove}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg hover:bg-green-700 transition-all disabled:opacity-50"
            >
              ✅ Setujui Semua
            </button>
            <button
              onClick={() => setSelectedTransactions([])}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors"
            >
              Batal Pilih
            </button>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead style={{ backgroundColor: THEME.primary }}>
              <tr>
                <th className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-2 border-white cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Pengirim</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">Nominal</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Keterangan</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Match Invoice</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Confidence</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    <BanknotesIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-semibold">Belum ada mutasi rekening</p>
                    <p className="text-sm mt-2">Klik "Impor Mutasi BCA" untuk upload file Excel/CSV</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(trx.id)}
                        onChange={() => toggleSelectTransaction(trx.id)}
                        className="w-4 h-4 rounded border-2 border-gray-300 cursor-pointer"
                        disabled={trx.status === 'APPROVED' || trx.status === 'REJECTED'}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(trx.transaction_date)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm text-gray-900">{trx.sender_name}</div>
                      {trx.sender_account && (
                        <div className="text-xs text-gray-500">{trx.sender_account}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-base text-green-600">
                      {formatCurrency(trx.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {trx.description}
                      {trx.notes && (
                        <div className="text-xs text-red-600 mt-1">⚠️ {trx.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {trx.status === 'PENDING' ? (
                        <select
                          onChange={(e) => handleManualMatch(trx.id, e.target.value)}
                          className="w-full px-2 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                        >
                          <option value="">-- Pilih Invoice --</option>
                          {invoices
                            .filter(inv => Math.abs(inv.remaining_amount - trx.amount) < inv.remaining_amount * 0.1) // Allow 10% tolerance
                            .map(inv => (
                              <option key={inv.id} value={inv.id}>
                                {inv.invoice_number} - {inv.customer_name} ({formatCurrency(inv.remaining_amount)})
                              </option>
                            ))}
                        </select>
                      ) : (
                        <div className="font-semibold text-blue-600">{trx.matched_invoice_number}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {trx.confidence_score && trx.confidence_score > 0 ? (
                        <div className="flex flex-col items-center">
                          <div className={`text-xs font-bold ${
                            trx.confidence_score >= 90 ? 'text-green-600' :
                            trx.confidence_score >= 70 ? 'text-blue-600' :
                            'text-yellow-600'
                          }`}>
                            {trx.confidence_score}%
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${
                                trx.confidence_score >= 90 ? 'bg-green-500' :
                                trx.confidence_score >= 70 ? 'bg-blue-500' :
                                'bg-yellow-500'
                              }`}
                              style={{ width: `${trx.confidence_score}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(trx.status)}`}>
                        {trx.status === 'APPROVED' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                        {trx.status === 'REJECTED' && <XMarkIcon className="w-4 h-4 mr-1" />}
                        {getStatusLabel(trx.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {trx.status === 'MATCHED' && (
                          <>
                            <button
                              onClick={() => handleApprovePayment(trx.id)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                              Setuju
                            </button>
                            <button
                              onClick={() => handleRejectTransaction(trx.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                            >
                              <XMarkIcon className="w-4 h-4" />
                              Tolak
                            </button>
                          </>
                        )}
                        {trx.status === 'APPROVED' && (
                          <span className="text-sm text-green-600 font-semibold">✓ Selesai</span>
                        )}
                        {trx.status === 'REJECTED' && (
                          <span className="text-sm text-red-600 font-semibold">✗ Ditolak</span>
                        )}
                        {trx.status === 'PENDING' && (
                          <span className="text-xs text-gray-400">Perlu Match</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Import Mutasi Rekening BCA</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800 font-semibold mb-2">📋 Format File Excel/CSV:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Kolom 1: <strong>Tanggal</strong> (format: DD/MM/YYYY atau YYYY-MM-DD)</li>
                  <li>• Kolom 2: <strong>Nama Pengirim</strong> (nama PT/perusahaan)</li>
                  <li>• Kolom 3: <strong>Nominal</strong> (jumlah transfer masuk)</li>
                  <li>• Kolom 4: <strong>Keterangan</strong> (optional)</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                <ArrowUpTrayIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Pilih file Excel atau CSV mutasi rekening BCA</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl hover:shadow-lg transition-all font-semibold cursor-pointer"
                  style={{ backgroundColor: THEME.accent }}
                >
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  Pilih File
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Tolak Transaksi</h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-800 font-semibold">⚠️ Transaksi akan ditandai sebagai ditolak</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Jelaskan alasan transaksi ditolak..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={confirmReject}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
                >
                  Tolak Transaksi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default BankReconciliation;
