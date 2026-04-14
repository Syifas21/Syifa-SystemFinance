import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface DiscountPolicy {
  id: string;
  user_role: string;
  max_discount_percentage: number;
  requires_approval_above: number; 
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

const DiscountPoliciesTab: React.FC = () => {
  const [policies, setPolicies] = useState<DiscountPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<DiscountPolicy | null>(null);
  const [formData, setFormData] = useState({
    user_role: '',
    max_discount_percentage: '',
    requires_approval_above: '',
  });

  const userRoles = [
    'ADMIN',
    'SALES',
    'SALES_MANAGER',
    'PROJECT_MANAGER',
    'FINANCE_ADMIN',
    'CEO',
  ];

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/discount-policies`);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        setPolicies([]);
        return;
      }
      
      const result = await response.json();
      if (result.success) {
        setPolicies(result.data);
      } else {
        setPolicies([]);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPolicy
        ? `${API_BASE}/discount-policies/${editingPolicy.id}`
        : `${API_BASE}/discount-policies`;

      const method = editingPolicy ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_role: formData.user_role,
          max_discount_percentage: parseFloat(formData.max_discount_percentage),
          requires_approval_above: parseFloat(formData.requires_approval_above),
        }),
      });

      if (!response.ok) {
        alert(`❌ Error: ${response.status} ${response.statusText}`);
        return;
      }

      const result = await response.json();

      if (result.success) {
        alert(
          editingPolicy
            ? '✅ Kebijakan diskon berhasil diperbarui!'
            : '✅ Kebijakan diskon berhasil ditambahkan!'
        );
        fetchPolicies();
        closeModal();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving policy:', error);
      alert('❌ Gagal menyimpan kebijakan diskon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kebijakan diskon ini?')) return;

    try {
      const response = await fetch(`${API_BASE}/discount-policies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert(`❌ Error: ${response.status} ${response.statusText}`);
        return;
      }

      const result = await response.json();

      if (result.success) {
        alert('✅ Kebijakan diskon berhasil dihapus!');
        fetchPolicies();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      alert('❌ Gagal menghapus kebijakan diskon');
    }
  };

  const openModal = (policy?: DiscountPolicy) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData({
        user_role: policy.user_role,
        max_discount_percentage: policy.max_discount_percentage.toString(),
        requires_approval_above: policy.requires_approval_above.toString(),
      });
    } else {
      setEditingPolicy(null);
      setFormData({
        user_role: '',
        max_discount_percentage: '',
        requires_approval_above: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPolicy(null);
    setFormData({
      user_role: '',
      max_discount_percentage: '',
      requires_approval_above: '',
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
          <h3 className="text-xl font-bold text-gray-900">Discount Policies</h3>
          <p className="text-sm text-gray-600 mt-1">
            Kelola batas maksimum diskon berdasarkan role user
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Policy
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Max Discount (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Requires Approval Above (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Last Updated
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {policies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <p className="text-lg font-medium">Belum ada kebijakan diskon</p>
                  <p className="text-sm">Klik "Add Policy" untuk menambahkan</p>
                </td>
              </tr>
            ) : (
              policies.map((policy) => (
                <tr key={policy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {policy.user_role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {policy.max_discount_percentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {policy.requires_approval_above}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {policy.updated_at
                      ? new Date(policy.updated_at).toLocaleDateString('id-ID')
                      : '-'}
                    {policy.updated_by && (
                      <div className="text-xs text-gray-400">oleh {policy.updated_by}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openModal(policy)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(policy.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPolicy ? 'Edit Discount Policy' : 'Add Discount Policy'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.user_role}
                  onChange={(e) => setFormData({ ...formData, user_role: e.target.value })}
                  required
                  disabled={!!editingPolicy}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Role</option>
                  {userRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Discount (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.max_discount_percentage}
                  onChange={(e) =>
                    setFormData({ ...formData, max_discount_percentage: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requires Approval Above (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.requires_approval_above}
                  onChange={(e) =>
                    setFormData({ ...formData, requires_approval_above: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Diskon di atas nilai ini memerlukan persetujuan atasan
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingPolicy ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountPoliciesTab;
