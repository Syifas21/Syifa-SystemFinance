import React, { useState, useEffect, useMemo } from 'react';
import {
  overheadAllocationsAPI,
  OverheadAllocation,
  CreateOverheadAllocationDto,
  UpdateOverheadAllocationDto,
} from '../api';
import { Layout, Modal, ConfirmDialog, Toast } from '../components';
import { useToast } from '../hooks/useToast';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';

const OverheadAllocations: React.FC = () => {
  const [allocations, setAllocations] = useState<OverheadAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<OverheadAllocation | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const { toasts, hideToast, success, error } = useToast();

  const [formData, setFormData] = useState<CreateOverheadAllocationDto>({
    cost_category: '',
    target_percentage: null,
    allocation_percentage_to_hpp: 0,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch allocations
  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const data = await overheadAllocationsAPI.getAll();
      setAllocations(data);
    } catch (err: any) {
      error(err.message || 'Gagal mengambil data overhead allocations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  // Filter allocations
  const filteredAllocations = useMemo(() => {
    if (!searchQuery) return allocations;
    
    return allocations.filter((allocation) =>
      allocation.cost_category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allocations, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalAllocation = allocations.reduce((sum, a) => 
      sum + (typeof a.allocation_percentage_to_hpp === 'string' 
        ? parseFloat(a.allocation_percentage_to_hpp) 
        : a.allocation_percentage_to_hpp), 0);
    
    const avgAllocation = allocations.length > 0 ? totalAllocation / allocations.length : 0;
    
    const withTarget = allocations.filter(a => a.target_percentage !== null).length;
    
    return {
      total: allocations.length,
      totalAllocation: totalAllocation.toFixed(2),
      avgAllocation: avgAllocation.toFixed(2),
      withTarget,
    };
  }, [allocations]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.cost_category.trim()) {
      errors.cost_category = 'Kategori biaya wajib diisi';
    }

    if (formData.allocation_percentage_to_hpp === undefined || formData.allocation_percentage_to_hpp === null) {
      errors.allocation_percentage_to_hpp = 'Allocation to HPP wajib diisi';
    } else if (formData.allocation_percentage_to_hpp < 0) {
      errors.allocation_percentage_to_hpp = 'Persentase tidak boleh negatif';
    } else if (formData.allocation_percentage_to_hpp > 100) {
      errors.allocation_percentage_to_hpp = 'Persentase tidak boleh lebih dari 100%';
    }

    if (formData.target_percentage !== null && formData.target_percentage !== undefined) {
      if (formData.target_percentage < 0) {
        errors.target_percentage = 'Target tidak boleh negatif';
      } else if (formData.target_percentage > 100) {
        errors.target_percentage = 'Target tidak boleh lebih dari 100%';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  const openModal = (allocation?: OverheadAllocation) => {
    if (allocation) {
      setEditingAllocation(allocation);
      setFormData({
        cost_category: allocation.cost_category,
        target_percentage: allocation.target_percentage !== null 
          ? (typeof allocation.target_percentage === 'string' 
              ? parseFloat(allocation.target_percentage) 
              : allocation.target_percentage)
          : null,
        allocation_percentage_to_hpp: typeof allocation.allocation_percentage_to_hpp === 'string' 
          ? parseFloat(allocation.allocation_percentage_to_hpp) 
          : allocation.allocation_percentage_to_hpp,
      });
    } else {
      setEditingAllocation(null);
      setFormData({
        cost_category: '',
        target_percentage: null,
        allocation_percentage_to_hpp: 0,
      });
    }
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAllocation(null);
    setFormData({
      cost_category: '',
      target_percentage: null,
      allocation_percentage_to_hpp: 0,
    });
    setValidationErrors({});
  };

  // Handle save (create or update)
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingAllocation) {
        await overheadAllocationsAPI.update(editingAllocation.id, formData);
        success('Overhead allocation berhasil diupdate');
      } else {
        await overheadAllocationsAPI.create(formData);
        success('Overhead allocation berhasil ditambahkan');
      }
      await fetchAllocations();
      closeModal();
    } catch (err: any) {
      error(err.message || 'Gagal menyimpan overhead allocation');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    setLoading(true);
    try {
      await overheadAllocationsAPI.delete(deleteConfirm.id);
      success('Overhead allocation berhasil dihapus');
      await fetchAllocations();
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (err: any) {
      error(err.message || 'Gagal menghapus overhead allocation');
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
              <div className="p-3 bg-indigo-100 rounded-lg">
                <ChartPieIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Overhead Cost Allocations
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Kelola alokasi biaya overhead ke HPP per kategori
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
                placeholder="Cari kategori biaya..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              Tambah Allocation
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-medium">Total Categories</p>
                  <p className="text-2xl font-bold text-indigo-900 mt-1">{stats.total}</p>
                </div>
                <ChartPieIcon className="w-10 h-10 text-indigo-400" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Allocation</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalAllocation}%</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Avg Allocation</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{stats.avgAllocation}%</p>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium">With Target</p>
                  <p className="text-2xl font-bold text-amber-900 mt-1">{stats.withTarget}</p>
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
                      Cost Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allocation to HPP %
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
                  {loading && allocations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          <span className="ml-3">Memuat data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAllocations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        <ChartPieIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="font-medium">Tidak ada overhead allocation</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {searchQuery ? 'Coba ubah kata kunci pencarian' : 'Klik tombol "Tambah" untuk membuat allocation baru'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAllocations.map((allocation, index) => (
                      <tr key={allocation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <ChartPieIcon className="w-5 h-5 text-indigo-500" />
                            <span className="text-sm font-medium text-gray-900">{allocation.cost_category}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {allocation.target_percentage !== null ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              {typeof allocation.target_percentage === 'string' 
                                ? parseFloat(allocation.target_percentage).toFixed(2) 
                                : allocation.target_percentage.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {typeof allocation.allocation_percentage_to_hpp === 'string' 
                              ? parseFloat(allocation.allocation_percentage_to_hpp).toFixed(2) 
                              : allocation.allocation_percentage_to_hpp.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(allocation.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openModal(allocation)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ isOpen: true, id: allocation.id })}
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
        title={editingAllocation ? 'Edit Overhead Allocation' : 'Tambah Overhead Allocation'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="cost_category" className="block text-sm font-medium text-gray-700 mb-1">
              Cost Category <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="cost_category"
              name="cost_category"
              value={formData.cost_category}
              onChange={handleInputChange}
              disabled={!!editingAllocation}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                ${validationErrors.cost_category ? 'border-red-500' : 'border-gray-300'}
                ${editingAllocation ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Contoh: Utilities, Rent, Maintenance, etc."
            />
            {validationErrors.cost_category && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.cost_category}</p>
            )}
            {editingAllocation && (
              <p className="mt-1 text-xs text-gray-500">Kategori tidak dapat diubah setelah dibuat</p>
            )}
          </div>

          <div>
            <label htmlFor="target_percentage" className="block text-sm font-medium text-gray-700 mb-1">
              Target Percentage (%) <span className="text-gray-400 text-xs">(Opsional)</span>
            </label>
            <input
              type="number"
              id="target_percentage"
              name="target_percentage"
              value={formData.target_percentage !== null ? formData.target_percentage : ''}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              max="100"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                ${validationErrors.target_percentage ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0.00"
            />
            {validationErrors.target_percentage && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.target_percentage}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Target persentase biaya overhead (kosongkan jika tidak ada target)
            </p>
          </div>

          <div>
            <label htmlFor="allocation_percentage_to_hpp" className="block text-sm font-medium text-gray-700 mb-1">
              Allocation to HPP (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="allocation_percentage_to_hpp"
              name="allocation_percentage_to_hpp"
              value={formData.allocation_percentage_to_hpp}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              max="100"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                ${validationErrors.allocation_percentage_to_hpp ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="0.00"
            />
            {validationErrors.allocation_percentage_to_hpp && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.allocation_percentage_to_hpp}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Persentase alokasi biaya overhead ke HPP (0-100%)
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {editingAllocation ? 'Update' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Hapus Overhead Allocation"
        message="Apakah Anda yakin ingin menghapus allocation ini? Tindakan ini tidak dapat dibatalkan."
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

export default OverheadAllocations;
