import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { chartOfAccountsAPI, journalEntriesAPI } from '../../api';

interface JournalLine {
  id: string;
  account_id: number | null;
  account_name: string;
  debit: string;
  credit: string;
  description: string;
}

interface ChartOfAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
}

const GeneralJournalForm: React.FC = () => {
  const navigate = useNavigate();
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([
    {
      id: '1',
      account_id: null,
      account_name: '',
      debit: '',
      credit: '',
      description: '',
    },
    {
      id: '2',
      account_id: null,
      account_name: '',
      debit: '',
      credit: '',
      description: '',
    },
  ]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load Chart of Accounts
  useEffect(() => {
    const loadAccounts = async () => {
      setLoading(true);
      try {
        console.log('🔍 Loading Chart of Accounts...');
        const data = await chartOfAccountsAPI.getAll();
        console.log('✅ Chart of Accounts loaded:', data);
        console.log('📊 Total accounts:', data.length);
        setAccounts(data);
      } catch (error) {
        console.error('❌ Failed to load accounts:', error);
        alert('Gagal memuat Chart of Accounts. Periksa console untuk detail.');
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  // Calculate totals
  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;

    lines.forEach((line) => {
      totalDebit += parseFloat(line.debit) || 0;
      totalCredit += parseFloat(line.credit) || 0;
    });

    return {
      totalDebit,
      totalCredit,
      difference: totalDebit - totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  };

  const totals = calculateTotals();

  // Add new line
  const addLine = () => {
    const newLine: JournalLine = {
      id: Date.now().toString(),
      account_id: null,
      account_name: '',
      debit: '',
      credit: '',
      description: '',
    };
    setLines([...lines, newLine]);
  };

  // Remove line
  const removeLine = (id: string) => {
    if (lines.length <= 2) {
      alert('Minimal harus ada 2 baris jurnal');
      return;
    }
    setLines(lines.filter((line) => line.id !== id));
  };

  // Update line
  const updateLine = (
    id: string,
    field: keyof JournalLine,
    value: string | number | null
  ) => {
    setLines(
      lines.map((line) => {
        if (line.id === id) {
          const updated = { ...line, [field]: value };

          // Auto-clear opposite field when entering debit/credit
          if (field === 'debit' && value) {
            updated.credit = '';
          } else if (field === 'credit' && value) {
            updated.debit = '';
          }

          // Update account name when account_id changes
          if (field === 'account_id' && value) {
            const account = accounts.find((acc) => acc.id === value);
            if (account) {
              updated.account_name = `${account.account_code} - ${account.account_name}`;
            }
          }

          return updated;
        }
        return line;
      })
    );
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    if (!description.trim()) {
      alert('Deskripsi jurnal harus diisi');
      return;
    }

    if (!totals.isBalanced) {
      alert(
        `Jurnal tidak seimbang!\nDebit: ${formatCurrency(
          totals.totalDebit
        )}\nCredit: ${formatCurrency(
          totals.totalCredit
        )}\nSelisih: ${formatCurrency(Math.abs(totals.difference))}`
      );
      return;
    }

    // Validasi setiap baris
    for (const line of lines) {
      if (!line.account_id) {
        alert('Semua baris harus memilih akun');
        return;
      }
      if (!line.debit && !line.credit) {
        alert('Setiap baris harus memiliki nilai Debit atau Credit');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        transaction_date: transactionDate,
        description: description.trim(),
        reference_type: 'GENERAL_JOURNAL',
        lines: lines.map((line) => ({
          account_id: line.account_id!,
          debit: line.debit ? parseFloat(line.debit) : undefined,
          credit: line.credit ? parseFloat(line.credit) : undefined,
          description: line.description || description,
        })),
        created_by: 'admin', // TODO: Get from auth context
      };

      console.log('Submitting general journal:', payload);
      await journalEntriesAPI.createGeneral(payload);

      alert('✅ Jurnal Umum berhasil dibuat!');
      navigate('/journals');
    } catch (error: any) {
      console.error('Failed to create general journal:', error);
      alert(
        `❌ Gagal membuat jurnal: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/30 via-yellow-50/20 to-orange-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-200 via-yellow-200 to-orange-200 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Buat Jurnal Umum
                </h1>
                <p className="mt-1 text-sm text-gray-700">
                  Form input manual untuk transaksi non-proyek (sesuai TSD FITUR 3.4.C)
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/journals')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm border border-amber-200 rounded-lg hover:bg-white shadow-md transition-all"
            >
              Batal
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Journal Header */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informasi Jurnal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Transaksi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi Jurnal <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Pembayaran gaji karyawan bulan Januari 2025"
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Journal Lines */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Detail Jurnal (Double-Entry)
              </h2>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-amber-400 rounded-md hover:bg-amber-500 shadow-md transition-all"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Tambah Baris
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Akun <span className="text-red-500">*</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Keterangan
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Debit (Rp)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Credit (Rp)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lines.map((line, index) => (
                    <tr key={line.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <select
                          value={line.account_id || ''}
                          onChange={(e) =>
                            updateLine(
                              line.id,
                              'account_id',
                              parseInt(e.target.value)
                            )
                          }
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                          disabled={loading}
                        >
                          <option value="">-- Pilih Akun --</option>
                          {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.account_code} - {account.account_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) =>
                            updateLine(line.id, 'description', e.target.value)
                          }
                          placeholder="Opsional"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={line.debit}
                          onChange={(e) =>
                            updateLine(line.id, 'debit', e.target.value)
                          }
                          placeholder="0"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:ring-2 focus:ring-blue-500"
                          disabled={!!line.credit}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={line.credit}
                          onChange={(e) =>
                            updateLine(line.id, 'credit', e.target.value)
                          }
                          placeholder="0"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:ring-2 focus:ring-blue-500"
                          disabled={!!line.debit}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length <= 2}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                          title="Hapus baris"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right text-blue-500">
                      {formatCurrency(totals.totalDebit)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-500">
                      {formatCurrency(totals.totalCredit)}
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right">
                      Status:
                    </td>
                    <td colSpan={3} className="px-4 py-3">
                      {totals.isBalanced ? (
                        <div className="inline-flex items-center text-emerald-500">
                          <CheckCircleIcon className="w-5 h-5 mr-2" />
                          <span>Seimbang ✓</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center text-red-600">
                          <XCircleIcon className="w-5 h-5 mr-2" />
                          <span>
                            Tidak Seimbang (Selisih:{' '}
                            {formatCurrency(Math.abs(totals.difference))})
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/journals')}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!totals.isBalanced || saving}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-amber-400 rounded-md hover:bg-amber-500 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg transition-all"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Posting Jurnal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneralJournalForm;
