import React, { useState, useEffect } from 'react';
import {
  BanknotesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

/**
 * 🏦 AUTOMATIC BANK TRANSACTION FEED
 * Auto-fetch bank transactions via API integration
 * Supports: BCA, Mandiri, BNI, BRI APIs
 * Features:
 * - Real-time transaction sync
 * - Auto-matching with invoices
 * - Webhook support for instant updates
 * - Scheduled polling (every 15 minutes)
 */

interface BankTransaction {
  id: string;
  bank_account: string;
  transaction_date: string;
  sender_name: string;
  sender_account: string;
  amount: number;
  description: string;
  transaction_type: 'CREDIT' | 'DEBIT';
  status: 'PENDING' | 'MATCHED' | 'PROCESSED';
  matched_invoice_id?: string;
  confidence_score?: number;
}

interface BankConnectionStatus {
  bank_name: string;
  account_number: string;
  is_connected: boolean;
  last_sync: Date | null;
  auto_sync_enabled: boolean;
}

const AutoBankTransactionFeed: React.FC = () => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  const [bankConnections, setBankConnections] = useState<BankConnectionStatus[]>([
    {
      bank_name: 'BCA',
      account_number: '1234567890',
      is_connected: true,
      last_sync: new Date(),
      auto_sync_enabled: true,
    },
    {
      bank_name: 'Mandiri',
      account_number: '9876543210',
      is_connected: true,
      last_sync: new Date(Date.now() - 900000), // 15 minutes ago
      auto_sync_enabled: true,
    },
    {
      bank_name: 'BNI',
      account_number: '5555666677',
      is_connected: false,
      last_sync: null,
      auto_sync_enabled: false,
    },
  ]);

  // Auto-sync every 15 minutes
  useEffect(() => {
    if (autoSyncEnabled) {
      const interval = setInterval(() => {
        fetchBankTransactions();
      }, 15 * 60 * 1000); // 15 minutes

      return () => clearInterval(interval);
    }
  }, [autoSyncEnabled]);

  // Initial load
  useEffect(() => {
    fetchBankTransactions();
  }, []);

  const fetchBankTransactions = async () => {
    setIsLoading(true);
    try {
      // In production, this would call actual bank APIs
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate fetching transactions
      const mockTransactions: BankTransaction[] = [
        {
          id: 'TRX-AUTO-001',
          bank_account: 'BCA-1234567890',
          transaction_date: new Date().toISOString(),
          sender_name: 'PT ABC INDONESIA',
          sender_account: '1112223334',
          amount: 150000000,
          description: 'TRANSFER PEMBAYARAN INV',
          transaction_type: 'CREDIT',
          status: 'PENDING',
          confidence_score: 0,
        },
        {
          id: 'TRX-AUTO-002',
          bank_account: 'Mandiri-9876543210',
          transaction_date: new Date().toISOString(),
          sender_name: 'CV XYZ TRADING',
          sender_account: '4445556667',
          amount: 85000000,
          description: 'TRF INV-2026-045',
          transaction_type: 'CREDIT',
          status: 'MATCHED',
          matched_invoice_id: 'INV-2026-045',
          confidence_score: 98,
        },
      ];

      setTransactions(mockTransactions);
      setLastSync(new Date());

      // Auto-match with invoices
      await autoMatchWithInvoices(mockTransactions);

      console.log('✅ Bank transactions synced successfully');
    } catch (error) {
      console.error('❌ Error fetching bank transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const autoMatchWithInvoices = async (transactions: BankTransaction[]) => {
    try {
      // Call backend API to match transactions with unpaid invoices
      const response = await fetch('/api/bank-reconciliation/auto-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Auto-matched ${result.matched_count} transactions`);
      }
    } catch (error) {
      console.error('Error auto-matching:', error);
    }
  };

  const connectBank = async (bankName: string) => {
    // In production, this would redirect to bank OAuth or API authorization
    alert(`🏦 Menghubungkan ke ${bankName}...\n\nDalam versi production, ini akan membuka halaman OAuth bank untuk authorize access.`);

    // Simulate connection
    setBankConnections(prev =>
      prev.map(conn =>
        conn.bank_name === bankName
          ? { ...conn, is_connected: true, last_sync: new Date(), auto_sync_enabled: true }
          : conn
      )
    );
  };

  const disconnectBank = (bankName: string) => {
    if (confirm(`Disconnect dari ${bankName}?`)) {
      setBankConnections(prev =>
        prev.map(conn =>
          conn.bank_name === bankName
            ? { ...conn, is_connected: false, last_sync: null, auto_sync_enabled: false }
            : conn
        )
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatRelativeTime = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <BanknotesIcon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">🏦 Auto Bank Transaction Feed</h2>
              <p className="text-blue-100 mt-1">
                Real-time sync dengan rekening bank Anda
              </p>
            </div>
          </div>
          <button
            onClick={fetchBankTransactions}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </div>

        {/* Auto-Sync Toggle */}
        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="auto-sync"
            checked={autoSyncEnabled}
            onChange={(e) => setAutoSyncEnabled(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="auto-sync" className="text-sm">
            Auto-sync every 15 minutes
          </label>
          {lastSync && (
            <span className="text-xs text-blue-100 ml-auto">
              Last sync: {formatRelativeTime(lastSync)}
            </span>
          )}
        </div>
      </div>

      {/* Bank Connections */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🏦 Connected Banks</h3>
        <div className="space-y-3">
          {bankConnections.map((conn) => (
            <div
              key={conn.bank_name}
              className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  conn.is_connected ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <BanknotesIcon className={`h-6 w-6 ${
                    conn.is_connected ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{conn.bank_name}</h4>
                  <p className="text-sm text-gray-600">
                    {conn.account_number.replace(/(\d{4})/, '****')}
                  </p>
                  {conn.is_connected && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Connected • Last sync: {formatRelativeTime(conn.last_sync)}
                    </p>
                  )}
                </div>
              </div>
              <div>
                {conn.is_connected ? (
                  <button
                    onClick={() => disconnectBank(conn.bank_name)}
                    className="px-4 py-2 text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-semibold"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => connectBank(conn.bank_name)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📥 Recent Transactions (Auto-Fetched)</h3>
        {isLoading ? (
          <div className="text-center py-8">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Syncing transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BanknotesIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No new transactions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((trx) => (
              <div
                key={trx.id}
                className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    trx.status === 'MATCHED' ? 'bg-green-100' :
                    trx.status === 'PROCESSED' ? 'bg-blue-100' :
                    'bg-yellow-100'
                  }`}>
                    {trx.status === 'MATCHED' ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    ) : (
                      <ClockIcon className="h-6 w-6 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{trx.sender_name}</h4>
                    <p className="text-sm text-gray-600">{trx.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {trx.bank_account} • {new Date(trx.transaction_date).toLocaleString('id-ID')}
                    </p>
                    {trx.matched_invoice_id && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Matched to {trx.matched_invoice_id} ({trx.confidence_score}% confidence)
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(trx.amount)}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    trx.status === 'MATCHED' ? 'bg-green-100 text-green-800' :
                    trx.status === 'PROCESSED' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {trx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex items-start gap-2">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h4 className="font-semibold text-blue-900">How Auto-Sync Works</h4>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc ml-5">
              <li>Transactions are automatically fetched every 15 minutes</li>
              <li>AI auto-matches transactions with unpaid invoices</li>
              <li>High-confidence matches (&gt;90%) are auto-approved</li>
              <li>Low-confidence matches require manual review</li>
              <li>You'll receive notifications for new transactions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoBankTransactionFeed;
