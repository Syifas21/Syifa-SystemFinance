import React, { useState, useEffect } from 'react';
import {
  paymentTermsAPI,
  PaymentTerm,
  CreatePaymentTermDto,
} from '../../api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const PaymentTermsTab: React.FC = () => {
  const [terms, setTerms] = useState<PaymentTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<PaymentTerm | null>(null);
  const [formData, setFormData] = useState({
    term_name: '',
    term_code: '',
    days_until_due: '',
    discount_percentage: '',
    discount_days: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const response = await paymentTermsAPI.getAll();
      if (response.success && response.data) {
        setTerms(response.data);
      }
    } catch (error) {
      console.error('Error fetching payment terms:', error);
      alert('⚠️ Gagal mengambil data payment terms');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.term_name || !formData.term_code || !formData.days_until_due) {
      alert('⚠️ Nama, kode, dan jatuh tempo wajib diisi!');
      return;
    }

    const payload: CreatePaymentTermDto = {
      term_name: formData.term_name,
      term_code: formData.term_code,
      days_until_due: parseInt(formData.days_until_due),
      discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : undefined,
      discount_days: formData.discount_days ? parseInt(formData.discount_days) : undefined,
      description: formData.description || undefined,
      is_active: formData.is_active,
    };

    try {
      setLoading(true);
      if (editingTerm) {
        await paymentTermsAPI.update(editingTerm.id, payload);
        alert('✅ Payment term berhasil diperbarui!');
      } else {
        await paymentTermsAPI.create(payload);
        alert('✅ Payment term berhasil ditambahkan!');
      }
      await fetchTerms();
      closeModal();
    } catch (error) {
      console.error('Error saving payment term:', error);
      alert('⚠️ Gagal menyimpan payment term');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus payment term ini?')) return;

    try {
      setLoading(true);
      await paymentTermsAPI.delete(id);
      alert('✅ Payment term berhasil dihapus!');
      await fetchTerms();
    } catch (error) {
      console.error('Error deleting payment term:', error);
      alert('⚠️ Gagal menghapus payment term');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (term?: PaymentTerm) => {
    if (term) {
      setEditingTerm(term);
      setFormData({
        term_name: term.term_name,
        term_code: term.term_code,
        days_until_due: term.days_until_due.toString(),
        discount_percentage: term.discount_percentage ? term.discount_percentage.toString() : '',
        discount_days: term.discount_days ? term.discount_days.toString() : '',
        description: term.description || '',
        is_active: term.is_active,
      });
    } else {
      setEditingTerm(null);
      setFormData({
        term_name: '',
        term_code: '',
        days_until_due: '',
        discount_percentage: '',
        discount_days: '',
        description: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTerm(null);
    setFormData({
      term_name: '',
      term_code: '',
      days_until_due: '',
      discount_percentage: '',
      discount_days: '',
      description: '',
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Termin Pembayaran (Payment Terms)</h3>
          <p className="text-sm text-gray-600 mt-1">
            Kelola TOP (Terms of Payment) untuk invoice dan purchase order
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Tambah Payment Term
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          💡 <strong>Payment Terms:</strong> Mengatur jangka waktu pembayaran invoice. Contoh: Net
          30 = bayar dalam 30 hari, Net 60 = bayar dalam 60 hari.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nama Term
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Jumlah Hari
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Deskripsi
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {terms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <p className="text-lg font-medium">Belum ada payment term</p>
                  <p className="text-sm">Klik "Tambah Payment Term" untuk menambahkan</p>
                </td>
              </tr>
            ) : (
              terms.map((term) => (
                <tr key={term.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{term.term_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                      {term.days_until_due} hari
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{term.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        term.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {term.is_active ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openModal(term)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(term.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">
                {editingTerm ? 'Edit Payment Term' : 'Tambah Payment Term'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Term <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.term_name}
                  onChange={(e) => setFormData({ ...formData, term_name: e.target.value })}
                  placeholder="Contoh: Net 30, Net 60, Due on Receipt"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kode Term <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.term_code}
                  onChange={(e) => setFormData({ ...formData, term_code: e.target.value.toUpperCase() })}
                  placeholder="NET30"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Hari <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.days_until_due}
                  onChange={(e) => setFormData({ ...formData, days_until_due: e.target.value })}
                  placeholder="30"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Jangka waktu pembayaran setelah invoice date
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diskon (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hari Diskon
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.discount_days}
                    onChange={(e) => setFormData({ ...formData, discount_days: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi singkat..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Aktif
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Menyimpan...' : editingTerm ? 'Perbarui' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentTermsTab;
