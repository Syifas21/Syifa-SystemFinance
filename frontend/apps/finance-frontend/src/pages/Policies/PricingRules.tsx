import React, { useState, useEffect, useMemo } from 'react';
import {
  pricingRulesAPI,
  PricingRule,
  CreatePricingRuleDto,
  UpdatePricingRuleDto,
} from '../api';
import { Layout, Modal, ConfirmDialog, Toast } from '../components';
import { useToast } from '../hooks/useToast';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

const PricingRules: React.FC = () => {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const { toasts, hideToast, success, error } = useToast();

  const [formData, setFormData] = useState<CreatePricingRuleDto>({
    category: '',
    markup_percentage: 0,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch pricing rules
  const fetchPricingRules = async () => {
    setLoading(true);
    try {
      const data = await pricingRulesAPI.getAll();
      setPricingRules(data);
    } catch (err: any) {
      error(err.message || 'Gagal mengambil data pricing rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingRules();
  }, []);

  // Filter pricing rules
  const filteredRules = useMemo(() => {
    if (!searchQuery) return pricingRules;
    
    return pricingRules.filter((rule) =>
      rule.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pricingRules, searchQuery]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.category.trim()) {
      errors.category = 'Kategori wajib diisi';
    }

    if (formData.markup_percentage === undefined || formData.markup_percentage === null) {
      errors.markup_percentage = 'Markup percentage wajib diisi';
    } else if (formData.markup_percentage < 0) {
      errors.markup_percentage = 'Markup tidak boleh negatif';
    } else if (formData.markup_percentage > 100) {
      errors.markup_percentage = 'Markup tidak boleh lebih dari 100%';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
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
  const openModal = (rule?: PricingRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        category: rule.category,
        markup_percentage: typeof rule.markup_percentage === 'string' 
          ? parseFloat(rule.markup_percentage) 
          : rule.markup_percentage,
      });
    } else {
      setEditingRule(null);
      setFormData({
        category: '',
        markup_percentage: 0,
      });
    }
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
    setFormData({
      category: '',
      markup_percentage: 0,
    });
    setValidationErrors({});
  };

  // Handle save (create or update)
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingRule) {
        await pricingRulesAPI.update(editingRule.id, formData);
        success('Pricing rule berhasil diupdate');
      } else {
        await pricingRulesAPI.create(formData);
        success('Pricing rule berhasil ditambahkan');
      }
      await fetchPricingRules();
      closeModal();
    } catch (err: any) {
      error(err.message || 'Gagal menyimpan pricing rule');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    setLoading(true);
    try {
      await pricingRulesAPI.delete(deleteConfirm.id);
      success('Pricing rule berhasil dihapus');
      await fetchPricingRules();
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (err: any) {
      error(err.message || 'Gagal menghapus pricing rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TagIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Pricing Rules
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Kelola aturan markup harga per kategori produk/jasa
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
                placeholder="Cari kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              Tambah Pricing Rule
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Rules</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{pricingRules.length}</p>
                </div>
                <TagIcon className="w-10 h-10 text-purple-400" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Avg Markup</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {pricingRules.length > 0
                      ? (pricingRules.reduce((sum, rule) => sum + (typeof rule.markup_percentage === 'string' ? parseFloat(rule.markup_percentage) : rule.markup_percentage), 0) / pricingRules.length).toFixed(2)
                      : '0.00'}%
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Highest Markup</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {pricingRules.length > 0
                      ? Math.max(...pricingRules.map(rule => typeof rule.markup_percentage === 'string' ? parseFloat(rule.markup_percentage) : rule.markup_percentage)).toFixed(2)
                      : '0.00'}%
                  </p>
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
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Markup (%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dibuat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diupdate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading && pricingRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                          <span className="ml-3">Memuat data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <TagIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="font-medium">Tidak ada pricing rule</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Klik tombol "Tambah" untuk membuat pricing rule baru'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRules.map((rule, index) => (
                      <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <TagIcon className="w-5 h-5 text-purple-500" />
                            <span className="text-sm font-medium text-gray-900">{rule.category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {typeof rule.markup_percentage === 'string' 
                              ? parseFloat(rule.markup_percentage).toFixed(2) 
                              : rule.markup_percentage.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(rule.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(rule.updated_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(rule)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ isOpen: true, id: rule.id })}
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
        title={editingRule ? 'Edit Pricing Rule' : 'Tambah Pricing Rule'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Kategori <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              disabled={!!editingRule}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent
                ${validationErrors.category ? 'border-red-500' : 'border-gray-300'}
                ${editingRule ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Contoh: Electronics, Furniture, etc."
            />
            {validationErrors.category && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.category}</p>
            )}
            {editingRule && (
              <p className="mt-1 text-xs text-gray-500">Kategori tidak dapat diubah setelah dibuat</p>
            )}
          </div>

          <div>
            <label htmlFor="markup_percentage" className="block text-sm font-medium text-gray-700 mb-1">
              Markup Percentage (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="markup_percentage"
              name="markup_percentage"
              value={formData.markup_percentage}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              max="100"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent
                ${validationErrors.markup_percentage ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0.00"
            />
            {validationErrors.markup_percentage && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.markup_percentage}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Masukkan persentase markup antara 0-100. Contoh: 25.5 untuk 25.5%
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
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {editingRule ? 'Update' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Hapus Pricing Rule"
        message="Apakah Anda yakin ingin menghapus pricing rule ini? Tindakan ini tidak dapat dibatalkan."
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

export default PricingRules;
