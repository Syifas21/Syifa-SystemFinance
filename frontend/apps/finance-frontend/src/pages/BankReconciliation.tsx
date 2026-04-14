import React, { useState, useEffect } from 'react';
import {
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  matched: boolean;
}

interface SystemTransaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  type: string;
  matched: boolean;
}

interface Reconciliation {
  id: string;
  bank_account: string;
  period: string;
  start_date: string;
  end_date: string;
  opening_balance_system: number;
  opening_balance_bank: number;
  closing_balance_system: number;
  closing_balance_bank: number;
  difference: number;
  status: string;
  created_at: string;
}

const BankReconciliation: React.FC = () => {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRecon, setSelectedRecon] = useState<Reconciliation | null>(null);

  // Form state
  const [bankAccount, setBankAccount] = useState('');
  const [period, setPeriod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [openingBalanceSystem, setOpeningBalanceSystem] = useState(0);
  const [openingBalanceBank, setOpeningBalanceBank] = useState(0);
  
  // Transaction lists
  const [systemTransactions, setSystemTransactions] = useState<SystemTransaction[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<any[]>([]);

  const API_BASE = import.meta.env.VITE_FINANCE_API || '/api';

  useEffect(() => {
    fetchReconciliations();
  }, []);

  const fetchReconciliations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/bank-reconciliation`);
      const result = await response.json();
      if (result.success) {
        setReconciliations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching reconciliations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Parse bank transactions dari CSV
        const transactions: BankTransaction[] = jsonData.map((row: any, idx) => ({
          id: `bank-${idx}`,
          date: row['Tanggal'] || row['Date'] || '',
          description: row['Keterangan'] || row['Description'] || '',
          debit: parseFloat(row['Debit'] || 0),
          credit: parseFloat(row['Credit'] || row['Kredit'] || 0),
          balance: parseFloat(row['Saldo'] || row['Balance'] || 0),
          matched: false,
        }));

        setBankTransactions(transactions);
        alert(`✅ Imported ${transactions.length} bank transactions`);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('❌ Failed to parse CSV file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const fetchSystemTransactions = async () => {
    // Fetch transactions from system for the selected period
    // This would come from journal entries atau payment records
    try {
      // Dummy data for now
      const dummySystemTransactions: SystemTransaction[] = [
        {
          id: 'sys-1',
          date: '2026-02-01',
          description: 'Payment from PT Maju Jaya',
          debit: 50000000,
          credit: 0,
          type: 'AR Payment',
          matched: false,
        },
        {
          id: 'sys-2',
          date: '2026-02-03',
          description: 'Payment to PT Supplier',
          debit: 0,
          credit: 25000000,
          type: 'AP Payment',
          matched: false,
        },
      ];
      setSystemTransactions(dummySystemTransactions);
    } catch (error) {
      console.error('Error fetching system transactions:', error);
    }
  };

  const handleAutoMatch = () => {
    const matched: any[] = [];
    const newBankTrx = [...bankTransactions];
    const newSystemTrx = [...systemTransactions];

    // Simple auto-matching logic berdasarkan amount dan date
    systemTransactions.forEach((sysTrx, sysIdx) => {
      bankTransactions.forEach((bankTrx, bankIdx) => {
        if (!sysTrx.matched && !bankTrx.matched) {
          const amountMatch = 
            (sysTrx.debit > 0 && Math.abs(sysTrx.debit - bankTrx.debit) < 100) ||
            (sysTrx.credit > 0 && Math.abs(sysTrx.credit - bankTrx.credit) < 100);
          
          const dateMatch = sysTrx.date === bankTrx.date;

          if (amountMatch && dateMatch) {
            matched.push({
              systemTrx: sysTrx,
              bankTrx: bankTrx,
              confidence: 0.95,
            });
            newSystemTrx[sysIdx].matched = true;
            newBankTrx[bankIdx].matched = true;
          }
        }
      });
    });

    setSystemTransactions(newSystemTrx);
    setBankTransactions(newBankTrx);
    setMatchedPairs(matched);
    
    alert(`✅ Auto-matched ${matched.length} transactions`);
  };

  const handleManualMatch = (sysTrxId: string, bankTrxId: string) => {
    const sysTrx = systemTransactions.find(t => t.id === sysTrxId);
    const bankTrx = bankTransactions.find(t => t.id === bankTrxId);

    if (sysTrx && bankTrx) {
      setMatchedPairs([...matchedPairs, {
        systemTrx: sysTrx,
        bankTrx: bankTrx,
        confidence: 1.0,
        manual: true,
      }]);

      setSystemTransactions(systemTransactions.map(t => 
        t.id === sysTrxId ? { ...t, matched: true } : t
      ));
      setBankTransactions(bankTransactions.map(t => 
        t.id === bankTrxId ? { ...t, matched: true } : t
      ));

      alert('✅ Transactions matched manually');
    }
  };

  const handleSaveReconciliation = async () => {
    const closingBalanceSystem = openingBalanceSystem + 
      systemTransactions.reduce((sum, t) => sum + t.debit - t.credit, 0);
    
    const closingBalanceBank = openingBalanceBank +
      bankTransactions.reduce((sum, t) => sum + t.debit - t.credit, 0);

    const difference = closingBalanceSystem - closingBalanceBank;

    const payload = {
      bank_account: bankAccount,
      period: period,
      start_date: startDate,
      end_date: endDate,
      opening_balance_system: openingBalanceSystem,
      opening_balance_bank: openingBalanceBank,
      closing_balance_system: closingBalanceSystem,
      closing_balance_bank: closingBalanceBank,
      system_transactions: systemTransactions,
      bank_transactions: bankTransactions,
      matched_transactions: matchedPairs,
      unmatched_system: systemTransactions.filter(t => !t.matched),
      unmatched_bank: bankTransactions.filter(t => !t.matched),
      adjustments: [],
      difference: difference,
    };

    try {
      const response = await fetch(`${API_BASE}/bank-reconciliation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Bank reconciliation saved successfully');
        fetchReconciliations();
        setShowCreateForm(false);
        resetForm();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving reconciliation:', error);
      alert('❌ Network error');
    }
  };

  const resetForm = () => {
    setBankAccount('');
    setPeriod('');
    setStartDate('');
    setEndDate('');
    setOpeningBalanceSystem(0);
    setOpeningBalanceBank(0);
    setSystemTransactions([]);
    setBankTransactions([]);
    setMatchedPairs([]);
  };

  const handleDeleteReconciliation = async (id: string) => {
    if (!confirm('Delete this bank reconciliation? This action cannot be undone.')) return;

    try {
      const response = await fetch(`${API_BASE}/bank-reconciliation/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Reconciliation deleted successfully');
        fetchReconciliations();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting reconciliation:', error);
      alert('❌ Network error');
    }
  };

  const handleViewReconciliation = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/bank-reconciliation/${id}`);
      const result = await response.json();

      if (result.success) {
        setSelectedRecon(result.data);
        // Show details in modal or expand view
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error fetching reconciliation:', error);
      alert('❌ Network error');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      Draft: 'bg-gray-100 text-gray-700',
      InProgress: 'bg-blue-100 text-blue-700',
      Completed: 'bg-green-100 text-green-700',
    };
    return badges[status] || badges.Draft;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-[#06103A] to-[#4E88BE] rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">🏦 Bank Reconciliation</h1>
              <p className="text-white/80 text-lg">
                Cocokkan transaksi sistem dengan mutasi bank untuk memastikan akurasi saldo
              </p>
            </div>
            <button
              onClick={() => {
                setShowCreateForm(true);
                fetchSystemTransactions();
              }}
              className="flex items-center gap-2 px-6 py-3 bg-white text-[#06103A] rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              New Reconciliation
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 Bank Reconciliation Setup</h2>
          
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bank Account <span className="text-red-500">*</span>
              </label>
              <select
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4E88BE]"
                required
              >
                <option value="">Select Bank Account</option>
                <option value="BCA-1234567890">BCA - 1234567890</option>
                <option value="MANDIRI-0987654321">Mandiri - 0987654321</option>
                <option value="BNI-1122334455">BNI - 1122334455</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Period <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g., Jan 2026"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4E88BE]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min="2020-01-01"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4E88BE]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min="2020-01-01"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4E88BE]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Opening Balance (System)
              </label>
              <input
                type="number"
                value={openingBalanceSystem}
                onChange={(e) => setOpeningBalanceSystem(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4E88BE]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Opening Balance (Bank)
              </label>
              <input
                type="number"
                value={openingBalanceBank}
                onChange={(e) => setOpeningBalanceBank(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4E88BE]"
              />
            </div>
          </div>

          {/* Import Bank Statement */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">📂 Import Bank Statement</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload file CSV/Excel dari mutasi rekening bank Anda
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleImportCSV}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 px-6 py-3 bg-[#4E88BE] text-white rounded-xl hover:bg-[#06103A] transition-colors font-semibold">
                <ArrowUpTrayIcon className="w-5 h-5" />
                Choose File (CSV/Excel)
              </div>
            </label>
            {bankTransactions.length > 0 && (
              <p className="text-sm text-green-600 mt-2 font-semibold">
                ✅ {bankTransactions.length} bank transactions loaded
              </p>
            )}
          </div>

          {/* Transaction Matching */}
          {systemTransactions.length > 0 && bankTransactions.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">🔄 Transaction Matching</h3>
                <button
                  onClick={handleAutoMatch}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Auto Match
                </button>
              </div>

              {/* Side by side comparison */}
              <div className="grid grid-cols-2 gap-6">
                {/* System Transactions */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3">💻 System Transactions</h4>
                  <div className="bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                    {systemTransactions.map((trx) => (
                      <div
                        key={trx.id}
                        className={`p-3 border-b border-gray-200 ${trx.matched ? 'bg-green-50' : 'hover:bg-white cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">{trx.date}</p>
                            <p className="text-sm font-semibold text-gray-900">{trx.description}</p>
                            <p className="text-sm text-gray-700">
                              {trx.debit > 0 ? `Debit: ${formatCurrency(trx.debit)}` : `Credit: ${formatCurrency(trx.credit)}`}
                            </p>
                          </div>
                          {trx.matched && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bank Transactions */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3">🏦 Bank Transactions</h4>
                  <div className="bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                    {bankTransactions.map((trx) => (
                      <div
                        key={trx.id}
                        className={`p-3 border-b border-gray-200 ${trx.matched ? 'bg-green-50' : 'hover:bg-white cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">{trx.date}</p>
                            <p className="text-sm font-semibold text-gray-900">{trx.description}</p>
                            <p className="text-sm text-gray-700">
                              {trx.debit > 0 ? `Debit: ${formatCurrency(trx.debit)}` : `Credit: ${formatCurrency(trx.credit)}`}
                            </p>
                          </div>
                          {trx.matched && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Matched Transactions Summary */}
              {matchedPairs.length > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-green-900 mb-2">✅ Matched Transactions</h4>
                  <p className="text-sm text-green-800">
                    {matchedPairs.length} transactions matched successfully
                  </p>
                </div>
              )}

              {/* Unmatched Transactions Warning */}
              {(systemTransactions.some(t => !t.matched) || bankTransactions.some(t => !t.matched)) && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-yellow-900 mb-2">⚠️ Unmatched Transactions</h4>
                  <p className="text-sm text-yellow-800">
                    System: {systemTransactions.filter(t => !t.matched).length} | 
                    Bank: {bankTransactions.filter(t => !t.matched).length}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Review unmatched items and create adjustments if needed
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-6 border-t-2 border-gray-200 mt-6">
            <button
              onClick={handleSaveReconciliation}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              💾 Save Reconciliation
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reconciliations List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">📋 Reconciliation History</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4E88BE]"></div>
          </div>
        ) : reconciliations.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">📭 No reconciliations yet</p>
            <p className="text-sm text-gray-400 mt-2">Click "New Reconciliation" to start</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Period</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Bank Account</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">System Balance</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Bank Balance</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase">Difference</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reconciliations.map((recon) => (
                  <tr key={recon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{recon.period}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(recon.start_date)} - {formatDate(recon.end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{recon.bank_account}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(recon.closing_balance_system)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(recon.closing_balance_bank)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${Math.abs(recon.difference) < 1000 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(recon.difference))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(recon.status)}`}>
                        {recon.status === 'Completed' && <LockClosedIcon className="w-3 h-3" />}
                        {recon.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => handleViewReconciliation(recon.id)}
                          className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                          View
                        </button>
                        {recon.status !== 'Completed' && (
                          <>
                            <button
                              onClick={() => {
                                // Load data for editing
                                setSelectedRecon(recon);
                                setBankAccount(recon.bank_account);
                                setPeriod(recon.period);
                                setStartDate(recon.start_date);
                                setEndDate(recon.end_date);
                                setOpeningBalanceSystem(recon.opening_balance_system);
                                setOpeningBalanceBank(recon.opening_balance_bank);
                                setShowCreateForm(true);
                              }}
                              className="text-sm px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteReconciliation(recon.id)}
                              className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankReconciliation;
