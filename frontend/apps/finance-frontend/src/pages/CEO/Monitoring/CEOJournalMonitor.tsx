import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE = import.meta.env.VITE_FINANCE_API || 'http://localhost:3002/api';

interface JournalEntry {
  id: string;
  transaction_date: string;
  description: string;
  account_id: string;
  account_code?: string;
  account_name?: string;
  debit: number | string;
  credit: number | string;
  reference_id?: string;
  reference_type?: string;
}

interface JournalSummary {
  total_debit: number;
  total_credit: number;
  total_entries: number;
  is_balanced: boolean;
  difference: number;
}

interface AccountSummary {
  account_id: string;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  balance: number;
}

const CEOJournalMonitor: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [summary, setSummary] = useState<JournalSummary | null>(null);
  const [accountSummaries, setAccountSummaries] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week'); // week, month, quarter
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    fetchJournalData();
  }, [dateRange]);

  const fetchJournalData = async () => {
    try {
      setLoading(true);

      // Fetch journal entries
      const entriesResponse = await fetch(`${API_BASE}/finance/journal-entries`, {
        headers: { 'Accept': 'application/json' },
      });

      if (!entriesResponse.ok) {
        console.error('❌ Failed to fetch journal entries');
        setEntries([]);
      } else {
        const entriesData = await entriesResponse.json();
        const journalEntries = Array.isArray(entriesData) ? entriesData : entriesData.data || [];
        setEntries(journalEntries.slice(0, 20)); // Recent 20 entries

        // Calculate summary
        let totalDebit = 0;
        let totalCredit = 0;

        journalEntries.forEach((entry: JournalEntry) => {
          const debit = typeof entry.debit === 'string' ? parseFloat(entry.debit) : entry.debit;
          const credit = typeof entry.credit === 'string' ? parseFloat(entry.credit) : entry.credit;
          totalDebit += debit || 0;
          totalCredit += credit || 0;
        });

        const isBalanced = Math.abs(totalDebit - totalCredit) < 1; // Allow 1 unit rounding error
        setSummary({
          total_debit: totalDebit,
          total_credit: totalCredit,
          total_entries: journalEntries.length,
          is_balanced: isBalanced,
          difference: totalDebit - totalCredit,
        });

        // Calculate account summaries
        const accountMap = new Map<string, AccountSummary>();
        journalEntries.forEach((entry: JournalEntry) => {
          const key = entry.account_id || 'unknown';
          const debit = typeof entry.debit === 'string' ? parseFloat(entry.debit) : entry.debit;
          const credit = typeof entry.credit === 'string' ? parseFloat(entry.credit) : entry.credit;

          if (!accountMap.has(key)) {
            accountMap.set(key, {
              account_id: entry.account_id || '',
              account_code: entry.account_code || '-',
              account_name: entry.account_name || 'Unknown',
              debit: 0,
              credit: 0,
              balance: 0,
            });
          }

          const account = accountMap.get(key)!;
          account.debit += debit || 0;
          account.credit += credit || 0;
          account.balance = account.debit - account.credit;
        });

        setAccountSummaries(Array.from(accountMap.values()).slice(0, 10)); // Top 10 accounts

        // Generate trend data
        generateTrendData(journalEntries);
      }
    } catch (error) {
      console.error('Error fetching journal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = (entries: JournalEntry[]) => {
    const dateMap = new Map<string, { count: number; debit: number; credit: number }>();

    entries.forEach((entry: JournalEntry) => {
      const date = entry.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0];
      const debit = typeof entry.debit === 'string' ? parseFloat(entry.debit) : entry.debit;
      const credit = typeof entry.credit === 'string' ? parseFloat(entry.credit) : entry.credit;

      if (!dateMap.has(date)) {
        dateMap.set(date, { count: 0, debit: 0, credit: 0 });
      }

      const dayData = dateMap.get(date)!;
      dayData.count += 1;
      dayData.debit += debit || 0;
      dayData.credit += credit || 0;
    });

    const trend = Array.from(dateMap.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
        entries: data.count,
        debit: Math.round(data.debit / 1000000), // In millions
        credit: Math.round(data.credit / 1000000),
      }));

    setTrendData(trend);
  };

  const formatCurrency = (value: number | string | null): string => {
    if (value === null || value === undefined) return 'Rp 0';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin">
          <DocumentTextIcon className="w-12 h-12 text-amber-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="w-8 h-8 text-amber-700" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">日誌監視 - Journal Monitor</h2>
            <p className="text-sm text-gray-600">Real-time monitoring of accounting journal entries</p>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-2">
          {['week', 'month', 'quarter'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                dateRange === range
                  ? 'bg-amber-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Section */}
      {summary && (
        <div
          className={`p-4 rounded-lg border-l-4 flex items-center gap-3 ${
            summary.is_balanced
              ? 'bg-green-50 border-green-500 text-green-800'
              : 'bg-red-50 border-red-500 text-red-800'
          }`}
        >
          {summary.is_balanced ? (
            <>
              <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">✓ Jurnal Balance</p>
                <p className="text-sm">Total Debit and Credit are balanced</p>
              </div>
            </>
          ) : (
            <>
              <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">⚠️ Jurnal NOT Balanced</p>
                <p className="text-sm">
                  Difference: {formatCurrency(Math.abs(summary.difference))}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Entries */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Entries</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {summary?.total_entries || 0}
              </p>
            </div>
            <DocumentTextIcon className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        {/* Total Debit */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Debit</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(summary?.total_debit || 0)}
              </p>
            </div>
            <ArrowTrendingUpIcon className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        {/* Total Credit */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Credit</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                {formatCurrency(summary?.total_credit || 0)}
              </p>
            </div>
            <ArrowTrendingDownIcon className="w-12 h-12 text-orange-500 opacity-20" />
          </div>
        </div>

        {/* Difference */}
        <div
          className={`rounded-lg shadow p-6 border-t-4 ${
            summary?.is_balanced
              ? 'bg-white border-green-500'
              : 'bg-white border-red-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Difference</p>
              <p
                className={`text-2xl font-bold mt-2 ${
                  summary?.is_balanced ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(summary?.difference || 0)}
              </p>
            </div>
            <AdjustmentsHorizontalIcon
              className={`w-12 h-12 opacity-20 ${
                summary?.is_balanced ? 'text-green-500' : 'text-red-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Transaction Trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [value, '']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="entries"
                  stroke="#059669"
                  name="# Entries"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Debit vs Credit Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Debit vs Credit Trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [(value * 1000000).toLocaleString(), '']} />
                <Legend />
                <Bar dataKey="debit" fill="#10b981" name="Debit (Juta)" />
                <Bar dataKey="credit" fill="#f97316" name="Credit (Juta)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>
      </div>

      {/* Account Summary Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📊 Account Summary (Top 10)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Account
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  Credit
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {accountSummaries.length > 0 ? (
                accountSummaries.map((account) => (
                  <tr key={account.account_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{account.account_name}</p>
                        <p className="text-xs text-gray-500">{account.account_code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">
                      {formatCurrency(account.debit)}
                    </td>
                    <td className="px-6 py-4 text-right text-orange-600 font-medium">
                      {formatCurrency(account.credit)}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-medium ${
                        account.balance >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(account.balance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No account data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Journal Entries */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📝 Recent Journal Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Account
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  Credit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(entry.transaction_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {entry.account_name || entry.account_code || entry.account_id}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-green-600 font-medium">
                      {entry.debit && entry.debit !== '0' ? formatCurrency(entry.debit) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-orange-600 font-medium">
                      {entry.credit && entry.credit !== '0' ? formatCurrency(entry.credit) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No journal entries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CEOJournalMonitor;
