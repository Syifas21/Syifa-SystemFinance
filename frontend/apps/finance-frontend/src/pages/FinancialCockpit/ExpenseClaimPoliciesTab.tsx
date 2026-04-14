import React, { useState, useEffect } from 'react';
import {
  expenseClaimPoliciesAPI,
  ExpenseClaimPolicy,
  CreateExpenseClaimPolicyDto,
} from '../../api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  ReceiptRefundIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

const ExpenseClaimPoliciesTab: React.FC = () => {
  const [policies, setPolicies] = useState<ExpenseClaimPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ExpenseClaimPolicy | null>(null);
  const [formData, setFormData] = useState({
    policy_name: '',
    policy_code: '',
    max_claim_amount: '',
    requires_receipt: true,
    approval_required: true,
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await expenseClaimPoliciesAPI.getAll();
      if (response.success && response.data) {
        setPolicies(response.data);
      } else {
        console.error('Failed to fetch policies:', response.message);
        setPolicies([]);
      }
    } catch (error) {
      console.error('Error fetching expense policies:', error);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.category || !formData.max_amount) {
      alert('❌ Kategori dan batas maksimal harus diisi!');
      return;
    }

    // Mock save - TODO: Replace with actual API
    const newPolicy: ExpenseClaimPolicy = {
      id: editingPolicy?.id || Date.now(),
      category: formData.category,
      max_amount: parseFloat(formData.max_amount),
      requires_receipt: formData.requires_receipt,
      requires_approval: formData.requires_approval,
      approval_level: formData.approval_level,
      description: formData.description,
      is_active: formData.is_active,
      created_at: new Date().toISOString(),
    };

    if (editingPolicy) {
      setPolicies(policies.map((p) => (p.id === editingPolicy.id ? newPolicy : p)));
      alert('✅ Kebijakan expense berhasil diperbarui!');
    } else {
      setPolicies([...policies, newPolicy]);
      alert('✅ Kebijakan expense berhasil ditambahkan!');
    }

    closeModal();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus kebijakan expense ini?')) return;

    setPolicies(policies.filter((p) => p.id !== id));
    alert('✅ Kebijakan expense berhasil dihapus!');
  };

  const openModal = (policy?: ExpenseClaimPolicy) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData({
        category: policy.category,
        max_amount: policy.max_amount.toString(),
        requires_receipt: policy.requires_receipt,
        requires_approval: policy.requires_approval,
        approval_level: policy.approval_level || '',
        description: policy.description || '',
        is_active: policy.is_active,
      });
    } else {
      setEditingPolicy(null);
      setFormData({
        category: '',
        max_amount: '',
        requires_receipt: true,
        requires_approval: true,
        approval_level: '',
        description: '',
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPolicy(null);
    setFormData({
      category: '',
      max_amount: '',
      requires_receipt: true,
      requires_approval: true,
      approval_level: '',
      description: '',
      is_active: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Kebijakan Klaim Biaya (Expense)</h3>
          <p className="text-sm text-gray-600 mt-1">
            Kelola batas maksimal, approval, dan syarat klaim biaya karyawan
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md hover:shadow-lg"
        >
          <PlusIcon className="w-5 h-5" />
          Tambah Kebijakan
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
        <p className="text-sm text-green-900">
          💡 <strong>Kebijakan Expense:</strong> Menentukan batas maksimal klaim per kategori, apakah perlu bukti struk, dan level approval yang diperlukan. Contoh: Transportasi max Rp 500.000, perlu struk, approval Manager.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-md p-4 border-2 border-green-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-800">Total Kategori</p>
              <p className="text-3xl font-bold text-green-900">{policies.length}</p>
            </div>
            <ReceiptRefundIcon className="w-12 h-12 text-green-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl shadow-md p-4 border-2 border-blue-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-800">Perlu Approval</p>
              <p className="text-3xl font-bold text-blue-900">
                {policies.filter((p) => p.requires_approval).length}
              </p>
            </div>
            <BanknotesIcon className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl shadow-md p-4 border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-800">Kebijakan Aktif</p>
              <p className="text-3xl font-bold text-purple-900">
                {policies.filter((p) => p.is_active).length}
              </p>
            </div>
            <ReceiptRefundIcon className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-green-600 to-emerald-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-white uppercase tracking-wider">
                  Maks. Klaim
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Perlu Struk
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Perlu Approval
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Level Approval
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {policies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <ReceiptRefundIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">Belum ada kebijakan expense</p>
                    <p className="text-sm">Klik "Tambah Kebijakan" untuk menambahkan</p>
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ReceiptRefundIcon className="w-5 h-5 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{policy.category}</p>
                          {policy.description && (
                            <p className="text-xs text-gray-500 mt-1">{policy.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-base font-bold text-gray-900">
                        {formatCurrency(policy.max_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          policy.requires_receipt
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-gray-100 text-gray-800 border border-gray-300'
                        }`}
                      >
                        {policy.requires_receipt ? '✓ Ya' : '✗ Tidak'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          policy.requires_approval
                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                            : 'bg-green-100 text-green-800 border border-green-300'
                        }`}
                      >
                        {policy.requires_approval ? '✓ Ya' : '✗ Auto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                        {policy.approval_level || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          policy.is_active
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-gray-100 text-gray-800 border border-gray-300'
                        }`}
                      >
                        {policy.is_active ? '● Aktif' : '○ Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(policy);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(policy.id);
                          }}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
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
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">
                {editingPolicy ? '✏️ Edit Kebijakan Expense' : '➕ Tambah Kebijakan Expense'}
              </h3>
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Kategori Expense <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Contoh: Transportasi, Akomodasi, Makan & Minum"
                  required
                />
              </div>

              {/* Max Amount */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Batas Maksimal Klaim (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.max_amount}
                  onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="500000"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="Jelaskan detail kebijakan ini..."
                />
              </div>

              {/* Requires Receipt */}
              <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  checked={formData.requires_receipt}
                  onChange={(e) =>
                    setFormData({ ...formData, requires_receipt: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-semibold text-blue-900">
                  Wajib lampirkan bukti struk/invoice
                </label>
              </div>

              {/* Requires Approval */}
              <div className="flex items-center gap-3 bg-orange-50 p-4 rounded-lg border border-orange-200">
                <input
                  type="checkbox"
                  checked={formData.requires_approval}
                  onChange={(e) =>
                    setFormData({ ...formData, requires_approval: e.target.checked })
                  }
                  className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                />
                <label className="text-sm font-semibold text-orange-900">
                  Memerlukan approval atasan
                </label>
              </div>

              {/* Approval Level (conditional) */}
              {formData.requires_approval && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Level Approval
                  </label>
                  <select
                    value={formData.approval_level}
                    onChange={(e) => setFormData({ ...formData, approval_level: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Pilih level approval</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Manager">Manager</option>
                    <option value="Director">Director</option>
                    <option value="Finance">Finance Head</option>
                  </select>
                </div>
              )}

              {/* Is Active */}
              <div className="flex items-center gap-3 bg-green-50 p-4 rounded-lg border border-green-200">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <label className="text-sm font-semibold text-green-900">
                  Kebijakan ini aktif (bisa digunakan karyawan)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {editingPolicy ? '💾 Simpan Perubahan' : '➕ Tambah Kebijakan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseClaimPoliciesTab;
