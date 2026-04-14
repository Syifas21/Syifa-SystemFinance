import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface OverheadAllocation {
  id: number;
  cost_category: string;
  target_percentage?: number;
  allocation_percentage_to_hpp: number;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

const OverheadAllocationsTab: React.FC = () => {
  const [allocations, setAllocations] = useState<OverheadAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<OverheadAllocation | null>(null);
  const [formData, setFormData] = useState({
    cost_category: '',
    target_percentage: '',
    allocation_percentage_to_hpp: '',
  });

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/overhead-allocations`);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        setAllocations([]);
        return;
      }
      
      const result = await response.json();
      if (result.success) {
        setAllocations(result.data);
      } else {
        setAllocations([]);
      }
    } catch (error) {
      console.error('Error fetching allocations:', error);
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingAllocation
        ? `${API_BASE}/overhead-allocations/${editingAllocation.id}`
        : `${API_BASE}/overhead-allocations`;

      const method = editingAllocation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cost_category: formData.cost_category,
          target_percentage: formData.target_percentage
            ? parseFloat(formData.target_percentage)
            : null,
          allocation_percentage_to_hpp: parseFloat(formData.allocation_percentage_to_hpp),
        }),
      });

      if (!response.ok) {
        alert(`❌ Error: ${response.status} ${response.statusText}`);
        return;
      }

      const result = await response.json();

      if (result.success) {
        alert(
          editingAllocation
            ? '✅ Alokasi overhead berhasil diperbarui!'
            : '✅ Alokasi overhead berhasil ditambahkan!'
        );
        fetchAllocations();
        closeModal();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving allocation:', error);
      alert('❌ Gagal menyimpan alokasi overhead');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus alokasi overhead ini?')) return;

    try {
      const response = await fetch(`${API_BASE}/overhead-allocations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        alert(`❌ Error: ${response.status} ${response.statusText}`);
        return;
      }

      const result = await response.json();

      if (result.success) {
        alert('✅ Alokasi overhead berhasil dihapus!');
        fetchAllocations();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting allocation:', error);
      alert('❌ Gagal menghapus alokasi overhead');
    }
  };

  const openModal = (allocation?: OverheadAllocation) => {
    if (allocation) {
      setEditingAllocation(allocation);
      setFormData({
        cost_category: allocation.cost_category,
        target_percentage: allocation.target_percentage?.toString() || '',
        allocation_percentage_to_hpp: allocation.allocation_percentage_to_hpp.toString(),
      });
    } else {
      setEditingAllocation(null);
      setFormData({
        cost_category: '',
        target_percentage: '',
        allocation_percentage_to_hpp: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAllocation(null);
    setFormData({
      cost_category: '',
      target_percentage: '',
      allocation_percentage_to_hpp: '',
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
          <h3 className="text-xl font-bold text-gray-900">Alokasi Overhead</h3>
          <p className="text-sm text-gray-600 mt-1">
            Kelola persentase alokasi biaya overhead ke HPP
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Tambah Alokasi
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Overhead:</strong> Biaya tidak langsung seperti sewa, listrik, gaji admin yang
          dialokasikan ke HPP (Harga Pokok Penjualan) untuk perhitungan cost proyek.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Kategori Biaya
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Target (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Alokasi ke HPP (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Terakhir Update
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allocations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <p className="text-lg font-medium">Belum ada alokasi overhead</p>
                  <p className="text-sm">Klik "Tambah Alokasi" untuk menambahkan</p>
                </td>
              </tr>
            ) : (
              allocations.map((allocation) => (
                <tr key={allocation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {allocation.cost_category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {allocation.target_percentage ? `${allocation.target_percentage}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      {allocation.allocation_percentage_to_hpp}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {allocation.updated_at
                      ? new Date(allocation.updated_at).toLocaleDateString('id-ID')
                      : '-'}
                    {allocation.updated_by && (
                      <div className="text-xs text-gray-400">oleh {allocation.updated_by}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openModal(allocation)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(allocation.id)}
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
                {editingAllocation ? 'Edit Alokasi Overhead' : 'Tambah Alokasi Overhead'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori Biaya <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cost_category}
                  onChange={(e) => setFormData({ ...formData, cost_category: e.target.value })}
                  placeholder="Contoh: Sewa Kantor, Listrik, Gaji Admin"
                  required
                  disabled={!!editingAllocation}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Persentase (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.target_percentage}
                  onChange={(e) => setFormData({ ...formData, target_percentage: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Target overhead dari total revenue</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alokasi ke HPP (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.allocation_percentage_to_hpp}
                  onChange={(e) =>
                    setFormData({ ...formData, allocation_percentage_to_hpp: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Persentase biaya ini yang dialokasikan ke HPP proyek
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingAllocation ? 'Perbarui' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverheadAllocationsTab;
