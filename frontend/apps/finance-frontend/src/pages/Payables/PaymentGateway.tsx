import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BanknotesIcon, 
  ClockIcon, 
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

const API_BASE = import.meta.env.VITE_FINANCE_API || 'http://localhost:3002/api';

// Lazy load PDF generator to avoid blocking
const loadPDFGenerator = async () => {
  try {
    return await import('../../utils/receiptGenerator');
  } catch (error) {
    console.error('Failed to load PDF generator:', error);
    return null;
  }
};

interface PayableDetail {
  id: string;
  vendor_name: string;
  vendor_invoice_number: string;
  total_amount: number;
  paid_amount?: number;
  remaining_amount?: number;
  due_date: string;
  status: string;
}

interface BankAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
  swift_code?: string;
}

export default function PaymentGateway() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [payable, setPayable] = useState<PayableDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'instructions' | 'bank-simulation' | 'upload-proof' | 'success'>('instructions');
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [bankSimulationData, setBankSimulationData] = useState({
    accountName: '',
    pin: '',
    amount: ''
  });

  // Company bank account info (hardcoded for demo - should come from API)
  const bankAccounts: BankAccount[] = [
    {
      bank_name: 'Bank Central Asia (BCA)',
      account_number: '1234567890',
      account_holder: 'PT. UNAIS TEKNOLOGI NUSANTARA',
      swift_code: 'CENAIDJA'
    },
    {
      bank_name: 'Bank Mandiri',
      account_number: '0987654321',
      account_holder: 'PT. UNAIS TEKNOLOGI NUSANTARA',
    }
  ];

  const [selectedBank, setSelectedBank] = useState(bankAccounts[0]);

  useEffect(() => {
    fetchPayableDetail();
  }, [id]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchPayableDetail = async () => {
    try {
      console.log('Fetching payable with ID:', id);
      const response = await fetch(`${API_BASE}/payables`);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      console.log('All payables:', result.data);
      const foundPayable = result.data.find((p: any) => p.id === id);
      console.log('Found payable:', foundPayable);
      
      if (foundPayable) {
        // Calculate remaining_amount - force number conversion
        const totalAmount = Number(foundPayable.total_amount) || 0;
        const paidAmount = Number(foundPayable.paid_amount) || 0;
        const calculatedRemaining = totalAmount - paidAmount;
        
        // Use backend's remaining_amount if valid, otherwise calculate
        let remaining = calculatedRemaining;
        if (foundPayable.remaining_amount !== undefined && foundPayable.remaining_amount !== null) {
          remaining = Number(foundPayable.remaining_amount);
        }
        
        console.log('💰 Total Amount:', totalAmount);
        console.log('💵 Paid Amount:', paidAmount);
        console.log('💸 Calculated Remaining:', calculatedRemaining);
        console.log('💸 Final Remaining:', remaining);
        
        setPayable({
          ...foundPayable,
          total_amount: totalAmount,
          remaining_amount: remaining,
          paid_amount: paidAmount
        });
      } else {
        console.error('Payable not found with ID:', id);
        alert('❌ Data pembayaran tidak ditemukan!');
      }
    } catch (error) {
      console.error('Error fetching payable:', error);
      alert('Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`✅ ${label} berhasil disalin!`);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('⚠️ Ukuran file maksimal 5MB');
        return;
      }
      setProofFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBankTransfer = async () => {
    if (!payable || !bankSimulationData.accountName || bankSimulationData.pin.length !== 6) {
      alert('⚠️ Lengkapi semua data terlebih dahulu');
      return;
    }

    // Show loading
    setUploading(true);

    try {
      // Simulate transfer delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate transaction ID
      const transactionId = `TRX${Date.now()}`;
      const now = new Date();
      
      // Try to generate PDF receipt
      const pdfModule = await loadPDFGenerator();
      
      if (pdfModule) {
        try {
          const receiptData = {
            transactionId,
            date: now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: now.toLocaleTimeString('id-ID'),
            fromAccount: '1234567890',
            fromName: bankSimulationData.accountName,
            toAccount: selectedBank.account_number,
            toName: selectedBank.account_holder,
            amount: payable.remaining_amount,
            bank: selectedBank.bank_name,
            reference: `PAY-${payable.vendor_invoice_number}`
          };

          const receiptBlob = await pdfModule.generateTransferReceipt(receiptData);
          pdfModule.downloadReceipt(receiptBlob, `Struk-Transfer-${transactionId}.pdf`);

          const receiptFile = new File([receiptBlob], `Struk-${transactionId}.pdf`, { type: 'application/pdf' });
          setProofFile(receiptFile);
          
          alert('✅ Transfer Berhasil!\n\nStruk PDF telah otomatis di-download dan siap untuk di-upload.');
        } catch (pdfError) {
          console.error('PDF generation failed:', pdfError);
          alert('✅ Transfer Berhasil!\n\nSilakan upload bukti transfer secara manual.');
        }
      } else {
        alert('✅ Transfer Berhasil!\n\nSilakan upload bukti transfer untuk menyelesaikan pembayaran.');
      }
      
      // Move to upload step
      setStep('upload-proof');
    } catch (error) {
      console.error('Error simulating transfer:', error);
      alert('❌ Terjadi kesalahan saat simulasi transfer');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!proofFile || !payable) {
      alert('❌ Silakan pilih file bukti transfer terlebih dahulu');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('payment_proof', proofFile);
      formData.append('payment_date', new Date().toISOString().split('T')[0]);
      formData.append('amount', payable.remaining_amount.toString());
      formData.append('payment_method', 'TRANSFER');
      formData.append('bank_name', selectedBank.bank_name);
      formData.append('account_number', selectedBank.account_number);
      formData.append('account_holder', selectedBank.account_holder);
      formData.append('reference_number', `PAY-${Date.now()}`);
      formData.append('notes', `Transfer via Payment Gateway - ${selectedBank.bank_name}`);

      const response = await fetch(`${API_BASE}/payables/${id}/payments`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();
      
      if (result.success) {
        setStep('success');
      } else {
        alert('❌ Gagal: ' + result.message);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('❌ Gagal upload bukti transfer: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!payable) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-semibold">Data pembayaran tidak ditemukan</p>
          <button
            onClick={() => navigate('/finance/payables')}
            className="mt-4 px-6 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary-light/80"
          >
            Kembali ke Payables
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-dark text-white py-6 px-4 shadow-xl">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/finance/payables')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Kembali ke Daftar Tagihan
          </button>
          <h1 className="text-3xl font-bold mb-2">Payment Gateway</h1>
          <p className="text-blue-100">Selesaikan pembayaran Anda dengan aman</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Timer Warning */}
        {step !== 'success' && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-center gap-3 ${
            timeLeft < 600 ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
          }`}>
            <ClockIcon className={`w-8 h-8 ${timeLeft < 600 ? 'text-red-600' : 'text-yellow-600'}`} />
            <div className="flex-1">
              <p className="font-semibold text-gray-800">
                {timeLeft > 0 ? 'Selesaikan dalam:' : 'Waktu Habis!'}
              </p>
              <p className={`text-2xl font-bold ${timeLeft < 600 ? 'text-red-600' : 'text-yellow-600'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
            {timeLeft === 0 && (
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            )}
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Detail Tagihan</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Vendor:</span>
              <span className="font-semibold">{payable.vendor_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">No. Invoice:</span>
              <span className="font-semibold">{payable.vendor_invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jatuh Tempo:</span>
              <span className="font-semibold">{new Date(payable.due_date).toLocaleDateString('id-ID')}</span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Total Bayar:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(payable.remaining_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Step */}
        {step === 'instructions' && (
          <>
            {/* Bank Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BanknotesIcon className="w-6 h-6 text-blue-600" />
                Pilih Rekening Tujuan
              </h2>
              <div className="grid gap-3">
                {bankAccounts.map((bank, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedBank(bank)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedBank === bank
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-bold text-gray-800 mb-1">{bank.bank_name}</div>
                    <div className="text-sm text-gray-600">a/n {bank.account_holder}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Transfer Instructions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Instruksi Transfer</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Bank</span>
                    <span className="font-bold text-gray-800">{selectedBank.bank_name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Nomor Rekening</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xl text-blue-600">{selectedBank.account_number}</span>
                      <button
                        onClick={() => copyToClipboard(selectedBank.account_number, 'Nomor rekening')}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <DocumentDuplicateIcon className="w-5 h-5 text-blue-600" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Atas Nama</span>
                    <span className="font-semibold text-gray-800">{selectedBank.account_holder}</span>
                  </div>
                  {selectedBank.swift_code && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">SWIFT Code</span>
                      <span className="font-semibold text-gray-800">{selectedBank.swift_code}</span>
                    </div>
                  )}
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Jumlah Transfer</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(payable.remaining_amount)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(payable.remaining_amount.toString(), 'Jumlah transfer')}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <DocumentDuplicateIcon className="w-5 h-5 text-green-600" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ Transfer dengan jumlah PERSIS untuk verifikasi otomatis
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <h3 className="font-bold text-yellow-800 mb-2">⚠️ Penting:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Transfer sesuai jumlah yang tertera</li>
                  <li>• Simpan bukti transfer dari mobile banking</li>
                  <li>• Upload bukti transfer sebelum waktu habis</li>
                  <li>• Pembayaran akan diverifikasi maksimal 1x24 jam</li>
                </ul>
              </div>
            </div>

            {/* Next Step Button */}
            <button
              onClick={() => {
                console.log('🔘 Tombol Lanjut diklik');
                console.log('Payable:', payable);
                console.log('Remaining amount:', payable?.remaining_amount);
                setStep('bank-simulation');
              }}
              disabled={!payable || !payable.remaining_amount || Number(payable.remaining_amount) <= 0}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!payable ? 'Loading data...' : (Number(payable.remaining_amount) <= 0) ? `Jumlah pembayaran tidak valid: ${formatCurrency(payable.remaining_amount || 0)}` : 'Klik untuk lanjut'}
            >
              <BanknotesIcon className="w-6 h-6" />
              Lanjut ke Mobile Banking
            </button>
            
            {/* Debug Info */}
            {payable && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                Debug: Total={formatCurrency(payable.total_amount)}, Paid={formatCurrency(payable.paid_amount || 0)}, Remaining={formatCurrency(payable.remaining_amount || 0)}
              </div>
            )}
          </>
        )}

        {/* Bank Simulation Step */}
        {step === 'bank-simulation' && payable && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            {/* Simulasi Mobile Banking Header */}
            <div className="bg-primary-dark rounded-t-xl -m-6 mb-6 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <BanknotesIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">{selectedBank.bank_name}</h2>
                    <p className="text-blue-100 text-sm">Mobile Banking</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-xs">Simulasi</p>
                  <p className="text-white text-sm font-semibold">{new Date().toLocaleTimeString('id-ID')}</p>
                </div>
              </div>
            </div>

            {/* Transfer Form Simulation */}
            <div className="space-y-4">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h3 className="font-bold text-blue-900 mb-3">Transfer Antar Bank</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Dari Rekening
                    </label>
                    <input
                      type="text"
                      value={bankSimulationData.accountName}
                      onChange={(e) => setBankSimulationData({...bankSimulationData, accountName: e.target.value})}
                      placeholder="Nama pemilik rekening"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Ke Rekening</p>
                    <p className="font-bold text-gray-800">{selectedBank.account_number}</p>
                    <p className="text-sm text-gray-600">{selectedBank.account_holder}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedBank.bank_name}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Jumlah Transfer
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                      <input
                        type="text"
                        value={payable.remaining_amount.toLocaleString('id-ID')}
                        readOnly
                        className="w-full pl-10 pr-3 py-3 border-2 border-green-300 rounded-lg text-lg font-bold text-green-600 bg-green-50"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Jumlah sudah ditentukan oleh sistem</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      PIN Transaksi (6 digit)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={bankSimulationData.pin}
                      onChange={(e) => setBankSimulationData({...bankSimulationData, pin: e.target.value})}
                      placeholder="******"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest"
                    />
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <span className="font-bold">⚠️ Perhatian:</span> Ini adalah simulasi transfer. 
                  Struk akan otomatis di-generate setelah Anda klik "Transfer".
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('instructions')}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={handleBankTransfer}
                  disabled={!bankSimulationData.accountName || bankSimulationData.pin.length !== 6 || uploading}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Transfer Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Proof Step */}
        {step === 'upload-proof' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CloudArrowUpIcon className="w-6 h-6 text-blue-600" />
              Upload Bukti Transfer
            </h2>

            {/* Success message from simulation */}
            {proofFile && !proofPreview && (
              <div className="mb-4 bg-green-50 border-2 border-green-300 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-800">Struk Transfer Siap!</p>
                    <p className="text-sm text-gray-600 mt-1">
                      File: <span className="font-mono text-xs">{proofFile.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Struk telah otomatis di-attach. Klik "Konfirmasi" untuk menyelesaikan pembayaran.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Foto Struk Transfer <span className="text-red-500">*</span>
              </label>
              
              {!proofFile && !proofPreview ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                  <CloudArrowUpIcon className="w-16 h-16 text-blue-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Klik untuk upload foto</p>
                  <p className="text-xs text-gray-500">JPG, PNG, PDF (Max 5MB)</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={proofPreview}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain rounded-xl border-2 border-green-300"
                  />
                  <button
                    onClick={() => {
                      setProofFile(null);
                      setProofPreview('');
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('instructions')}
                disabled={uploading}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Kembali
              </button>
              <button
                onClick={handleSubmitProof}
                disabled={!proofFile || uploading}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-6 h-6" />
                    Konfirmasi & Submit
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h2>
            <p className="text-gray-600 mb-6">
              Bukti transfer Anda telah diterima dan sedang dalam proses verifikasi.
              <br />
              Kami akan memverifikasi pembayaran maksimal 1x24 jam.
            </p>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700">
                Status pembayaran akan diperbarui setelah verifikasi selesai.
                <br />
                Anda akan menerima notifikasi email.
              </p>
            </div>

            <button
              onClick={() => navigate('/finance/payables')}
              className="w-full py-3 bg-primary-dark text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Kembali ke Daftar Tagihan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
