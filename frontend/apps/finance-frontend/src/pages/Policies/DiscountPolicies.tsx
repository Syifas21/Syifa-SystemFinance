import React, { useState, useEffect, useMemo } from 'react';
import {
  discountPoliciesAPI,
  DiscountPolicy,
  CreateDiscountPolicyDto,
  UpdateDiscountPolicyDto,
  UserRole,
} from '../api';
import { Layout, Modal, ConfirmDialog, Toast } from '../components';
import { useToast } from '../hooks/useToast';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ReceiptPercentIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'EMPLOYEE', label: 'Employee', description: 'Karyawan biasa' },
  { value: 'MANAGER', label: 'Manager', description: 'Manager departemen' },
  { value: 'HR', label: 'HR', description: 'Human Resources' },
  { value: 'FINANCE', label: 'Finance', description: 'Tim Finance' },
  { value: 'ADMIN', label: 'Admin', description: 'Administrator sistem' },
];

const DiscountPolicies: React.FC = () => {
  const [policies, setPolicies] = useState<DiscountPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<DiscountPolicy | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const { toasts, hideToast, success, error } = useToast();

  const [formData, setFormData] = useState<CreateDiscountPolicyDto>({
    user_role: 'EMPLOYEE',
    max_discount_percentage: 0,
    requires_approval_above: null,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch policies
  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await discountPoliciesAPI.getAll();
      setPolicies(data);
    } catch (err: any) {
      error(err.message || 'Gagal mengambil data discount policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Filter policies
  const filteredPolicies = useMemo(() => {
    if (!searchQuery) return policies;
    
    return policies.filter((policy) =>
      policy.user_role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [policies, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const avgMax = policies.length > 0
      ? policies.reduce((sum, p) => sum + (typeof p.max_discount_percentage === 'string' 
          ? parseFloat(p.max_discount_percentage) 
          : p.max_discount_percentage), 0) / policies.length
      : 0;
    
    const withApproval = policies.filter(p => p.requires_approval_above !== null).length;
    const highestMax = policies.length > 0
      ? Math.max(...policies.map(p => typeof p.max_discount_percentage === 'string' 
          ? parseFloat(p.max_discount_percentage) 
          : p.max_discount_percentage))
      : 0;
    
    return {
      total: policies.length,
      avgMax: avgMax.toFixed(2),
      withApproval,
      highestMax: highestMax.toFixed(2),
    };
  }, [policies]);

  // Get available roles (not yet configured)
  const availableRoles = useMemo(() => {
    const usedRoles = policies.map(p => p.user_role);
    return USER_ROLES.filter(r => !usedRoles.includes(r.value));
  }, [policies]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.user_role) {
      errors.user_role = 'Role wajib dipilih';
    }

    if (formData.max_discount_percentage === undefined || formData.max_discount_percentage === null) {
      errors.max_discount_percentage = 'Max discount wajib diisi';
    } else if (formData.max_discount_percentage < 0) {
      errors.max_discount_percentage = 'Discount tidak boleh negatif';
    } else if (formData.max_discount_percentage > 100) {
      errors.max_discount_percentage = 'Discount tidak boleh lebih dari 100%';
    }

    if (formData.requires_approval_above !== null && formData.requires_approval_above !== undefined) {
      if (formData.requires_approval_above < 0) {
        errors.requires_approval_above = 'Approval threshold tidak boleh negatif';
      } else if (formData.requires_approval_above > 100) {
        errors.requires_approval_above = 'Approval threshold tidak boleh lebih dari 100%';
      } else if (formData.requires_approval_above > formData.max_discount_percentage) {
        errors.requires_approval_above = 'Approval threshold tidak boleh melebihi max discount';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : parseFloat(value) || 0) : value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Open modal for create/edit
  const openModal = (policy?: DiscountPolicy) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData({
        user_role: policy.user_role,
        max_discount_percentage: typeof policy.max_discount_percentage === 'string' 
          ? parseFloat(policy.max_discount_percentage) 
          : policy.max_discount_percentage,
        requires_approval_above: policy.requires_approval_above !== null 
          ? (typeof policy.requires_approval_above === 'string' 
              ? parseFloat(policy.requires_approval_above) 
              : policy.requires_approval_above)
          : null,
      });
    } else {
      setEditingPolicy(null);
      setFormData({
        user_role: availableRoles.length > 0 ? availableRoles[0].value : 'EMPLOYEE',
        max_discount_percentage: 0,
        requires_approval_above: null,
      });
    }
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPolicy(null);
    setFormData({
      user_role: 'EMPLOYEE',
      max_discount_percentage: 0,
      requires_approval_above: null,
    });
    setValidationErrors({});
  };

  // Handle save (create or update)
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingPolicy) {
        await discountPoliciesAPI.update(editingPolicy.id, formData);
        success('Discount policy berhasil diupdate');
      } else {
        await discountPoliciesAPI.create(formData);
        success('Discount policy berhasil ditambahkan');
      }
      await fetchPolicies();
      closeModal();
    } catch (err: any) {
      error(err.message || 'Gagal menyimpan discount policy');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    setLoading(true);
    try {
      await discountPoliciesAPI.delete(deleteConfirm.id);
      success('Discount policy berhasil dihapus');
      await fetchPolicies();
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (err: any) {
      error(err.message || 'Gagal menghapus discount policy');
    } finally {
      setLoading(false);
    }
  };

  // Get role label
  const getRoleLabel = (role: UserRole) => {
    return USER_ROLES.find(r => r.value === role)?.label || role;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 rounded-lg">
                <ReceiptPercentIcon className="w-8 h-8 text-rose-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Discount Policies
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Kelola kebijakan diskon maksimal per role user
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          {/* Search and Add Button */}
          <div className="flex gap-3 items-center mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => openModal()}
              disabled={availableRoles.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title={availableRoles.length === 0 ? 'Semua role sudah dikonfigurasi' : ''}
            >
              <PlusIcon className="w-5 h-5" />
              Tambah Policy
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-rose-600 font-medium">Total Policies</p>
                  <p className="text-2xl font-bold text-rose-900 mt-1">{stats.total}</p>
                </div>
                <ReceiptPercentIcon className="w-10 h-10 text-rose-400" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Avg Max Discount</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.avgMax}%</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Highest Discount</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.highestMax}%</p>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium">With Approval</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{stats.withApproval}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Max Discount %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requires Approval Above
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dibuat
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading && policies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                          <span className="ml-3">Memuat data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPolicies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <ReceiptPercentIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="font-medium">Tidak ada discount policy</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Klik tombol "Tambah" untuk membuat policy baru'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPolicies.map((policy, index) => (
                      <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 rounded">
                              <ReceiptPercentIcon className="w-4 h-4 text-rose-600" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900">{getRoleLabel(policy.user_role)}</span>
                              <span className="block text-xs text-gray-500">{policy.user_role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {typeof policy.max_discount_percentage === 'string' 
                              ? parseFloat(policy.max_discount_percentage).toFixed(2) 
                              : policy.max_discount_percentage.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {policy.requires_approval_above !== null ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              &gt; {typeof policy.requires_approval_above === 'string' 
                                ? parseFloat(policy.requires_approval_above).toFixed(2) 
                                : policy.requires_approval_above.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                              <XCircleIcon className="w-4 h-4" />
                              No approval
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(policy.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(policy)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ isOpen: true, id: policy.id })}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        </div>
      </div>

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingPolicy ? 'Edit Discount Policy' : 'Tambah Discount Policy'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="user_role" className="block text-sm font-medium text-gray-700 mb-1">
              User Role <span className="text-red-500">*</span>
            </label>
            <select
              id="user_role"
              name="user_role"
              value={formData.user_role}
              onChange={handleInputChange}
              disabled={!!editingPolicy}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent
                ${validationErrors.user_role ? 'border-red-500' : 'border-gray-300'}
                ${editingPolicy ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              {editingPolicy ? (
                <option value={editingPolicy.user_role}>{getRoleLabel(editingPolicy.user_role)}</option>
              ) : (
                <>
                  {availableRoles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </>
              )}
            </select>
            {validationErrors.user_role && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.user_role}</p>
            )}
            {editingPolicy && (
              <p className="mt-1 text-xs text-gray-500">Role tidak dapat diubah setelah dibuat</p>
            )}
          </div>

          <div>
            <label htmlFor="max_discount_percentage" className="block text-sm font-medium text-gray-700 mb-1">
              Max Discount Percentage (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="max_discount_percentage"
              name="max_discount_percentage"
              value={formData.max_discount_percentage}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              max="100"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent
                ${validationErrors.max_discount_percentage ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0.00"
            />
            {validationErrors.max_discount_percentage && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.max_discount_percentage}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Maksimal diskon yang dapat diberikan oleh role ini (0-100%)
            </p>
          </div>

          <div>
            <label htmlFor="requires_approval_above" className="block text-sm font-medium text-gray-700 mb-1">
              Requires Approval Above (%) <span className="text-gray-400 text-xs">(Opsional)</span>
            </label>
            <input
              type="number"
              id="requires_approval_above"
              name="requires_approval_above"
              value={formData.requires_approval_above !== null ? formData.requires_approval_above : ''}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              max="100"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent
                ${validationErrors.requires_approval_above ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0.00"
            />
            {validationErrors.requires_approval_above && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.requires_approval_above}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Diskon di atas persentase ini memerlukan approval (kosongkan jika tidak perlu approval)
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={closeModal}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {editingPolicy ? 'Update' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Hapus Discount Policy"
        message="Apakah Anda yakin ingin menghapus policy ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => hideToast(toast.id)}
          />
        ))}
      </div>
    </Layout>
  );
};

export default DiscountPolicies;
