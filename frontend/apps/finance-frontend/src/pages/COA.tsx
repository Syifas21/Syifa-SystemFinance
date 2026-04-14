import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  PresentationChartLineIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  ChartBarIcon as ChartBarIconSolid,
} from '@heroicons/react/24/solid';

// Import tabs
import ChartOfAccountsTab from './COA/ChartOfAccountsTab';
import JournalEntriesTab from './COA/JournalEntriesTab';
import GeneralLedgerTab from '../components/COA/GeneralLedgerTab';
import BalanceSheetTab from '../components/COA/BalanceSheetTab';
import IncomeStatementTab from '../components/COA/IncomeStatementTab';
import TrialBalanceTab from '../components/COA/TrialBalanceTab';

type TabType = 'coa' | 'journal' | 'ledger' | 'balance' | 'income' | 'trial' | 'profit';

interface MetricCard {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}

interface AccountSummary {
  total: number; // Total number of accounts
  asset: number; // Total Asset balance (IDR)
  liability: number; // Total Liability balance (IDR)
  equity: number; // Total Equity balance (IDR)
  revenue: number; // Total Revenue balance (IDR)
  expense: number; // Total Expense balance (IDR)
  costOfService: number; // Total Cost of Service balance (IDR)
}

const COA: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('coa');
  const [searchQuery, setSearchQuery] = useState('');
  const [accountSummary, setAccountSummary] = useState<AccountSummary>({
    total: 0,
    asset: 0,
    liability: 0,
    equity: 0,
    revenue: 0,
    expense: 0,
    costOfService: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch account summary from API
  useEffect(() => {
    fetchAccountSummary();
  }, []);

  const fetchAccountSummary = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chartofaccounts');
      const result = await response.json();

      if (result.success && result.summary) {
        // Use summary from backend (includes balances)
        const backendSummary = result.summary;
        console.log('📊 COA Summary from backend:', backendSummary);
        
        const summary = {
          total: backendSummary.total,
          asset: backendSummary.Asset,
          liability: backendSummary.Liability,
          equity: backendSummary.Equity,
          revenue: backendSummary.Revenue,
          expense: backendSummary.Expense,
          costOfService: backendSummary.CostOfService,
        };
        console.log('📊 Summary set to state:', summary);
        setAccountSummary(summary);
      }
    } catch (error) {
      console.error('Error fetching account summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `Rp ${(amount / 1000000000).toFixed(1)}M`; // Milyar
    } else if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(0)}jt`; // Juta
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)}rb`; // Ribu
    }
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  // Muted-vibrant palette (A): primary dark slate, accent1 teal-cyan, accent2 indigo
  // Refined navy + blue-centric muted-vibrant palette
  const PALETTE = {
    primary: '#0B2447', // deep navy for accents (less heavy than pure black)
    accent1: '#2DD4BF', // cerulean/teal pop
    accent2: '#3B82F6', // vibrant blue for primary actions
    softIndigo: '#EAF2FF',
    softTeal: '#ECFEFF',
    softGreen: '#F0FFF4',
    softOrange: '#FFFBF0',
    softPurple: '#FBF7FF',
    pageBg: '#F8FAFF', // very light blue background for page surface
  };

  const metrics: MetricCard[] = [
    {
      label: 'Total Akun',
      value: accountSummary.total,
      color: '',
      icon: <DocumentTextIcon className="w-6 h-6" />,
      // visual props used in render
      bg: PALETTE.primary,
      textColor: '#ffffff',
      iconColor: PALETTE.accent2,
    } as any,
    {
      label: 'Aset (Asset)',
      value: formatCurrency(accountSummary.asset),
      color: '',
      icon: <ChartBarIconSolid className="w-6 h-6" />,
      bg: PALETTE.softIndigo,
      textColor: '#0f172a',
      iconColor: PALETTE.accent2,
    } as any,
    {
      label: 'Liabilitas (Liability)',
      value: formatCurrency(accountSummary.liability),
      color: '',
      icon: <ChartBarIconSolid className="w-6 h-6" />,
      bg: PALETTE.softPurple,
      textColor: '#3f3f46',
      iconColor: '#FB7185',
    } as any,
    {
      label: 'Ekuitas (Equity)',
      value: formatCurrency(accountSummary.equity),
      color: '',
      icon: <ChartBarIconSolid className="w-6 h-6" />,
      bg: PALETTE.softGreen,
      textColor: '#064e3b',
      iconColor: '#10B981',
    } as any,
    {
      label: 'Pendapatan (Revenue)',
      value: formatCurrency(accountSummary.revenue),
      color: '',
      icon: <ChartBarIconSolid className="w-6 h-6" />,
      bg: PALETTE.softTeal,
      textColor: '#034047',
      iconColor: PALETTE.accent1,
    } as any,
    {
      label: 'Harga Pokok (COGS)',
      value: formatCurrency(accountSummary.costOfService),
      color: '',
      icon: <ChartBarIconSolid className="w-6 h-6" />,
      bg: PALETTE.softOrange,
      textColor: '#7c2d12',
      iconColor: '#f59e0b',
    } as any,
    {
      label: 'Biaya (Expense)',
      value: formatCurrency(accountSummary.expense),
      color: '',
      icon: <ChartBarIconSolid className="w-6 h-6" />,
      bg: PALETTE.softPurple,
      textColor: '#5b21b6',
      iconColor: '#6d28d9',
    } as any,
  ];

  const tabs = [
    {
      id: 'coa' as TabType,
      label: 'Bagan Akun',
      icon: ChartBarIcon,
      description: 'Daftar semua akun (Kas, Bank, Piutang, dll) untuk mencatat transaksi'
    },
    {
      id: 'journal' as TabType,
      label: 'Entri Jurnal',
      icon: DocumentTextIcon,
      description: 'Catat transaksi dengan sistem double-entry (Debit & Kredit)'
    },
    {
      id: 'ledger' as TabType,
      label: 'Buku Besar',
      icon: BookOpenIcon,
      description: 'Histori semua transaksi per akun untuk melihat mutasi saldo'
    },
    {
      id: 'balance' as TabType,
      label: 'Neraca Saldo',
      icon: ClipboardDocumentListIcon,
      description: 'Ringkasan saldo semua akun untuk memastikan Debit = Kredit'
    },
    {
      id: 'income' as TabType,
      label: 'Neraca',
      icon: BanknotesIcon,
      description: 'Laporan posisi keuangan: Aset, Liabilitas, dan Ekuitas perusahaan'
    },
    {
      id: 'trial' as TabType,
      label: 'Laba Rugi',
      icon: PresentationChartLineIcon,
      description: 'Laporan kinerja: Pendapatan dikurangi Biaya untuk hitung profit'
    },
  ];

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export data');
  };

  const handleAddNew = () => {
    // TODO: Implement add new account
    console.log('Add new account');
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Header Banner - Gradient Blue v2 */}
        <div className="rounded-2xl shadow-lg p-8 relative overflow-hidden" style={{ 
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        }}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold" style={{ color: 'white', fontFamily: 'inherit' }}>Bagan Akun</h1>
              <p className="text-white/90 text-lg mt-1" style={{ fontFamily: 'inherit' }}>Kelola daftar akun keuangan dan entri jurnal perusahaan</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-200 bg-white shadow-sm"
                  style={{ outlineColor: PALETTE.accent2, fontFamily: 'inherit' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Information Box removed per request */}

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {metrics.map((metric: any, index) => (
            <div
              key={index}
              className="rounded-xl shadow-sm p-4 flex flex-col justify-between min-h-[120px] border-2"
              style={{ 
                backgroundColor: metric.bg, 
                color: metric.textColor, 
                borderColor: index === 0 ? PALETTE.accent2 : 'rgba(0,0,0,0.04)',
                fontFamily: 'inherit'
              }}
            >
              <div className="flex items-start justify-between">
                <div className={`font-bold ${index === 0 ? 'text-3xl' : 'text-xl'}`}>
                  {isLoading ? '...' : metric.value}
                </div>
                <div>{metric.icon}</div>
              </div>
              <div className="mt-2 text-xs font-semibold">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <div key={tab.id} className="relative group">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition whitespace-nowrap text-sm shadow-sm hover:shadow-md"
                  style={isActive 
                    ? { background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: '#ffffff', fontFamily: 'inherit' } 
                    : { backgroundColor: '#ffffff', color: '#475569', border: '1px solid #E2E8F0', fontFamily: 'inherit' }
                  }
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
                {/* Tooltip Description */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs whitespace-normal" style={{ fontFamily: 'inherit' }}>
                    <div className="font-semibold mb-1">{tab.label}</div>
                    <div className="text-gray-300">{tab.description}</div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
          {/* Search and Filter Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode akun, nama akun, atau deskripsi..."
                className="pl-10 pr-4 py-2 w-full rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all"
                style={{ fontFamily: 'inherit' }}
              />
            </div>
            <div className="flex items-center gap-3">
              <select className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700">
                <option value="">Semua Tipe</option>
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="REVENUE">Revenue</option>
                <option value="EXPENSE">Expense</option>
                <option value="COST_OF_SERVICE">Cost of Service</option>
              </select>
              <select className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700">
                <option value="10">10 per halaman</option>
                <option value="25">25 per halaman</option>
                <option value="50">50 per halaman</option>
                <option value="100">100 per halaman</option>
              </select>
            </div>
          </div>

          {/* Tab Content Area */}
          {activeTab === 'coa' && <ChartOfAccountsTab />}
          {activeTab === 'journal' && (
            <JournalEntriesTab 
              onSuccess={(message) => console.log('Success:', message)}
              onError={(message) => console.error('Error:', message)}
            />
          )}
          {activeTab === 'ledger' && <GeneralLedgerTab />}
          {activeTab === 'balance' && <BalanceSheetTab />}
          {activeTab === 'income' && <IncomeStatementTab />}
          {activeTab === 'trial' && <TrialBalanceTab />}
        </div>
      </div>
  );
};

export default COA;
