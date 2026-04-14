import React, { useState } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface CreatePayableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apiBase: string;
}

const CreatePayableModal: React.FC<CreatePayableModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  apiBase,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'PO' | 'OPERATIONAL' | 'PROJECT'>('PO');
  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_npwp: '',
    vendor_invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    description: '',
    total_amount: '',
    po_reference: '',
    project_reference: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalAmount = parseFloat(formData.total_amount);
      const subtotal = totalAmount / 1.11;

      const payload = {
        vendor_name: formData.vendor_name,
        vendor_npwp: formData.vendor_npwp || '',
        vendor_invoice_number: formData.vendor_invoice_number || `INV-${Date.now()}`,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        description: `[${selectedType}] ${formData.description}`,
        total_amount: totalAmount,
        po_id: selectedType === 'PO' && formData.po_reference ? formData.po_reference : `${selectedType}-${Date.now()}`,
        items: [
          {
            description: formData.description,
            quantity: 1,
            unit_price: subtotal,
            total: subtotal,
          },
        ],
      };

      const response = await fetch(`${apiBase}/payables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('✅ Payable berhasil dibuat!');
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          vendor_name: '',
          vendor_npwp: '',
          vendor_invoice_number: '',
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: '',
          description: '',
          total_amount: '',
          po_reference: '',
          project_reference: '',
        });
      } else {
        alert(`Gagal membuat payable: ${result.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error creating payable:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                <PlusIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Tambah Hutang Baru</h2>
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
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Tipe Hutang <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(['PO', 'OPERATIONAL', 'PROJECT'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                    selectedType === type
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {type === 'PO' ? '📦 Purchase Order' : type === 'OPERATIONAL' ? '⚙️ Operational' : '🏗️ Project'}
                </button>
              ))}
            </div>
          </div>

          {/* Vendor Information */}
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BuildingOfficeIcon className="w-5 h-5" />
              Informasi Vendor
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Vendor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vendor_name"
                  value={formData.vendor_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="PT. Vendor ABC"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  NPWP Vendor
                </label>
                <input
                  type="text"
                  name="vendor_npwp"
                  value={formData.vendor_npwp}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="01.234.567.8-901.000"
                />
              </div>
            </div>
          </div>

          {/* Invoice Information */}
          <div className="bg-blue-50 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5" />
              Informasi Invoice
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nomor Invoice <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vendor_invoice_number"
                  value={formData.vendor_invoice_number}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="INV-001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="1000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Invoice <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="invoice_date"
                  value={formData.invoice_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
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
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>

            {/* Reference Fields */}
            {selectedType === 'PO' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Referensi PO
                </label>
                <input
                  type="text"
                  name="po_reference"
                  value={formData.po_reference}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="PO-2024-001"
                />
              </div>
            )}

            {selectedType === 'PROJECT' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Referensi Project
                </label>
                <input
                  type="text"
                  name="project_reference"
                  value={formData.project_reference}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="PRJ-2024-001"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deskripsi <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                placeholder="Deskripsi detail tentang hutang ini..."
              />
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex gap-3">
            <InformationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Informasi Penting:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Total amount sudah termasuk PPN 11%</li>
                <li>Pastikan nomor invoice unik dan tidak duplikat</li>
                <li>Data akan langsung masuk ke sistem accounting</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Menyimpan...
                </span>
              ) : (
                '✅ Simpan Hutang'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePayableModal;
