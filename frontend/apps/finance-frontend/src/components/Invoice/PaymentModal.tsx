// Modal Catat Pembayaran
// Per TSD FITUR 3.4.A - FE-FIN-06

import React, { useState } from 'react';
import { XMarkIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    invoice_number: string;
    customer_name: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
  };
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [paymentData, setPaymentData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: invoice.remaining_amount,
    method: 'TRANSFER',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi amount
    if (paymentData.amount <= 0) {
      alert('❌ Jumlah pembayaran harus lebih dari 0');
      return;
    }

    if (paymentData.amount > invoice.remaining_amount) {
      alert(`❌ Jumlah pembayaran (${formatCurrency(paymentData.amount)}) melebihi sisa tagihan (${formatCurrency(invoice.remaining_amount)})`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`http://localhost:3002/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_date: paymentData.payment_date,
          amount: paymentData.amount,
          payment_method: paymentData.method,
          notes: paymentData.notes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mencatat pembayaran');
      }

      const result = await response.json();
      console.log('✅ Payment recorded:', result);

      // Success notification
      alert(
        `✅ PEMBAYARAN BERHASIL DICATAT!\n\n` +
        `📄 Invoice: ${invoice.invoice_number}\n` +
        `💰 Jumlah: ${formatCurrency(paymentData.amount)}\n` +
        `📅 Tanggal: ${formatDate(paymentData.payment_date)}\n` +
        `💳 Metode: ${getMethodLabel(paymentData.method)}\n\n` +
        `✨ Jurnal otomatis sudah tercatat:\n` +
        `   - Debit: Kas/Bank\n` +
        `   - Kredit: Piutang Usaha\n\n` +
        `${result.data?.invoice?.status === 'PAID' ? '🎉 Invoice sudah LUNAS!' : `📊 Sisa tagihan: ${formatCurrency(result.data?.remaining_amount || 0)}`}`
      );

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Error recording payment:', error);
      alert('❌ Gagal mencatat pembayaran: ' + error.message);
    } finally {
      setIsSubmitting(false);
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
      month: 'long',
      year: 'numeric',
    });
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      TRANSFER: 'Transfer Bank',
      CASH: 'Tunai',
      CHEQUE: 'Cek',
      GIRO: 'Giro',
      OTHER: 'Lainnya',
    };
    return labels[method] || method;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-dark to-primary-light p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <CurrencyDollarIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Catat Pembayaran</h2>
              <p className="text-white/90 text-sm mt-1">
                Invoice: {invoice.invoice_number}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Invoice Info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Customer</p>
                <p className="font-semibold text-gray-900">{invoice.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Invoice</p>
                <p className="font-semibold text-gray-900">{formatCurrency(invoice.total_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Sudah Dibayar</p>
                <p className="font-semibold text-green-600">{formatCurrency(invoice.paid_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Sisa Tagihan</p>
                <p className="font-bold text-xl text-red-600">{formatCurrency(invoice.remaining_amount)}</p>
              </div>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Tanggal Pembayaran <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={paymentData.payment_date}
              onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-light focus:border-transparent"
              required
            />
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              💰 Jumlah Dibayar (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-light focus:border-transparent"
              min="0"
              max={invoice.remaining_amount}
              step="1000"
              required
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setPaymentData({ ...paymentData, amount: invoice.remaining_amount / 2 })}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                50% (DP)
              </button>
              <button
                type="button"
                onClick={() => setPaymentData({ ...paymentData, amount: invoice.remaining_amount })}
                className="px-3 py-1 bg-primary-light text-white rounded-lg hover:bg-primary-dark text-sm"
              >
                Lunas (100%)
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              💳 Metode Pembayaran <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentData.method}
              onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-light focus:border-transparent"
              required
            >
              <option value="TRANSFER">Transfer Bank</option>
              <option value="CASH">Tunai</option>
              <option value="CHEQUE">Cek</option>
              <option value="GIRO">Giro</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📝 Catatan (Opsional)
            </label>
            <textarea
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-light focus:border-transparent"
              rows={3}
              placeholder="Contoh: Pembayaran via BCA, Ref: 1234567890"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-dark to-primary-light text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? '⏳ Memproses...' : '✅ Konfirmasi Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
