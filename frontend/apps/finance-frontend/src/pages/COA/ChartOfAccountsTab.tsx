import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface AccountFormData {
  account_code: string;
  account_name: string;
  account_type: string;
  description: string;
}

const ChartOfAccountsTab: React.FC = () => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
  const [formData, setFormData] = useState<AccountFormData>({
    account_code: '',
    account_name: '',
    account_type: 'ASSET',
    description: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/chartofaccounts');
      const result = await response.json();

      if (result.success && result.data) {
        setAccounts(result.data);
      } else {
        setError(result.message || 'Failed to fetch accounts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ASSET: 'bg-emerald-100 text-emerald-800',
      LIABILITY: 'bg-pink-100 text-pink-800',
      EQUITY: 'bg-yellow-100 text-yellow-800',
      REVENUE: 'bg-blue-100 text-blue-800',
      EXPENSE: 'bg-red-100 text-red-800',
      COST_OF_SERVICE: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ASSET: 'Asset (Aset)',
      LIABILITY: 'Liability (Liabilitas)',
      EQUITY: 'Equity (Ekuitas)',
      REVENUE: 'Revenue (Pendapatan)',
      EXPENSE: 'Expense (Biaya)',
      COST_OF_SERVICE: 'Cost of Service (Harga Pokok)',
    };
    return labels[type] || type;
  };

  const handleCreate = async () => {
    if (!formData.description.trim()) {
      alert('Deskripsi akun wajib diisi');
      return;
    }

    try {
      const response = await fetch('/api/chartofaccounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        await fetchAccounts();
        setShowCreateModal(false);
        resetForm();
        alert('Account created successfully!');
      } else {
        alert(result.message || 'Failed to create account');
      }
    } catch (err) {
      console.error('Error creating account:', err);
      alert('Error creating account');
    }
  };

  const handleEdit = async () => {
    if (!selectedAccount) return;
    if (!formData.description.trim()) {
      alert('Deskripsi akun wajib diisi');
      return;
    }

    try {
      const response = await fetch(`/api/chartofaccounts/${selectedAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        await fetchAccounts();
        setShowEditModal(false);
        setSelectedAccount(null);
        resetForm();
        alert('Account updated successfully!');
      } else {
        alert(result.message || 'Failed to update account');
      }
    } catch (err) {
      console.error('Error updating account:', err);
      alert('Error updating account');
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;

    try {
      const response = await fetch(`/api/chartofaccounts/${selectedAccount.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        await fetchAccounts();
        setShowDeleteModal(false);
        setSelectedAccount(null);
        alert('Account deleted successfully!');
      } else {
        alert(result.message || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Error deleting account');
    }
  };

  const openEditModal = (account: ChartOfAccount) => {
    setSelectedAccount(account);
    setFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      description: account.description || '',
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (account: ChartOfAccount) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      account_code: '',
      account_name: '',
      account_type: 'ASSET',
      description: '',
    });
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !filterType || account.account_type === filterType;

    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-800">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">Error loading data:</span>
          <span>{error}</span>
        </div>
        <button
          onClick={fetchAccounts}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-primary-dark rounded-2xl shadow-lg p-6 relative overflow-hidden mb-6">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent-gold/30 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white drop-shadow-lg">Bagan Akun <span className="text-2xl font-normal">(Chart of Accounts)</span></h1>
              </div>
            </div>
            <p className="text-white/90 text-base font-medium drop-shadow ml-14">
              📊 Daftar seluruh akun yang digunakan dalam sistem akuntansi untuk mencatat transaksi keuangan
            </p>
            <p className="text-white/80 text-sm drop-shadow ml-14 mt-1">
              💡 Setiap transaksi harus dicatat ke akun yang sesuai (contoh: Kas, Bank, Piutang, dll)
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Cari nama akun atau kode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Tipe</option>
            <option value="ASSET">Asset (Aset)</option>
            <option value="LIABILITY">Liability (Liabilitas)</option>
            <option value="EQUITY">Equity (Ekuitas)</option>
            <option value="REVENUE">Revenue (Pendapatan)</option>
            <option value="EXPENSE">Expense (Biaya)</option>
            <option value="COST_OF_SERVICE">Cost of Service (Harga Pokok)</option>
          </select>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary-light/80 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Tambah Akun Baru
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kode Akun
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Akun
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Deskripsi
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm || filterType ? 'No accounts found matching your filters' : 'No accounts available'}
                </td>
              </tr>
            ) : (
              filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.account_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.account_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getAccountTypeColor(account.account_type)}`}>
                      {getAccountTypeLabel(account.account_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {account.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(account)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary-dark text-white shadow-md hover:shadow-lg transition-all duration-200"
                        title="Edit Account"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(account)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
                        title="Delete Account"
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

      {/* Pagination */}
      {filteredAccounts.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredAccounts.length}</span> of{' '}
            <span className="font-medium">{accounts.length}</span> accounts
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {showCreateModal ? 'Create New Account' : 'Edit Account'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Code *
                </label>
                <input
                  type="text"
                  value={formData.account_code}
                  onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Kas"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type *
                </label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                  <option value="EQUITY">Equity</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expense</option>
                  <option value="COST_OF_SERVICE">Cost of Service</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Deskripsi akun harus diisi"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showCreateModal ? handleCreate : handleEdit}
                className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary-light/80 transition-colors"
              >
                {showCreateModal ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Account</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete account <strong>{selectedAccount.account_code} - {selectedAccount.account_name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAccount(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccountsTab;
