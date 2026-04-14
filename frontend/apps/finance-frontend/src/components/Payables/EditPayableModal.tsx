import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  InformationCircleIcon,
  CheckCircleIcon,
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
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  payable_type?: 'PO' | 'OPERATIONAL' | 'PROJECT';
  po_id?: string;
  project_id?: string;
}

interface EditPayableModalProps {
  isOpen: boolean;
  onClose: () => void;
  payable: PayableItem | null;
  onSuccess: () => void;
  apiBase: string;
}

const EditPayableModal: React.FC<EditPayableModalProps> = ({
  isOpen,
  onClose,
  payable,
  onSuccess,
  apiBase,
}) => {
  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_npwp: '',
    vendor_invoice_number: '',
    invoice_date: '',
    due_date: '',
    total_amount: '',
    description: '',
    payable_type: 'PO' as 'PO' | 'OPERATIONAL' | 'PROJECT',
    po_id: '',
    project_id: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form when payable changes
  useEffect(() => {
    if (payable) {
      setFormData({
        vendor_name: payable.vendor_name || '',
        vendor_npwp: payable.vendor_npwp || '',
        vendor_invoice_number: payable.vendor_invoice_number || '',
        invoice_date: payable.invoice_date ? payable.invoice_date.split('T')[0] : '',
        due_date: payable.due_date ? payable.due_date.split('T')[0] : '',
        total_amount: payable.total_amount.toString(),
        description: payable.description || '',
        payable_type: payable.payable_type || 'PO',
        po_id: payable.po_id || '',
        project_id: payable.project_id || '',
      });
    }
  }, [payable]);

  if (!isOpen || !payable) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (type: 'PO' | 'OPERATIONAL' | 'PROJECT') => {
    setFormData((prev) => ({
      ...prev,
      payable_type: type,
      po_id: type === 'PO' ? prev.po_id : '',
      project_id: type === 'PROJECT' ? prev.project_id : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.vendor_name.trim()) {
      setError('Nama vendor wajib diisi');
      return;
    }
    if (!formData.vendor_invoice_number.trim()) {
      setError('Nomor invoice wajib diisi');
      return;
    }
    if (!formData.invoice_date) {
      setError('Tanggal invoice wajib diisi');
      return;
    }
    if (!formData.due_date) {
      setError('Tanggal jatuh tempo wajib diisi');
      return;
    }
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      setError('Total amount harus lebih dari 0');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        vendor_name: formData.vendor_name.trim(),
        vendor_npwp: formData.vendor_npwp.trim() || null,
        vendor_invoice_number: formData.vendor_invoice_number.trim(),
        invoice_date: new Date(formData.invoice_date).toISOString(),
        due_date: new Date(formData.due_date).toISOString(),
        total_amount: parseFloat(formData.total_amount),
        description: formData.description.trim() || null,
        payable_type: formData.payable_type,
        po_id: formData.payable_type === 'PO' && formData.po_id ? formData.po_id.trim() : null,
        project_id: formData.payable_type === 'PROJECT' && formData.project_id ? formData.project_id.trim() : null,
      };

      const response = await fetch(`${apiBase}/payables/${payable.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal update payable');
      }

      // Success
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat update payable');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    {
      type: 'PO' as const,
      label: 'Purchase Order',
      description: 'Hutang dari pembelian barang/jasa',
      icon: '📦',
      color: 'purple',
    },
    {
      type: 'OPERATIONAL' as const,
      label: 'Operasional',
      description: 'Hutang untuk kebutuhan operasional',
      icon: '⚙️',
      color: 'orange',
    },
    {
      type: 'PROJECT' as const,
      label: 'Project',
      description: 'Hutang terkait project tertentu',
      icon: '🎯',
      color: 'cyan',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-3xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <DocumentTextIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Edit Payable</h2>
              <p className="text-blue-100 text-sm">Perbarui informasi hutang usaha</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <InformationCircleIcon className="w-5 h-5 text-red-500" />
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Warning - Paid Amount */}
          {payable.paid_amount > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-xl">
              <div className="flex items-center gap-2">
                <InformationCircleIcon className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Peringatan!</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Payable ini sudah memiliki pembayaran sebesar Rp {payable.paid_amount.toLocaleString('id-ID')}.
                    Perubahan mungkin mempengaruhi kalkulasi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payable Type Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Tipe Payable
            </label>
            <div className="grid grid-cols-3 gap-3">
              {typeOptions.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => handleTypeChange(option.type)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.payable_type === option.type
                      ? `border-${option.color}-500 bg-${option.color}-50`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className={`text-sm font-bold ${
                    formData.payable_type === option.type
                      ? `text-${option.color}-700`
                      : 'text-gray-700'
                  }`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Vendor Information */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">Informasi Vendor</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Vendor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vendor_name"
                  value={formData.vendor_name}
                  onChange={handleInputChange}
                  placeholder="Contoh: PT Supplier Indonesia"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  NPWP Vendor
                </label>
                <input
                  type="text"
                  name="vendor_npwp"
                  value={formData.vendor_npwp}
                  onChange={handleInputChange}
                  placeholder="XX.XXX.XXX.X-XXX.XXX"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <DocumentTextIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">Detail Invoice</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nomor Invoice <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vendor_invoice_number"
                  value={formData.vendor_invoice_number}
                  onChange={handleInputChange}
                  placeholder="Contoh: INV-2024-001"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Invoice <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="invoice_date"
                  value={formData.invoice_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Jatuh Tempo <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Amount (Rp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Total sudah termasuk PPN 11% jika berlaku
                </p>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Deskripsi detail tentang invoice ini..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Reference Fields */}
          {(formData.payable_type === 'PO' || formData.payable_type === 'PROJECT') && (
            <div className="bg-blue-50 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-blue-900">Referensi</h3>
              </div>

              {formData.payable_type === 'PO' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purchase Order ID
                  </label>
                  <input
                    type="text"
                    name="po_id"
                    value={formData.po_id}
                    onChange={handleInputChange}
                    placeholder="Contoh: PO-2024-001"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              )}

              {formData.payable_type === 'PROJECT' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project ID
                  </label>
                  <input
                    type="text"
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleInputChange}
                    placeholder="Contoh: PROJ-2024-001"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPayableModal;
