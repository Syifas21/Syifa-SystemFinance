import React, { useState } from 'react';
import {
  XMarkIcon,
  BanknotesIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface PayableItem {
  id: string;
  vendor_invoice_number: string;
  vendor_name: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payable: PayableItem | null;
  onSuccess: () => void;
  apiBase: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  payable,
  onSuccess,
  apiBase,
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'method' | 'details' | 'confirmation'>('method');
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash' | 'check'>('transfer');
  const [paymentData, setPaymentData] = useState({
    payment_amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_reference: '',
    bank_account: '',
    notes: '',
  });
  const [proofFile, setProofFile] = useState<File | null>(null);

  if (!isOpen || !payable) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handlePaymentAmountChange = (value: string) => {
    setPaymentData(prev => ({ ...prev, payment_amount: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProofFile(file);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('payment_amount', paymentData.payment_amount);
      formData.append('payment_date', paymentData.payment_date);
      formData.append('payment_method', paymentMethod);
      formData.append('payment_reference', paymentData.payment_reference || `PAY-${Date.now()}`);
      formData.append('bank_account', paymentData.bank_account || 'BCA 1234567890');
      formData.append('notes', paymentData.notes);
      
      if (proofFile) {
        formData.append('proof_file', proofFile);
      }

      const response = await fetch(`${apiBase}/payables/${payable.id}/payment`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStep('confirmation');
        setTimeout(() => {
          onSuccess();
          onClose();
          // Reset
          setStep('method');
          setPaymentData({
            payment_amount: '',
            payment_date: new Date().toISOString().split('T')[0],
            payment_reference: '',
            bank_account: '',
            notes: '',
          });
          setProofFile(null);
        }, 3000);
      } else {
        alert(`Gagal memproses pembayaran: ${result.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: 'transfer',
      name: 'Transfer Bank',
      icon: BuildingLibraryIcon,
      description: 'Transfer melalui internet/mobile banking',
      popular: true,
    },
    {
      id: 'cash',
      name: 'Tunai',
      icon: BanknotesIcon,
      description: 'Pembayaran cash/tunai',
      popular: false,
    },
    {
      id: 'check',
      name: 'Cek/Giro',
      icon: CreditCardIcon,
      description: 'Pembayaran menggunakan cek atau giro',
      popular: false,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <BanknotesIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Pembayaran Hutang</h2>
                <p className="text-green-100 text-sm">Checkout - Invoice #{payable.vendor_invoice_number}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-8 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {['method', 'details', 'confirmation'].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${
                  step === s
                    ? 'bg-green-600 text-white shadow-lg scale-110'
                    : idx < ['method', 'details', 'confirmation'].indexOf(step)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {idx < ['method', 'details', 'confirmation'].indexOf(step) ? '✓' : idx + 1}
                </div>
                {idx < 2 && (
                  <div className={`w-16 h-1 mx-2 ${
                    idx < ['method', 'details', 'confirmation'].indexOf(step)
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'method' && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Detail Pesanan</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vendor</span>
                    <span className="font-bold text-gray-900">{payable.vendor_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice</span>
                    <span className="font-semibold text-gray-700">{payable.vendor_invoice_number}</span>
                  </div>
                  <div className="border-t-2 border-blue-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-semibold">Total Tagihan</span>
                      <span className="text-2xl font-black text-blue-600">
                        {formatCurrency(payable.remaining_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Pilih Metode Pembayaran</h3>
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`w-full p-5 rounded-2xl border-2 transition-all text-left hover:shadow-lg ${
                          paymentMethod === method.id
                            ? 'bg-green-50 border-green-600 shadow-md'
                            : 'bg-white border-gray-200 hover:border-green-400'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            paymentMethod === method.id ? 'bg-green-600' : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-6 h-6 ${
                              paymentMethod === method.id ? 'text-white' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-gray-900">{method.name}</p>
                              {method.popular && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-bold rounded-full">
                                  POPULER
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{method.description}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === method.id
                              ? 'border-green-600 bg-green-600'
                              : 'border-gray-300'
                          }`}>
                            {paymentMethod === method.id && (
                              <div className="w-3 h-3 bg-white rounded-full" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => {
                  setPaymentData(prev => ({
                    ...prev,
                    payment_amount: payable.remaining_amount.toString(),
                  }));
                  setStep('details');
                }}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Lanjutkan →
              </button>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              {/* Payment Amount */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Jumlah Pembayaran <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={paymentData.payment_amount}
                    onChange={(e) => handlePaymentAmountChange(e.target.value)}
                    required
                    min="0"
                    max={payable.remaining_amount}
                    className="w-full pl-16 pr-6 py-5 text-3xl font-black text-green-600 border-2 border-green-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-200 transition-all bg-white"
                    placeholder="0"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Maksimal: {formatCurrency(payable.remaining_amount)}</span>
                  <button
                    type="button"
                    onClick={() => handlePaymentAmountChange(payable.remaining_amount.toString())}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Bayar Penuh
                  </button>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Pembayaran <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarDaysIcon className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={paymentData.payment_date}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, payment_date: e.target.value }))}
                      required
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nomor Referensi
                  </label>
                  <input
                    type="text"
                    value={paymentData.payment_reference}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_reference: e.target.value }))}
                    placeholder="Contoh: TRF123456789"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank / Rekening
                  </label>
                  <input
                    type="text"
                    value={paymentData.bank_account}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, bank_account: e.target.value }))}
                    placeholder="Contoh: BCA 1234567890"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catatan (Optional)
                  </label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Tambahkan catatan pembayaran..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Bukti Pembayaran
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-500 transition-all">
                    <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      className="hidden"
                      id="proof-upload"
                    />
                    <label
                      htmlFor="proof-upload"
                      className="cursor-pointer text-green-600 hover:text-green-700 font-semibold"
                    >
                      Pilih File
                    </label>
                    {proofFile && (
                      <p className="mt-2 text-sm text-gray-600">📎 {proofFile.name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG, atau PDF (Max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Security Note */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex gap-3">
                <ShieldCheckIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">🔒 Transaksi Aman</p>
                  <p>Data pembayaran Anda dilindungi dengan enkripsi tingkat bank.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('method')}
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  ← Kembali
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !paymentData.payment_amount || parseFloat(paymentData.payment_amount) <= 0}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Memproses...
                    </span>
                  ) : (
                    `Bayar ${formatCurrency(parseFloat(paymentData.payment_amount) || 0)}`
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'confirmation' && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircleIcon className="w-16 h-16 text-green-600" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-3">
                Pembayaran Berhasil! 🎉
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                Transaksi Anda telah diproses
              </p>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 max-w-md mx-auto border-2 border-green-200">
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah Dibayar</span>
                    <span className="font-black text-green-600">
                      {formatCurrency(parseFloat(paymentData.payment_amount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Metode</span>
                    <span className="font-semibold text-gray-900 capitalize">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal</span>
                    <span className="font-semibold text-gray-900">{paymentData.payment_date}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Halaman akan tertutup otomatis...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
