import React, { useState, useEffect, useMemo } from 'react';
import {
  taxRatesAPI,
  TaxRate,
  CreateTaxRateDto,
  UpdateTaxRateDto,
} from '../../api';
import { Modal, ConfirmDialog, Toast } from '../../components';
import { useToast } from '../../hooks/useToast';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const TaxRatesTab: React.FC = () => {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const { toasts, hideToast, success, error } = useToast();

  const [formData, setFormData] = useState<CreateTaxRateDto>({
    tax_name: '',
    tax_code: '',
    rate: 0,
    description: '',
    is_active: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch tax rates
  const fetchTaxRates = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching tax rates...');
      const response = await taxRatesAPI.getAll();
      console.log('✅ Response:', response);
      
      if (response.success && response.data) {
        console.log('📊 Setting tax rates:', response.data.length, 'items');
        setTaxRates(response.data);
      } else {
        console.error('❌ Response tidak valid:', response);
        error('Data tidak valid dari server');
        setTaxRates([]);
      }
    } catch (err: any) {
      console.error('❌ Error fetching:', err);
      error(err.message || 'Gagal mengambil data tarif pajak');
      setTaxRates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxRates();
  }, []);

  // Filter tax rates
  const filteredTaxRates = useMemo(() => {
    if (!searchQuery) return taxRates;
    
    return taxRates.filter(
      (rate) =>
        rate.tax_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rate.tax_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rate.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );
  }, [taxRates, searchQuery]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.tax_name.trim()) {
      errors.tax_name = 'Nama pajak wajib diisi';
    }

    if (!formData.tax_code.trim()) {
      errors.tax_code = 'Kode pajak wajib diisi';
    }

    if (formData.rate === undefined || formData.rate === null) {
      errors.rate = 'Tarif pajak wajib diisi';
    } else if (formData.rate < 0 || formData.rate > 100) {
      errors.rate = 'Tarif pajak harus antara 0-100%';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      is_active: e.target.checked,
    }));
  };

  // Open modal for create/edit
  const openModal = (taxRate?: TaxRate) => {
    if (taxRate) {
      setEditingTaxRate(taxRate);
      setFormData({
        tax_name: taxRate.tax_name,
        tax_code: taxRate.tax_code,
        rate: typeof taxRate.rate === 'string' ? parseFloat(taxRate.rate) : taxRate.rate,
        description: taxRate.description || '',
        is_active: taxRate.is_active,
      });
    } else {
      setEditingTaxRate(null);
      setFormData({
        tax_name: '',
        tax_code: '',
        rate: 0,
        description: '',
        is_active: true,
      });
    }
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTaxRate(null);
    setFormData({
      tax_name: '',
      tax_code: '',
      rate: 0,
      description: '',
      is_active: true,
    });
    setValidationErrors({});
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editingTaxRate) {
        // Update
        const updateData: UpdateTaxRateDto = {
          tax_name: formData.tax_name,
          tax_code: formData.tax_code,
          rate: formData.rate,
          description: formData.description,
          is_active: formData.is_active,
        };
        
        console.log('📝 Updating tax rate:', editingTaxRate.id, updateData);
        response = await taxRatesAPI.update(editingTaxRate.id, updateData);
        console.log('✅ Update response:', response);
        
        if (!response.success) {
          error(response.message || 'Gagal mengupdate tarif pajak');
          return;
        }
        
        success('Tarif pajak berhasil diupdate');
      } else {
        // Create
        console.log('➕ Creating tax rate:', formData);
        response = await taxRatesAPI.create(formData);
        console.log('✅ Create response:', response);
        
        if (!response.success) {
          // Check for duplicate error
          if (response.message?.includes('sudah ada') || response.message?.includes('already exists')) {
            error('Data sudah ada! Nama pajak atau kode pajak tersebut sudah terdaftar.');
          } else {
            error(response.message || 'Gagal menambahkan tarif pajak');
          }
          return;
        }
        
        success('Tarif pajak berhasil ditambahkan');
      }

      console.log('🔄 Fetching updated list...');
      await fetchTaxRates();
      closeModal();
    } catch (err: any) {
      console.error('❌ Submit error:', err);
      
      // Handle HTTP errors
      if (err.response) {
        const errorData = await err.response.json().catch(() => ({}));
        if (errorData.message?.includes('sudah ada') || errorData.message?.includes('already exists')) {
          error('Data sudah ada! Nama pajak atau kode pajak tersebut sudah terdaftar.');
        } else {
          error(errorData.message || 'Gagal menyimpan data');
        }
      } else {
        error(err.message || 'Gagal menyimpan data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    setLoading(true);
    try {
      await taxRatesAPI.delete(deleteConfirm.id);
      success('Tarif pajak berhasil dihapus');
      await fetchTaxRates();
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (err: any) {
      error(err.message || 'Gagal menghapus data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toasts */}
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari nama atau kode pajak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Add Button */}
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent
                   rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600
                   hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                   focus:ring-blue-500 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Tambah Tarif Pajak
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Pajak
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarif (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && taxRates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2">Memuat data...</p>
                  </td>
                </tr>
              ) : filteredTaxRates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchQuery ? 'Tidak ada data yang cocok dengan pencarian' : 'Belum ada data tarif pajak'}
                  </td>
                </tr>
              ) : (
                filteredTaxRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rate.tax_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rate.tax_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{rate.rate}%</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {rate.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rate.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Tidak Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openModal(rate)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, id: rate.id })}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTaxRate ? 'Edit Tarif Pajak' : 'Tambah Tarif Pajak'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Pajak <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="tax_name"
              value={formData.tax_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                ${validationErrors.tax_name ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Contoh: PPN"
            />
            {validationErrors.tax_name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.tax_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Pajak <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="tax_code"
              value={formData.tax_code}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                ${validationErrors.tax_code ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Contoh: PPN-11"
            />
            {validationErrors.tax_code && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.tax_code}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarif (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="rate"
              value={formData.rate}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              max="100"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                ${validationErrors.rate ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Contoh: 11.00"
            />
            {validationErrors.rate && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.rate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Deskripsi tarif pajak..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Aktif
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : editingTaxRate ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Hapus Tarif Pajak"
        message="Apakah Anda yakin ingin menghapus tarif pajak ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
};

export default TaxRatesTab;
