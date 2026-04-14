import React from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

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
  status: string;
  payable_type?: string;
  po_id?: string;
  project_id?: string;
}

interface PayableDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payable: PayableItem | null;
  onPayment?: () => void;
}

const PayableDetailModal: React.FC<PayableDetailModalProps> = ({
  isOpen,
  onClose,
  payable,
  onPayment,
}) => {
  if (!isOpen || !payable) return null;

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
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusConfig = () => {
    switch (payable.status) {
      case 'PAID':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: CheckCircleIcon,
          label: '✅ Lunas',
        };
      case 'PENDING':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: ClockIcon,
          label: '⏳ Pending',
        };
      case 'OVERDUE':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: ExclamationTriangleIcon,
          label: '⚠️ Overdue',
        };
      default:
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: ClockIcon,
          label: payable.status,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const progressPercentage = payable.total_amount > 0
    ? (payable.paid_amount / payable.total_amount) * 100
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Detail Hutang</h2>
              <p className="text-indigo-100 text-sm">Invoice #{payable.vendor_invoice_number}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
            <div>
              <p className="text-sm text-gray-600 mb-1">Status Pembayaran</p>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon className="w-6 h-6" />
                {statusConfig.label}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">ID Payable</p>
              <p className="text-xs font-mono bg-gray-200 px-3 py-1 rounded-lg">{payable.id}</p>
            </div>
          </div>

          {/* Vendor Information */}
          <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Informasi Vendor</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Nama Vendor</p>
                <p className="text-base font-bold text-gray-900">{payable.vendor_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">NPWP</p>
                <p className="text-base font-semibold text-gray-700">{payable.vendor_npwp || '-'}</p>
              </div>
              {payable.payable_type && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tipe</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                    payable.payable_type === 'PO'
                      ? 'bg-purple-100 text-purple-800'
                      : payable.payable_type === 'OPERATIONAL'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-cyan-100 text-cyan-800'
                  }`}>
                    {payable.payable_type}
                  </span>
                </div>
              )}
              {(payable.po_id || payable.project_id) && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Referensi</p>
                  <p className="text-base font-semibold text-gray-700">
                    {payable.po_id || payable.project_id}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <DocumentTextIcon className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">Detail Invoice</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tanggal Invoice</p>
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                  <p className="text-base font-semibold text-gray-900">{formatDate(payable.invoice_date)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Jatuh Tempo</p>
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                  <p className={`text-base font-semibold ${
                    payable.status === 'OVERDUE' ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatDate(payable.due_date)}
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-2">Deskripsi</p>
                <p className="text-base text-gray-900 bg-white rounded-xl p-4 border border-gray-200">
                  {payable.description}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-2 mb-6">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900">Ringkasan Pembayaran</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-black text-blue-600">{formatCurrency(payable.total_amount)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                <p className="text-sm text-gray-600 mb-1">Terbayar</p>
                <p className="text-2xl font-black text-green-600">{formatCurrency(payable.paid_amount)}</p>
              </div>
              <div className={`bg-white rounded-xl p-4 border-2 ${
                payable.remaining_amount > 0 ? 'border-red-200' : 'border-green-200'
              }`}>
                <p className="text-sm text-gray-600 mb-1">Sisa</p>
                <p className={`text-2xl font-black ${
                  payable.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(payable.remaining_amount)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">Progress Pembayaran</p>
                <p className="text-sm font-bold text-green-600">{progressPercentage.toFixed(1)}%</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 ease-out rounded-full flex items-center justify-end px-2"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {progressPercentage > 10 && (
                    <span className="text-xs font-bold text-white">
                      {progressPercentage.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {payable.status === 'PAID' && (
            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                Riwayat Pembayaran
              </h3>
              <div className="bg-white rounded-xl p-4 border-2 border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">Payment #1</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                    COMPLETED
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-600">Tanggal</p>
                    <p className="font-semibold text-gray-900">{formatDate(payable.due_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Jumlah</p>
                    <p className="font-bold text-green-600">{formatCurrency(payable.paid_amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Metode</p>
                    <p className="font-semibold text-gray-900">Transfer Bank</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Reference</p>
                    <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">TRX-{payable.id.substring(0, 8)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-all"
            >
              Tutup
            </button>
            {payable.status !== 'PAID' && onPayment && (
              <button
                onClick={() => {
                  onClose();
                  onPayment();
                }}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <BanknotesIcon className="w-5 h-5" />
                Proses Pembayaran
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayableDetailModal;
