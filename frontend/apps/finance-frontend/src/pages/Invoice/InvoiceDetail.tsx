import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PaperAirplaneIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_id?: string;
  customer_name: string;
  customer_address?: string;
  customer_phone?: string;
  customer_email?: string;
  subtotal: string | number;
  tax_amount: string | number;
  discount_amount: string | number;
  total_amount: string | number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
}

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Load invoice data
  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/invoices/${id}`);
      const data = await res.json();
      if (data.success) {
        setInvoice(data.data);
      } else {
        alert('Gagal memuat invoice');
        navigate('/invoices');
      }
    } catch (error) {
      console.error('Failed to load invoice:', error);
      alert('Gagal memuat invoice');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleSendInvoice = async () => {
    if (!invoice) return;

    const confirmed = window.confirm(
      `Kirim invoice ${invoice.invoice_number}?\n\nInvoice akan diubah statusnya menjadi "Terkirim" dan akan memicu pencatatan jurnal akuntansi otomatis.`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/invoices/${id}/send`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sent_by: 'admin' }), // TODO: Get from auth
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Invoice berhasil dikirim!');
        loadInvoice(); // Reload to get updated status
      } else {
        alert(`❌ Gagal mengirim invoice: ${data.message}`);
      }
    } catch (error: any) {
      console.error('Failed to send invoice:', error);
      alert(`❌ Gagal mengirim invoice: ${error.message}`);
    }
  };

  const handleRecordPayment = () => {
    setShowPaymentModal(true);
  };

  const handleDownloadPDF = () => {
    alert('Fitur download PDF akan segera hadir');
    // TODO: Implement PDF generation
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 text-xl font-semibold">Invoice tidak ditemukan</p>
          <button
            onClick={() => navigate('/invoices')}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-primary-light to-accent-gold text-white rounded-lg hover:from-accent-gold hover:to-primary-dark transition-all shadow-md"
            >
              Kembali ke Daftar Invoice
            </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SENT': return 'bg-primary-light/20 text-primary-dark border border-primary-light';
      case 'PARTIALLY_PAID': return 'bg-accent-gold/20 text-accent-gold border border-accent-gold';
      case 'PAID': return 'bg-primary-dark/10 text-primary-dark border border-primary-dark';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SENT: 'Terkirim',
      PARTIALLY_PAID: 'Lunas Sebagian',
      PAID: 'Lunas',
      OVERDUE: 'Jatuh Tempo',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-dark to-primary-light rounded-2xl shadow-lg px-8 py-6">
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => navigate('/invoices')}
                  className="text-sm text-white hover:text-accent-gold mb-2 font-medium"
                >
                  ← Kembali ke Daftar Invoice
                </button>
                <h1 className="text-2xl font-bold text-white">
                  Invoice {invoice.invoice_number}
                </h1>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {getStatusLabel(invoice.status)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {invoice.status === 'DRAFT' && (
                  <button
                    onClick={handleSendInvoice}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-light to-accent-gold text-white rounded-lg hover:from-accent-gold hover:to-primary-dark font-medium shadow-md transition-all"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                    Review & Kirim
                  </button>
                )}

                {invoice.status === 'SENT' && (
                  <>
                    <button
                      onClick={handleRecordPayment}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-gold to-primary-light text-white rounded-lg hover:from-primary-light hover:to-primary-dark font-medium shadow-md transition-all"
                    >
                      <CurrencyDollarIcon className="w-5 h-5" />
                      Catat Pembayaran
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium shadow-md"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                      Unduh PDF
                    </button>
                  </>
                )}

                {invoice.status === 'PAID' && (
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium shadow-md"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Unduh PDF
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Document */}
        <div className="max-w-5xl mx-auto px-8 py-8">
          <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-12">
            {/* Company Header */}
            <div className="border-b-2 border-gray-900 pb-6 mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h2>
              <div className="text-gray-600">
                <p className="font-semibold">PT. Mini ERP Solution</p>
                <p>Jl. Teknologi No. 123, Jakarta 12345</p>
                <p>Telp: (021) 12345678 | Email: finance@minierp.com</p>
              </div>
            </div>

            {/* Invoice Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Bill To */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">BILL TO:</h3>
                <div className="text-gray-900">
                  <p className="font-bold text-lg">{invoice.customer_name}</p>
                  {invoice.customer_address && <p>{invoice.customer_address}</p>}
                  {invoice.customer_phone && <p>Telp: {invoice.customer_phone}</p>}
                  {invoice.customer_email && <p>Email: {invoice.customer_email}</p>}
                </div>
              </div>

              {/* Invoice Details */}
              <div className="text-right">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600 font-medium">Invoice Number:</span>
                    <span className="text-gray-900 font-bold">{invoice.invoice_number}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600 font-medium">Invoice Date:</span>
                    <span className="text-gray-900">{formatDate(invoice.invoice_date)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600 font-medium">Due Date:</span>
                    <span className="text-gray-900 font-semibold">{formatDate(invoice.due_date)}</span>
                  </div>
                  {invoice.payment_terms && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-gray-600 font-medium">Payment Terms:</span>
                      <span className="text-gray-900">{invoice.payment_terms}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="py-3 text-left text-sm font-semibold text-gray-900">DESCRIPTION</th>
                    <th className="py-3 text-right text-sm font-semibold text-gray-900">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 text-gray-700">
                      {invoice.notes || 'Service / Product'}
                    </td>
                    <td className="py-4 text-right font-medium text-gray-900">
                      {formatCurrency(invoice.subtotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-80">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  
                  {Number(invoice.discount_amount) > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Discount:</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(invoice.discount_amount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-700">
                    <span>PPN (11%):</span>
                    <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                  </div>

                  <div className="border-t-2 border-gray-900 pt-3 flex justify-between text-lg">
                    <span className="font-bold text-gray-900">TOTAL:</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Notes */}
            {invoice.notes && (
              <div className="mt-12 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes:</h4>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>Terima kasih atas kepercayaan Anda</p>
              <p className="mt-2">Invoice ini dibuat secara elektronik dan sah tanpa tanda tangan</p>
            </div>
          </div>
        </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          invoice={invoice}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            loadInvoice();
          }}
        />
      )}
    </div>
  );
};

// Payment Modal Component
interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onClose, onSuccess }) => {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(invoice.total_amount.toString());
  const [method, setMethod] = useState('TRANSFER');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentDate || !amount || !method) {
      alert('Semua field harus diisi');
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      alert('Jumlah pembayaran harus lebih dari 0');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_date: paymentDate,
          amount: paymentAmount,
          method,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Pembayaran berhasil dicatat!');
        onSuccess();
      } else {
        alert(`❌ Gagal mencatat pembayaran: ${data.message}`);
      }
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      alert(`❌ Gagal mencatat pembayaran: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Catat Pembayaran</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Invoice: {invoice.invoice_number}</p>
            <p className="text-lg font-bold text-gray-900">
              Total: {formatCurrency(invoice.total_amount)}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Bayar <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Dibayar (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metode Bayar <span className="text-red-500">*</span>
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="TRANSFER">Transfer Bank</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cek</option>
                <option value="CREDIT_CARD">Kartu Kredit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Catatan tambahan..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-accent-gold to-primary-light text-white rounded-md hover:from-primary-light hover:to-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-all"
            >
              {submitting ? 'Menyimpan...' : 'Konfirmasi Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceDetail;
