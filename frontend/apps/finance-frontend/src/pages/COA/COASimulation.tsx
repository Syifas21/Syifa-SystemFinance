import React, { useState } from 'react';
import {
  ChartBarIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  description: string;
  is_active: boolean;
}

const COASimulation: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: 1,
      account_code: '1-1000',
      account_name: 'Kas',
      account_type: 'ASSET',
      description: 'Kas dan setara kas',
      is_active: true,
    },
    {
      id: 2,
      account_code: '1-1100',
      account_name: 'Bank BCA',
      account_type: 'ASSET',
      description: 'Rekening bank BCA',
      is_active: true,
    },
    {
      id: 3,
      account_code: '1-1200',
      account_name: 'Piutang Usaha',
      account_type: 'ASSET',
      description: 'Piutang dari pelanggan',
      is_active: true,
    },
    {
      id: 4,
      account_code: '2-1000',
      account_name: 'Utang Usaha',
      account_type: 'LIABILITY',
      description: 'Utang kepada vendor',
      is_active: true,
    },
    {
      id: 5,
      account_code: '3-1000',
      account_name: 'Modal Saham',
      account_type: 'EQUITY',
      description: 'Modal yang disetor pemegang saham',
      is_active: true,
    },
    {
      id: 6,
      account_code: '4-1000',
      account_name: 'Pendapatan Jasa',
      account_type: 'REVENUE',
      description: 'Pendapatan dari penjualan jasa',
      is_active: true,
    },
    {
      id: 7,
      account_code: '5-1000',
      account_name: 'Beban Gaji',
      account_type: 'EXPENSE',
      description: 'Beban gaji karyawan',
      is_active: true,
    },
    {
      id: 8,
      account_code: '5-2000',
      account_name: 'Beban Listrik',
      account_type: 'EXPENSE',
      description: 'Beban listrik bulanan',
      is_active: true,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const accountTypes = [
    { value: 'ASSET', label: 'Asset', color: 'text-primary-light' },
    { value: 'LIABILITY', label: 'Liability', color: 'text-accent-gold' },
    { value: 'EQUITY', label: 'Equity', color: 'text-primary-light' },
    { value: 'REVENUE', label: 'Revenue', color: 'text-accent-gold' },
    { value: 'EXPENSE', label: 'Expense', color: 'text-primary-dark' },
    { value: 'COST_OF_SERVICE', label: 'Cost of Service', color: 'text-primary-light' },
  ];

  const getAccountTypeLabel = (type: string) => {
    const typeObj = accountTypes.find((t) => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  const getAccountTypeColor = (type: string) => {
    const typeObj = accountTypes.find((t) => t.value === type);
    return typeObj ? typeObj.color : 'text-gray-600';
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.account_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === '' || account.account_type === selectedType;
    return matchesSearch && matchesType;
  });

  const accountSummary = {
    total: accounts.length,
    asset: accounts.filter((a) => a.account_type === 'ASSET').length,
    liability: accounts.filter((a) => a.account_type === 'LIABILITY').length,
    equity: accounts.filter((a) => a.account_type === 'EQUITY').length,
    revenue: accounts.filter((a) => a.account_type === 'REVENUE').length,
    expense: accounts.filter((a) => a.account_type === 'EXPENSE').length,
    costOfService: accounts.filter((a) => a.account_type === 'COST_OF_SERVICE').length,
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus akun ini?')) {
      setAccounts(accounts.filter((a) => a.id !== id));
    }
  };

  const handleAddNew = () => {
    setEditingAccount(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-dark to-primary-light rounded-2xl shadow-lg p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">Chart of Accounts (Simulasi)</h1>
            <p className="text-white/90 text-lg mt-1">
              Data simulasi untuk testing - Kelola daftar akun keuangan perusahaan
            </p>
            <p className="text-accent-gold text-sm mt-2">
              ⚠️ Ini adalah data simulasi. Data asli akan muncul setelah integrasi API selesai.
            </p>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-accent-gold focus:border-transparent shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-primary-dark text-white rounded-xl shadow-sm p-4 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="text-3xl font-bold">{accountSummary.total}</div>
            <ChartBarIcon className="w-6 h-6 text-accent-gold" />
          </div>
          <div className="mt-2 text-xs font-semibold">Total</div>
        </div>

        <div className="bg-primary-light/20 text-primary-dark border-2 border-primary-light rounded-xl shadow-sm p-4 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="text-3xl font-bold">{accountSummary.asset}</div>
            <ChartBarIcon className="w-6 h-6 text-primary-light" />
          </div>
          <div className="mt-2 text-xs font-semibold">Asset</div>
        </div>

        <div className="bg-accent-gold/20 text-primary-dark border-2 border-accent-gold rounded-xl shadow-sm p-4 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="text-3xl font-bold">{accountSummary.liability}</div>
            <ChartBarIcon className="w-6 h-6 text-accent-gold" />
          </div>
          <div className="mt-2 text-xs font-semibold">Liability</div>
        </div>

        <div className="bg-primary-light/20 text-primary-dark border-2 border-primary-light rounded-xl shadow-sm p-4 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="text-3xl font-bold">{accountSummary.equity}</div>
            <ChartBarIcon className="w-6 h-6 text-primary-light" />
          </div>
          <div className="mt-2 text-xs font-semibold">Equity</div>
        </div>

        <div className="bg-accent-gold/20 text-primary-dark border-2 border-accent-gold rounded-xl shadow-sm p-4 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="text-3xl font-bold">{accountSummary.revenue}</div>
            <ChartBarIcon className="w-6 h-6 text-accent-gold" />
          </div>
          <div className="mt-2 text-xs font-semibold">Revenue</div>
        </div>

        <div className="bg-primary-light/20 text-primary-dark border-2 border-primary-light rounded-xl shadow-sm p-4 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="text-3xl font-bold">{accountSummary.costOfService}</div>
            <ChartBarIcon className="w-6 h-6 text-primary-light" />
          </div>
          <div className="mt-2 text-xs font-semibold">Cost of Service</div>
        </div>

        <div className="bg-primary-dark/10 text-primary-dark border-2 border-primary-dark/30 rounded-xl shadow-sm p-4 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-start justify-between">
            <div className="text-3xl font-bold">{accountSummary.expense}</div>
            <ChartBarIcon className="w-6 h-6 text-primary-dark" />
          </div>
          <div className="mt-2 text-xs font-semibold">Expense</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 font-medium text-gray-700 transition-colors">
          <ArrowDownTrayIcon className="w-5 h-5" />
          Export
        </button>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-light to-accent-gold text-white rounded-lg shadow-md hover:shadow-lg hover:from-accent-gold hover:to-primary-dark font-semibold transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          Tambah Akun Baru
        </button>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary-dark to-primary-light px-6 py-4 border-b border-primary-light/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-accent-gold" />
            Daftar Akun ({filteredAccounts.length})
          </h2>
        </div>

        {/* Filter */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode akun, nama akun, atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-gold focus:border-transparent"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-gold focus:border-transparent text-gray-700"
            >
              <option value="">Semua Tipe</option>
              {accountTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-primary-dark to-primary-light">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Kode Akun
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Nama Akun
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Tipe
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-primary-dark">{account.account_code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{account.account_name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getAccountTypeColor(account.account_type)}`}>
                      {getAccountTypeLabel(account.account_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{account.description}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {account.is_active ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary-light/20 text-primary-light">
                        <CheckCircleIcon className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(account)}
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-primary-light/10 text-primary-light hover:bg-primary-light hover:text-white transition-all duration-200"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredAccounts.length === 0 && (
          <div className="text-center py-12">
            <ChartBarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Tidak ada akun yang ditemukan</p>
            <p className="text-gray-400 text-sm mt-1">Coba ubah filter atau tambah akun baru</p>
          </div>
        )}
      </div>

      {/* Modal (placeholder) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-primary-dark to-primary-light p-6 rounded-t-2xl">
              <h3 className="text-2xl font-bold text-white">
                {editingAccount ? 'Edit Akun' : 'Tambah Akun Baru'}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-center py-8">
                Modal form untuk {editingAccount ? 'edit' : 'tambah'} akun
                <br />
                (Will be implemented with actual data)
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary-light to-accent-gold text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:from-accent-gold hover:to-primary-dark transition-all"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default COASimulation;
