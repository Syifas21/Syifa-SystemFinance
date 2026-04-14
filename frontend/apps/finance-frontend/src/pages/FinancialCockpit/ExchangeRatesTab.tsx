import React, { useState, useEffect, useMemo } from 'react';
import {
  exchangeRatesAPI,
  ExchangeRate,
  CreateExchangeRateDto,
  UpdateExchangeRateDto,
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
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

const ExchangeRatesTab: React.FC = () => {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const { toasts, hideToast, success, error } = useToast();

  const [formData, setFormData] = useState<CreateExchangeRateDto>({
    currency_from: '',
    currency_to: '',
    rate: 0,
    effective_date: new Date().toISOString().split('T')[0],
    is_active: true,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Popular currencies for quick selection
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'CNY', 'IDR', 'MYR', 'THB'];

  // Fetch exchange rates
  const fetchExchangeRates = async () => {
    setLoading(true);
    try {
      const params = filterActive !== 'all' ? { is_active: filterActive === 'active' } : undefined;
      const response = await exchangeRatesAPI.getAll(params);
      if (response.success && response.data) {
        setExchangeRates(response.data);
      }
    } catch (err: any) {
      error(err.message || 'Gagal mengambil data kurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
  }, [filterActive]);

  // Filter exchange rates
  const filteredRates = useMemo(() => {
    if (!searchQuery) return exchangeRates;
    
    return exchangeRates.filter(
      (rate) =>
        rate.currency_from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rate.currency_to.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [exchangeRates, searchQuery]);

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.currency_from.trim()) {
      errors.currency_from = 'Mata uang asal wajib diisi';
    } else if (formData.currency_from.length !== 3) {
      errors.currency_from = 'Kode mata uang harus 3 karakter';
    }

    if (!formData.currency_to.trim()) {
      errors.currency_to = 'Mata uang tujuan wajib diisi';
    } else if (formData.currency_to.length !== 3) {
      errors.currency_to = 'Kode mata uang harus 3 karakter';
    }

    if (formData.currency_from === formData.currency_to) {
      errors.currency_to = 'Mata uang asal dan tujuan tidak boleh sama';
    }

    if (!formData.rate || formData.rate <= 0) {
      errors.rate = 'Nilai kurs harus lebih dari 0';
    }

    if (!formData.effective_date) {
      errors.effective_date = 'Tanggal efektif wajib diisi';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number = value;
    if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (name === 'currency_from' || name === 'currency_to') {
      processedValue = value.toUpperCase();
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

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

  // Open modal
  const openModal = (rate?: ExchangeRate) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({
        currency_from: rate.currency_from,
        currency_to: rate.currency_to,
        rate: typeof rate.rate === 'string' ? parseFloat(rate.rate) : rate.rate,
        effective_date: rate.effective_date.split('T')[0],
        is_active: rate.is_active,
      });
    } else {
      setEditingRate(null);
      setFormData({
        currency_from: '',
        currency_to: '',
        rate: 0,
        effective_date: new Date().toISOString().split('T')[0],
        is_active: true,
      });
    }
    setValidationErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRate(null);
    setFormData({
      currency_from: '',
      currency_to: '',
      rate: 0,
      effective_date: new Date().toISOString().split('T')[0],
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
      if (editingRate) {
        const updateData: UpdateExchangeRateDto = {
          currency_from: formData.currency_from,
          currency_to: formData.currency_to,
          rate: formData.rate,
          effective_date: formData.effective_date,
          is_active: formData.is_active,
        };
        
        await exchangeRatesAPI.update(editingRate.id, updateData);
        success('Kurs berhasil diupdate');
      } else {
        await exchangeRatesAPI.create(formData);
        success('Kurs berhasil ditambahkan');
      }

      await fetchExchangeRates();
      closeModal();
    } catch (err: any) {
      error(err.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    setLoading(true);
    try {
      await exchangeRatesAPI.delete(deleteConfirm.id);
      success('Kurs berhasil dihapus');
      await fetchExchangeRates();
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (err: any) {
      error(err.message || 'Gagal menghapus data');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format number
  const formatRate = (rate: string | number) => {
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(numRate);
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
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari mata uang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
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
          Tambah Kurs
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pasangan Mata Uang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nilai Kurs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Efektif
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
              {loading && exchangeRates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="mt-2">Memuat data...</p>
                  </td>
                </tr>
              ) : filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchQuery ? 'Tidak ada data yang cocok dengan pencarian' : 'Belum ada data kurs'}
                  </td>
                </tr>
              ) : (
                filteredRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {rate.currency_from}
                        </span>
                        <ArrowsRightLeftIcon className="h-4 w-4 mx-2 text-gray-400" />
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {rate.currency_to}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatRate(rate.rate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(rate.effective_date)}
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
        title={editingRate ? 'Edit Kurs Mata Uang' : 'Tambah Kurs Mata Uang'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dari Mata Uang <span className="text-red-500">*</span>
              </label>
              <select
                name="currency_from"
                value={formData.currency_from}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                  ${validationErrors.currency_from ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Pilih...</option>
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
              {validationErrors.currency_from && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.currency_from}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ke Mata Uang <span className="text-red-500">*</span>
              </label>
              <select
                name="currency_to"
                value={formData.currency_to}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                  ${validationErrors.currency_to ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Pilih...</option>
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
              {validationErrors.currency_to && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.currency_to}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nilai Kurs <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="rate"
              value={formData.rate}
              onChange={handleInputChange}
              step="0.000001"
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                ${validationErrors.rate ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Contoh: 15750.50"
            />
            {validationErrors.rate && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.rate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Efektif <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="effective_date"
              value={formData.effective_date}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                ${validationErrors.effective_date ? 'border-red-500' : 'border-gray-300'}`}
            />
            {validationErrors.effective_date && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.effective_date}</p>
            )}
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
              {loading ? 'Menyimpan...' : editingRate ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={handleDelete}
        title="Hapus Kurs Mata Uang"
        message="Apakah Anda yakin ingin menghapus kurs ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
};

export default ExchangeRatesTab;
