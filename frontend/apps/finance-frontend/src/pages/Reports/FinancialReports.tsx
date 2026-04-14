import React, { useState, useEffect } from "react";
import {
  DocumentChartBarIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ScaleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

/**
 * FITUR 3.4.D - Financial Reports
 * TSD: Comprehensive financial reporting with P&L, Balance Sheet, Cash Flow
 * Location: /finance/reports
 */

type ReportType = 'profit_loss' | 'balance_sheet' | 'cash_flow';

interface ReportFilters {
  type: ReportType;
  start_date: string;
  end_date: string;
  as_of_date: string;
}

export default function FinancialReports() {
  const [filters, setFilters] = useState<ReportFilters>({
    type: 'profit_loss',
    start_date: `${new Date().getFullYear()}-01-01`,
    end_date: new Date().toISOString().split('T')[0],
    as_of_date: new Date().toISOString().split('T')[0],
  });

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('type', filters.type);
      
      if (filters.type === 'balance_sheet') {
        params.append('as_of_date', filters.as_of_date);
      } else {
        params.append('start_date', filters.start_date);
        params.append('end_date', filters.end_date);
      }

      const API_BASE = import.meta.env.VITE_FINANCE_API || 'http://localhost:3002/api';
      const response = await fetch(`${API_BASE}/reports/financial?${params.toString()}`);
      const result = await response.json();
      
      console.log('📊 Report response:', result);
      
      if (result.success) {
        setReportData(result.data);
      } else {
        console.error('Report fetch failed:', result.message);
        alert('⚠️ Gagal memuat laporan: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      alert('❌ Error memuat laporan. Pastikan backend berjalan di port 3002.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getReportIcon = (type: ReportType) => {
    switch (type) {
      case 'profit_loss': return <ChartBarIcon className="w-6 h-6" />;
      case 'balance_sheet': return <ScaleIcon className="w-6 h-6" />;
      case 'cash_flow': return <BanknotesIcon className="w-6 h-6" />;
    }
  };

  const getReportTitle = (type: ReportType) => {
    switch (type) {
      case 'profit_loss': return 'Laporan Laba Rugi (Income Statement)';
      case 'balance_sheet': return 'Neraca (Balance Sheet)';
      case 'cash_flow': return 'Laporan Arus Kas (Cash Flow Statement)';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-primary-dark rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent-gold/30 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <DocumentChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Laporan Keuangan</h1>
            </div>
            <p className="text-white/90 text-lg font-medium drop-shadow">
              📊 Profit & Loss, Balance Sheet, Cash Flow Statement
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-white/25 text-white px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                TSD FITUR 3.4.D - Financial Reports
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-primary-dark rounded-full"></div>
          <h3 className="text-lg font-bold text-gray-800">🔍 Filter Laporan</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jenis Laporan
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all duration-200 bg-white hover:border-primary-light font-medium"
            >
              <option value="profit_loss">📊 Laba Rugi</option>
              <option value="balance_sheet">⚖️ Neraca</option>
              <option value="cash_flow">💰 Arus Kas</option>
            </select>
          </div>

          {/* Date Filters */}
          {filters.type === 'balance_sheet' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Per Tanggal
              </label>
              <input
                type="date"
                name="as_of_date"
                value={filters.as_of_date}
                onChange={handleFilterChange}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all duration-200 bg-white hover:border-primary-light"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all duration-200 bg-white hover:border-primary-light"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all duration-200 bg-white hover:border-primary-light"
                />
              </div>
            </>
          )}

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-dark text-white font-bold shadow-lg hover:shadow-xl hover:bg-primary-light/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <DocumentChartBarIcon className="w-5 h-5" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Generating report...</p>
        </div>
      ) : reportData ? (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Report Header */}
          <div className="bg-primary-dark p-6 border-b border-primary-light">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-primary-dark p-3 rounded-2xl shadow-lg">
                  {getReportIcon(filters.type)}
                  <span className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {getReportTitle(filters.type)}
                  </h2>
                  <p className="text-sm text-accent-gold mt-1">
                    PT. UNAIS MULTIVERSE
                  </p>
                  <p className="text-xs text-white/80 mt-1">
                    {filters.type === 'balance_sheet' 
                      ? `Per ${filters.as_of_date}`
                      : `Periode: ${filters.start_date} s/d ${filters.end_date}`
                    }
                  </p>
                </div>
              </div>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-dark text-white font-bold shadow-md hover:shadow-lg hover:bg-primary-light/80 transition-all duration-200">
                <ArrowDownTrayIcon className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="p-6">
            {filters.type === 'profit_loss' && reportData.data && (
              <ProfitLossReport data={reportData.data} formatCurrency={formatCurrency} />
            )}
            {filters.type === 'balance_sheet' && reportData.data && (
              <BalanceSheetReport data={reportData.data} formatCurrency={formatCurrency} />
            )}
            {filters.type === 'cash_flow' && reportData.data && (
              <CashFlowReport data={reportData.data} formatCurrency={formatCurrency} />
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <DocumentChartBarIcon className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 font-medium text-lg">
            Pilih jenis laporan dan periode, lalu klik "Generate"
          </p>
        </div>
      )}
    </div>
  );
}

// Profit & Loss Report Component
function ProfitLossReport({ data, formatCurrency }: any) {
  return (
    <div className="space-y-6">
      {/* Revenues */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">📈</span> Pendapatan (Revenues)
        </h3>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Pendapatan Penjualan</span>
              <span className="font-semibold">{formatCurrency(data.revenues.sales_revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Pendapatan Jasa</span>
              <span className="font-semibold">{formatCurrency(data.revenues.service_revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Pendapatan Lain-lain</span>
              <span className="font-semibold">{formatCurrency(data.revenues.other_income)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-green-300">
              <span className="font-bold text-gray-900">Total Pendapatan</span>
              <span className="font-bold text-green-600 text-lg">{formatCurrency(data.revenues.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* COGS */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">📦</span> Harga Pokok Penjualan (COGS)
        </h3>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Harga Pokok Penjualan</span>
              <span className="font-semibold">{formatCurrency(data.cogs.total)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-orange-300">
              <span className="font-bold text-gray-900">Laba Kotor</span>
              <span className="font-bold text-blue-600 text-lg">{formatCurrency(data.gross_profit)}</span>
            </div>
            <div className="text-right text-sm text-gray-600">
              Margin: {data.gross_margin_pct}%
            </div>
          </div>
        </div>
      </div>

      {/* Operating Expenses */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">💼</span> Beban Operasional
        </h3>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Gaji & Upah</span>
              <span className="font-semibold">{formatCurrency(data.operating_expenses.salaries_wages)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Sewa</span>
              <span className="font-semibold">{formatCurrency(data.operating_expenses.rent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Utilitas</span>
              <span className="font-semibold">{formatCurrency(data.operating_expenses.utilities)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Marketing</span>
              <span className="font-semibold">{formatCurrency(data.operating_expenses.marketing)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Depresiasi</span>
              <span className="font-semibold">{formatCurrency(data.operating_expenses.depreciation)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-red-300">
              <span className="font-bold text-gray-900">Total Beban Operasional</span>
              <span className="font-bold text-red-600 text-lg">({formatCurrency(data.operating_expenses.total)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Income */}
      <div className="bg-indigo-100 rounded-xl p-6 border-2 border-indigo-300 shadow-lg">
        <div className="space-y-3">
          <div className="flex justify-between text-lg">
            <span className="font-bold text-gray-900">Laba Operasional</span>
            <span className="font-bold text-indigo-600">{formatCurrency(data.operating_income)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Laba Sebelum Pajak</span>
            <span className="font-semibold">{formatCurrency(data.income_before_tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Pajak Penghasilan (22%)</span>
            <span className="font-semibold">({formatCurrency(data.tax_expense)})</span>
          </div>
          <div className="flex justify-between pt-3 border-t-2 border-indigo-400">
            <span className="font-bold text-gray-900 text-xl">LABA BERSIH</span>
            <span className="font-bold text-green-600 text-2xl">{formatCurrency(data.net_income)}</span>
          </div>
          <div className="text-right text-sm text-gray-600">
            Net Margin: {data.net_margin_pct}%
          </div>
        </div>
      </div>
    </div>
  );
}

// Balance Sheet Report Component
function BalanceSheetReport({ data, formatCurrency }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Assets */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">💰</span> ASET (ASSETS)
        </h3>
        
        {/* Current Assets */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h4 className="font-bold text-gray-900 mb-3">Aset Lancar</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Kas & Bank</span>
              <span className="font-semibold">{formatCurrency(data.assets.current_assets.cash_bank)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Piutang Usaha</span>
              <span className="font-semibold">{formatCurrency(data.assets.current_assets.accounts_receivable)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Persediaan</span>
              <span className="font-semibold">{formatCurrency(data.assets.current_assets.inventory)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-blue-300">
              <span className="font-bold text-gray-900">Total Aset Lancar</span>
              <span className="font-bold text-blue-600">{formatCurrency(data.assets.current_assets.total)}</span>
            </div>
          </div>
        </div>

        {/* Fixed Assets */}
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
          <h4 className="font-bold text-gray-900 mb-3">Aset Tetap</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Aset Tetap</span>
              <span className="font-semibold">{formatCurrency(data.assets.fixed_assets.property_plant_equipment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Akumulasi Depresiasi</span>
              <span className="font-semibold">({formatCurrency(data.assets.fixed_assets.accumulated_depreciation)})</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-indigo-300">
              <span className="font-bold text-gray-900">Total Aset Tetap</span>
              <span className="font-bold text-indigo-600">{formatCurrency(data.assets.fixed_assets.total)}</span>
            </div>
          </div>
        </div>

        {/* Total Assets */}
        <div className="bg-green-100 rounded-xl p-4 border-2 border-green-400 shadow-lg">
          <div className="flex justify-between">
            <span className="font-bold text-gray-900 text-lg">TOTAL ASET</span>
            <span className="font-bold text-green-600 text-xl">{formatCurrency(data.assets.total_assets)}</span>
          </div>
        </div>
      </div>

      {/* Liabilities & Equity */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-2xl">⚖️</span> KEWAJIBAN & EKUITAS
        </h3>
        
        {/* Current Liabilities */}
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <h4 className="font-bold text-gray-900 mb-3">Kewajiban Lancar</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Utang Usaha</span>
              <span className="font-semibold">{formatCurrency(data.liabilities.current_liabilities.accounts_payable)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Utang Jangka Pendek</span>
              <span className="font-semibold">{formatCurrency(data.liabilities.current_liabilities.short_term_debt)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-red-300">
              <span className="font-bold text-gray-900">Total Kewajiban Lancar</span>
              <span className="font-bold text-red-600">{formatCurrency(data.liabilities.current_liabilities.total)}</span>
            </div>
          </div>
        </div>

        {/* Long-term Liabilities */}
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <h4 className="font-bold text-gray-900 mb-3">Kewajiban Jangka Panjang</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Utang Jangka Panjang</span>
              <span className="font-semibold">{formatCurrency(data.liabilities.long_term_liabilities.long_term_debt)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-orange-300">
              <span className="font-bold text-gray-900">Total Kewajiban</span>
              <span className="font-bold text-orange-600">{formatCurrency(data.liabilities.total_liabilities)}</span>
            </div>
          </div>
        </div>

        {/* Equity */}
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <h4 className="font-bold text-gray-900 mb-3">Ekuitas</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Modal Saham</span>
              <span className="font-semibold">{formatCurrency(data.equity.share_capital)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Laba Ditahan</span>
              <span className="font-semibold">{formatCurrency(data.equity.retained_earnings)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-purple-300">
              <span className="font-bold text-gray-900">Total Ekuitas</span>
              <span className="font-bold text-purple-600">{formatCurrency(data.equity.total)}</span>
            </div>
          </div>
        </div>

        {/* Total Liabilities & Equity */}
        <div className="bg-green-100 rounded-xl p-4 border-2 border-green-400 shadow-lg">
          <div className="flex justify-between">
            <span className="font-bold text-gray-900 text-lg">TOTAL KEWAJIBAN & EKUITAS</span>
            <span className="font-bold text-green-600 text-xl">{formatCurrency(data.total_liabilities_and_equity)}</span>
          </div>
        </div>

        {/* Financial Ratios */}
        <div className="bg-blue-100 rounded-xl p-4 border border-blue-300">
          <h4 className="font-bold text-gray-900 mb-3">📊 Rasio Keuangan</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Current Ratio</span>
              <span className="font-semibold">{data.financial_ratios.current_ratio}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Debt to Equity</span>
              <span className="font-semibold">{data.financial_ratios.debt_to_equity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Debt Ratio</span>
              <span className="font-semibold">{data.financial_ratios.debt_ratio}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cash Flow Report Component
function CashFlowReport({ data, formatCurrency }: any) {
  return (
    <div className="space-y-6">
      {/* Operating Activities */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">💼</span> Aktivitas Operasi
        </h3>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Penerimaan dari Penjualan</span>
              <span className="font-semibold text-green-600">{formatCurrency(data.operating_activities.cash_from_customers)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Pembayaran ke Supplier</span>
              <span className="font-semibold text-red-600">({formatCurrency(Math.abs(data.operating_activities.cash_to_suppliers))})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Pembayaran Gaji</span>
              <span className="font-semibold text-red-600">({formatCurrency(data.operating_activities.cash_for_salaries)})</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-blue-300">
              <span className="font-bold text-gray-900">Kas Bersih dari Operasi</span>
              <span className="font-bold text-blue-600 text-lg">{formatCurrency(data.operating_activities.net_cash_from_operating)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Investing Activities */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">🏭</span> Aktivitas Investasi
        </h3>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Pembelian Aset Tetap</span>
              <span className="font-semibold text-red-600">({formatCurrency(data.investing_activities.purchase_of_assets)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Penjualan Aset</span>
              <span className="font-semibold text-green-600">{formatCurrency(data.investing_activities.sale_of_assets)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-purple-300">
              <span className="font-bold text-gray-900">Kas Bersih dari Investasi</span>
              <span className="font-bold text-purple-600 text-lg">{formatCurrency(data.investing_activities.net_cash_from_investing)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financing Activities */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-2xl">🏦</span> Aktivitas Pendanaan
        </h3>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Penerimaan Pinjaman</span>
              <span className="font-semibold text-green-600">{formatCurrency(data.financing_activities.proceeds_from_loans)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Pembayaran Pinjaman</span>
              <span className="font-semibold text-red-600">({formatCurrency(data.financing_activities.repayment_of_loans)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Pembayaran Dividen</span>
              <span className="font-semibold text-red-600">({formatCurrency(data.financing_activities.dividends_paid)})</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-orange-300">
              <span className="font-bold text-gray-900">Kas Bersih dari Pendanaan</span>
              <span className="font-bold text-orange-600 text-lg">{formatCurrency(data.financing_activities.net_cash_from_financing)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Cash Flow */}
      <div className="bg-indigo-100 rounded-xl p-6 border-2 border-indigo-300 shadow-lg">
        <div className="space-y-3">
          <div className="flex justify-between text-lg">
            <span className="font-bold text-gray-900">Kenaikan/Penurunan Kas Bersih</span>
            <span className="font-bold text-indigo-600">{formatCurrency(data.net_increase_decrease_in_cash)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Kas Awal Periode</span>
            <span className="font-semibold">{formatCurrency(data.cash_at_beginning)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t-2 border-indigo-400">
            <span className="font-bold text-gray-900 text-xl">KAS AKHIR PERIODE</span>
            <span className="font-bold text-green-600 text-2xl">{formatCurrency(data.cash_at_end)}</span>
          </div>
        </div>
      </div>

      {/* Free Cash Flow */}
      <div className="bg-green-50 rounded-xl p-4 border border-green-300">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600 block">Free Cash Flow</span>
            <span className="text-xs text-gray-500">(Operating + Investing Cash Flow)</span>
          </div>
          <span className="font-bold text-green-600 text-xl">{formatCurrency(data.summary.free_cash_flow)}</span>
        </div>
      </div>
    </div>
  );
}
