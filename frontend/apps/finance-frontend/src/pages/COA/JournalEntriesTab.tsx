import React, { useState, useEffect, useMemo } from 'react';
import { journalEntriesAPI, JournalEntry, chartOfAccountsAPI, ChartOfAccount } from '../../api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

// Formatter utilities
const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return 'Rp 0';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numValue);
};

const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

interface JournalEntriesTabProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const JournalEntriesTab: React.FC<JournalEntriesTabProps> = ({ onSuccess, onError }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; entryId: string | null }>({
    isOpen: false,
    entryId: null,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccountId, setFilterAccountId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // Expanded row state for showing entry details
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    account_id: '',
    debit: '',
    credit: '',
    reference_id: '',
    reference_type: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch accounts and entries
  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching Chart of Accounts and Journal Entries...');
      const [accountsData, entriesResponse] = await Promise.all([
        chartOfAccountsAPI.getAll(),
        journalEntriesAPI.getAll(),
      ]);

      console.log('📊 Accounts received:', accountsData);
      console.log('📊 Total accounts:', Array.isArray(accountsData) ? accountsData.length : 0);
      
      // chartOfAccountsAPI.getAll() returns array directly
      if (Array.isArray(accountsData)) {
        setAccounts(accountsData);
      } else {
        console.warn('⚠️ Accounts data is not an array:', accountsData);
        setAccounts([]);
      }

      // journalEntriesAPI.getAll() returns {success, data} format
      if (entriesResponse.success && entriesResponse.data) {
        setEntries(entriesResponse.data);
      } else if (Array.isArray(entriesResponse)) {
        setEntries(entriesResponse);
      }
    } catch (err: any) {
      onError(err.message || 'Gagal mengambil data');
      console.error('❌ Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and search logic
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((entry) =>
        entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.reference_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.account?.account_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.account?.account_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Account filter
    if (filterAccountId !== 'all') {
      filtered = filtered.filter((entry) => entry.account_id === parseInt(filterAccountId));
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter((entry) => entry.transaction_date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((entry) => entry.transaction_date <= endDate);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

    return filtered;
  }, [entries, searchQuery, filterAccountId, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEntries, currentPage, itemsPerPage]);

  // Calculate totals - IMPORTANT: In double-entry, total debit MUST equal total credit
  // This calculates from DISPLAYED entries (filtered), not all entries
  const totals = useMemo(() => {
    const displayedTotals = filteredEntries.reduce(
      (acc, entry) => {
        const debit = typeof entry.debit === 'string' ? parseFloat(entry.debit) : entry.debit || 0;
        const credit = typeof entry.credit === 'string' ? parseFloat(entry.credit) : entry.credit || 0;
        return {
          debit: acc.debit + debit,
          credit: acc.credit + credit,
        };
      },
      { debit: 0, credit: 0 }
    );
    
    // Also calculate from ALL entries to show true balance
    const allTotals = entries.reduce(
      (acc, entry) => {
        const debit = typeof entry.debit === 'string' ? parseFloat(entry.debit) : entry.debit || 0;
        const credit = typeof entry.credit === 'string' ? parseFloat(entry.credit) : entry.credit || 0;
        return {
          debit: acc.debit + debit,
          credit: acc.credit + credit,
        };
      },
      { debit: 0, credit: 0 }
    );
    
    return {
      displayed: displayedTotals,
      all: allTotals,
      isBalanced: Math.abs(allTotals.debit - allTotals.credit) < 0.01,
    };
  }, [filteredEntries, entries]);

  // Toggle row expansion
  const toggleRowExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.transaction_date) {
      errors.transaction_date = 'Tanggal transaksi wajib diisi';
    }

    if (!formData.account_id) {
      errors.account_id = 'Akun wajib dipilih';
    }

    if (!formData.description.trim()) {
      errors.description = 'Deskripsi wajib diisi';
    }

    const debit = parseFloat(formData.debit) || 0;
    const credit = parseFloat(formData.credit) || 0;

    if (debit === 0 && credit === 0) {
      errors.amount = 'Debit atau Credit harus diisi';
    }

    if (debit > 0 && credit > 0) {
      errors.amount = 'Tidak boleh mengisi Debit dan Credit sekaligus';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      onError('Mohon perbaiki kesalahan pada form');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        transaction_date: formData.transaction_date,
        description: formData.description || undefined,
        account_id: parseInt(formData.account_id),
        debit: formData.debit ? parseFloat(formData.debit) : undefined,
        credit: formData.credit ? parseFloat(formData.credit) : undefined,
        reference_id: formData.reference_id || undefined,
        reference_type: formData.reference_type || undefined,
      };

      if (editingEntry) {
        await journalEntriesAPI.update(editingEntry.id, payload);
        onSuccess('Journal entry berhasil diperbarui');
      } else {
        await journalEntriesAPI.create(payload);
        onSuccess('Journal entry berhasil ditambahkan');
      }

      resetForm();
      fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      onError(err.message || 'Gagal menyimpan data');
      console.error('Error saving entry:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, entryId: id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.entryId) return;

    setLoading(true);
    try {
      await journalEntriesAPI.delete(deleteConfirm.entryId);
      onSuccess('Journal entry berhasil dihapus');
      fetchData();
    } catch (err: any) {
      onError(err.message || 'Gagal menghapus data');
      console.error('Error deleting entry:', err);
    } finally {
      setLoading(false);
      setDeleteConfirm({ isOpen: false, entryId: null });
    }
  };

  // Handle edit
  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setFormData({
      transaction_date: entry.transaction_date,
      description: entry.description || '',
      account_id: entry.account_id.toString(),
      debit: entry.debit?.toString() || '',
      credit: entry.credit?.toString() || '',
      reference_id: entry.reference_id || '',
      reference_type: entry.reference_type || '',
    });
    setIsModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
      account_id: '',
      debit: '',
      credit: '',
      reference_id: '',
      reference_type: '',
    });
    setEditingEntry(null);
    setValidationErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-primary-dark">Journal Entries</h3>
          <div className="flex flex-col gap-1 mt-1">
            <p className="text-text-secondary text-sm">
              {entries.length} total entries • Showing: {filteredEntries.length}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-text-secondary text-sm">
                All Entries → Debit: {formatCurrency(totals.all.debit)} • Credit: {formatCurrency(totals.all.credit)}
              </p>
              {totals.isBalanced ? (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                  ✓ Balanced
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-semibold">
                  ✗ Not Balanced (Diff: {formatCurrency(Math.abs(totals.all.debit - totals.all.credit))})
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-primary-dark rounded-lg hover:bg-accent-gold-alt transition-colors shadow-md font-semibold"
        >
          <PlusIcon className="h-5 w-5" />
          Tambah Journal Entry
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-card rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Cari deskripsi, referensi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary"
            />
          </div>

          {/* Account Filter */}
          <select
            value={filterAccountId}
            onChange={(e) => setFilterAccountId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary"
          >
            <option value="all">Semua Akun</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
              </option>
            ))}
          </select>

          {/* Start Date */}
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary"
              placeholder="Dari tanggal"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary"
              placeholder="Sampai tanggal"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-card rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-surface-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-10"></th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Akun
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-card divide-y divide-gray-200">
              {loading && paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-primary-light mb-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <p className="text-text-secondary">Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <DocumentTextIcon className="h-12 w-12 text-text-secondary mb-4" />
                      <p className="text-text-primary text-lg font-medium">Tidak ada journal entries</p>
                      <p className="text-text-secondary text-sm mt-1">Mulai dengan menambahkan entry baru</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry) => (
                  <React.Fragment key={entry.id}>
                    <tr className="hover:bg-surface-bg transition-colors">
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleRowExpand(entry.id)}
                          className="text-text-secondary hover:text-primary-dark transition-colors"
                        >
                          {expandedRows.has(entry.id) ? (
                            <ChevronUpIcon className="h-5 w-5" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-text-primary">{formatDate(entry.transaction_date)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-text-primary">
                            {entry.account?.account_code || entry.account_id}
                          </span>
                          <span className="text-xs text-text-secondary">{entry.account?.account_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <span className="text-sm text-text-primary line-clamp-2">
                          {entry.description || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-success">
                          {entry.debit ? formatCurrency(entry.debit) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-danger">
                          {entry.credit ? formatCurrency(entry.credit) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                            title="Edit Entry"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(entry.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-danger rounded hover:bg-danger/90 transition-colors"
                            title="Hapus"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows.has(entry.id) && (
                      <tr className="bg-surface-bg/50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-text-secondary">Reference ID:</span>
                              <span className="ml-2 text-text-primary font-mono">
                                {entry.reference_id || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-text-secondary">Reference Type:</span>
                              <span className="ml-2 text-text-primary">{entry.reference_type || '-'}</span>
                            </div>
                            <div>
                              <span className="text-text-secondary">Created By:</span>
                              <span className="ml-2 text-text-primary">{entry.created_by || 'System'}</span>
                            </div>
                            <div>
                              <span className="text-text-secondary">Created At:</span>
                              <span className="ml-2 text-text-primary">{formatDate(entry.created_at)}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
            {paginatedEntries.length > 0 && (
              <tfoot className="bg-surface-bg font-semibold">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm text-text-primary">
                    Displayed Total:
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-success">{formatCurrency(totals.displayed.debit)}</td>
                  <td className="px-6 py-3 text-right text-sm text-danger">{formatCurrency(totals.displayed.credit)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm text-text-primary font-bold">
                    Grand Total (All Entries):
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-success font-bold">{formatCurrency(totals.all.debit)}</td>
                  <td className="px-6 py-3 text-right text-sm text-danger font-bold">{formatCurrency(totals.all.credit)}</td>
                  <td className="px-6 py-3">
                    {totals.isBalanced ? (
                      <span className="text-xs text-green-600 font-semibold">✓ Balanced</span>
                    ) : (
                      <span className="text-xs text-red-600 font-semibold">✗ Diff: {formatCurrency(Math.abs(totals.all.debit - totals.all.credit))}</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-surface-bg border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-primary">
                Halaman <span className="font-semibold">{currentPage}</span> dari{' '}
                <span className="font-semibold">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm text-text-primary border border-gray-300 rounded-lg hover:bg-surface-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm text-text-primary border border-gray-300 rounded-lg hover:bg-surface-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingEntry ? 'Edit Journal Entry' : 'Tambah Journal Entry'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Transaction Date */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Tanggal Transaksi <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                name="transaction_date"
                min="2020-01-01"
                value={formData.transaction_date}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary ${
                  validationErrors.transaction_date ? 'border-danger' : 'border-gray-300'
                }`}
              />
              {validationErrors.transaction_date && (
                <p className="mt-1 text-sm text-danger">{validationErrors.transaction_date}</p>
              )}
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Akun <span className="text-danger">*</span>
              </label>
              <select
                name="account_id"
                value={formData.account_id}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary ${
                  validationErrors.account_id ? 'border-danger' : 'border-gray-300'
                }`}
              >
                <option value="">Pilih Akun</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </option>
                ))}
              </select>
              {validationErrors.account_id && (
                <p className="mt-1 text-sm text-danger">{validationErrors.account_id}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Deskripsi <span className="text-danger">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Deskripsi transaksi"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent resize-none text-text-primary ${
                validationErrors.description ? 'border-danger' : 'border-gray-300'
              }`}
            />
            {validationErrors.description && (
              <p className="mt-1 text-sm text-danger">{validationErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Debit */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Debit <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="debit"
                value={formData.debit}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary"
              />
            </div>

            {/* Credit */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Credit <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                name="credit"
                value={formData.credit}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary"
              />
            </div>
          </div>

          {validationErrors.amount && (
            <p className="text-sm text-danger">{validationErrors.amount}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Reference ID */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Reference ID</label>
              <input
                type="text"
                name="reference_id"
                value={formData.reference_id}
                onChange={handleInputChange}
                placeholder="UUID atau ID referensi"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary"
              />
            </div>

            {/* Reference Type */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Reference Type</label>
              <input
                type="text"
                name="reference_type"
                value={formData.reference_type}
                onChange={handleInputChange}
                placeholder="invoice, payment, dll"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent text-text-primary"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-text-primary bg-white border border-gray-300 rounded-lg hover:bg-surface-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-primary-dark bg-accent-gold rounded-lg hover:bg-accent-gold-alt focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-gold disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Menyimpan...' : editingEntry ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus journal entry ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, entryId: null })}
        type="danger"
      />
    </div>
  );
};

export default JournalEntriesTab;
