import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Toast } from '../components';
import { useToast } from '../hooks/useToast';

type ReportType = 'profit_loss' | 'balance_sheet' | 'cash_flow';

interface ReportData {
  type: ReportType;
  period: string;
  generated_at: string;
  data: any;
}

const FinancialReports: React.FC = () => {
  const { toasts, hideToast, success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [reportType, setReportType] = useState<ReportType>(
    (params.get('reportType') as ReportType) || 'profit_loss'
  );
  const [startDate, setStartDate] = useState(
    params.get('startDate') ||
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    params.get('endDate') || new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const reportRef = React.useRef<HTMLDivElement>(null);

  const handleGenerateReport = async (): Promise<ReportData | null> => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/financial?type=${reportType}&startDate=${startDate}&endDate=${endDate}`
      );
      const result = await response.json();

      if (result.success) {
        setReportData(result.data);
        toastSuccess('Laporan berhasil dihasilkan');
        return result.data;
      } else {
        toastError(result.message || 'Gagal menghasilkan laporan');
        return null;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toastError('Gagal terhubung ke server. Pastikan Finance Service berjalan.');
      setReportData(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!reportData || !reportRef.current) return;

    try {
      if (format === 'pdf') {
        await import('../utils/reportExporter').then(({ exportElementAsPdf }) => {
          exportElementAsPdf(
            reportRef.current!,
            `laporan_${reportType}_${startDate}_${endDate}.pdf`
          );
        });
      } else {
        await import('../utils/reportExporter').then(({ exportElementAsExcel }) => {
          exportElementAsExcel(
            reportRef.current!,
            `laporan_${reportType}_${startDate}_${endDate}.xlsx`
          );
        });
      }
    } catch (e) {
      console.error('Export error', e);
      toastError('Gagal mengekspor laporan');
    }
  };

  React.useEffect(() => {
    const auto = params.get('autoExport') as 'pdf' | 'excel' | null;
    if (auto) {
      // parameters already applied via state initialization
      handleGenerateReport().then((data) => {
        if (data) {
          handleExport(auto);
        }
      });
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark/5 via-accent-gold/5 to-primary-light/5 py-8">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type as any} onClose={() => hideToast(t.id)} />
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-dark to-primary-light rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <DocumentTextIcon className="w-8 h-8 text-accent-gold" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Laporan Keuangan
              </h1>
              <p className="mt-1 text-sm text-white/90">
                Otomatisasi Akuntansi & Pelaporan Keuangan (TSD FITUR 3.4.D)
              </p>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Parameter Laporan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Laporan
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="profit_loss">Laporan Laba Rugi</option>
                <option value="balance_sheet">
                  Laporan Posisi Keuangan (Neraca)
                </option>
                <option value="cash_flow">Laporan Arus Kas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periode Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periode Selesai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 disabled:bg-gray-300 shadow-lg transition-all"
            >
              {loading ? (
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
                  Memproses...
                </>
              ) : (
                <>
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  Hasilkan Laporan
                </>
              )}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={!reportData}
              className="inline-flex items-center px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Ekspor PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={!reportData}
              className="inline-flex items-center px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Ekspor Excel
            </button>
          </div>
        </div>

        {/* Report Display */}
        {reportData && (
          <div
            ref={reportRef}
            className="bg-white shadow-lg rounded-lg p-8 overflow-x-auto"
          >
            {reportType === 'profit_loss' && (
              <ProfitLossReport
                data={reportData.data}
                period={`${startDate} s/d ${endDate}`}
                formatCurrency={formatCurrency}
              />
            )}
            {reportType === 'balance_sheet' && (
              <BalanceSheetReport
                data={reportData.data}
                asOfDate={endDate}
                formatCurrency={formatCurrency}
              />
            )}
            {reportType === 'cash_flow' && (
              <CashFlowReport
                data={reportData.data}
                period={`${startDate} s/d ${endDate}`}
                formatCurrency={formatCurrency}
              />
            )}
          </div>
        )}

        {!reportData && !loading && (
          <div className="bg-white shadow-lg rounded-lg p-12 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Pilih jenis laporan dan periode, lalu klik "Hasilkan Laporan"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Profit & Loss Report Component
const ProfitLossReport: React.FC<{
  data: any;
  period: string;
  formatCurrency: (amount: number) => string;
}> = ({ data, period, formatCurrency }) => {
  return (
    <div>
      <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
        <h2 className="text-2xl font-bold text-gray-900">LAPORAN LABA RUGI</h2>
        <h3 className="text-lg font-semibold text-gray-700 mt-1">
          PT. UNAIS MULTIVERSE
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          Untuk Periode {period}
        </p>
      </div>

      <table className="w-full break-words">
        <tbody>
          {/* Pendapatan */}
          <tr className="bg-blue-50">
            <td className="py-2 px-4 font-bold text-gray-900">PENDAPATAN</td>
            <td className="py-2 px-4 text-right"></td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Pendapatan Jasa Engineering</td>
            <td className="py-2 px-4 text-right break-words break-words">{formatCurrency(data.revenues.engineering || 0)}</td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Pendapatan Proyek Konstruksi</td>
            <td className="py-2 px-4 text-right break-words">{formatCurrency(data.revenues.construction || 0)}</td>
          </tr>
          <tr className="border-t-2 border-gray-300 font-semibold">
            <td className="py-2 px-4">Total Pendapatan</td>
            <td className="py-2 px-4 text-right break-words">{formatCurrency(data.revenues.total)}</td>
          </tr>

          {/* Beban Pokok Penjualan */}
          <tr className="bg-red-50">
            <td className="py-3 px-4 font-bold text-gray-900 pt-6">BEBAN POKOK PENJUALAN (COGS)</td>
            <td className="py-3 px-4 text-right pt-6"></td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Beban Material</td>
            <td className="py-2 px-4 text-right break-words">({formatCurrency(data.cogs.materials || 0)})</td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Beban Jasa Subkontraktor</td>
            <td className="py-2 px-4 text-right break-words">({formatCurrency(data.cogs.subcontractors || 0)})</td>
          </tr>
          <tr className="border-t-2 border-gray-300 font-semibold">
            <td className="py-2 px-4">Total COGS</td>
            <td className="py-2 px-4 text-right break-words">({formatCurrency(data.cogs.total)})</td>
          </tr>
          <tr className="bg-green-100 font-bold text-lg border-t-4 border-green-600">
            <td className="py-3 px-4">LABA KOTOR</td>
            <td className="py-3 px-4 text-right break-words">{formatCurrency(data.gross_profit)}</td>
          </tr>

          {/* Beban Operasional */}
          <tr className="bg-orange-50">
            <td className="py-3 px-4 font-bold text-gray-900 pt-6">BEBAN OPERASIONAL</td>
            <td className="py-3 px-4 text-right pt-6"></td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Beban Gaji & Tunjangan</td>
            <td className="py-2 px-4 text-right">({formatCurrency(data.operating_expenses.salaries || 0)})</td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Beban Sewa</td>
            <td className="py-2 px-4 text-right">({formatCurrency(data.operating_expenses.rent || 0)})</td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Beban Listrik & Air</td>
            <td className="py-2 px-4 text-right">({formatCurrency(data.operating_expenses.utilities || 0)})</td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Beban Pemasaran</td>
            <td className="py-2 px-4 text-right">({formatCurrency(data.operating_expenses.marketing || 0)})</td>
          </tr>
          <tr className="border-t-2 border-gray-300 font-semibold">
            <td className="py-2 px-4">Total Beban Operasional</td>
            <td className="py-2 px-4 text-right">({formatCurrency(data.operating_expenses.total)})</td>
          </tr>
          <tr className="bg-blue-100 font-bold text-lg border-t-4 border-blue-600">
            <td className="py-3 px-4">LABA OPERASI</td>
            <td className="py-3 px-4 text-right">{formatCurrency(data.operating_income)}</td>
          </tr>

          {/* Pendapatan & Beban Lain-lain */}
          <tr className="bg-gray-50">
            <td className="py-3 px-4 font-bold text-gray-900 pt-6">PENDAPATAN & BEBAN LAIN-LAIN</td>
            <td className="py-3 px-4 text-right pt-6"></td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Pendapatan Bunga</td>
            <td className="py-2 px-4 text-right">{formatCurrency(data.other_income.interest || 0)}</td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Beban Pajak</td>
            <td className="py-2 px-4 text-right">({formatCurrency(data.other_expenses.tax || 0)})</td>
          </tr>

          {/* Net Income */}
          <tr className="bg-emerald-200 font-bold text-xl border-t-4 border-double border-emerald-700">
            <td className="py-4 px-4">LABA BERSIH</td>
            <td className="py-4 px-4 text-right text-emerald-700">{formatCurrency(data.net_income)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Balance Sheet Report Component
const BalanceSheetReport: React.FC<{
  data: any;
  asOfDate: string;
  formatCurrency: (amount: number) => string;
}> = ({ data, asOfDate, formatCurrency }) => {
  return (
    <div>
      <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
        <h2 className="text-2xl font-bold text-gray-900">LAPORAN POSISI KEUANGAN</h2>
        <h3 className="text-lg font-semibold text-gray-700 mt-1">
          PT. UNAIS MULTIVERSE
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          Per Tanggal {asOfDate}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ASET */}
        <div>
          <table className="w-full break-words">
            <tbody>
              <tr className="bg-blue-50">
                <td className="py-2 px-4 font-bold text-gray-900">ASET</td>
                <td className="py-2 px-4 text-right"></td>
              </tr>
              <tr>
                <td className="py-2 px-6 text-gray-700 font-semibold">Aset Lancar</td>
                <td className="py-2 px-4 text-right"></td>
              </tr>
              <tr>
                <td className="py-2 px-8 text-sm text-gray-600">Kas dan Setara Kas</td>
                <td className="py-2 px-4 text-right text-sm">{formatCurrency(data.assets.current.cash || 0)}</td>
              </tr>
              <tr>
                <td className="py-2 px-8 text-sm text-gray-600">Piutang Usaha</td>
                <td className="py-2 px-4 text-right text-sm">{formatCurrency(data.assets.current.receivables || 0)}</td>
              </tr>
              <tr>
                <td className="py-2 px-8 text-sm text-gray-600">Persediaan</td>
                <td className="py-2 px-4 text-right text-sm">{formatCurrency(data.assets.current.inventory || 0)}</td>
              </tr>
              <tr className="border-t border-gray-300 font-semibold text-sm">
                <td className="py-2 px-6">Total Aset Lancar</td>
                <td className="py-2 px-4 text-right">{formatCurrency(data.assets.current.total)}</td>
              </tr>
              <tr>
                <td className="py-2 px-6 text-gray-700 font-semibold pt-4">Aset Tetap</td>
                <td className="py-2 px-4 text-right pt-4"></td>
              </tr>
              <tr>
                <td className="py-2 px-8 text-sm text-gray-600">Peralatan</td>
                <td className="py-2 px-4 text-right text-sm">{formatCurrency(data.assets.fixed.equipment || 0)}</td>
              </tr>
              <tr>
                <td className="py-2 px-8 text-sm text-gray-600">Kendaraan</td>
                <td className="py-2 px-4 text-right text-sm">{formatCurrency(data.assets.fixed.vehicles || 0)}</td>
              </tr>
              <tr className="border-t border-gray-300 font-semibold text-sm">
                <td className="py-2 px-6">Total Aset Tetap</td>
                <td className="py-2 px-4 text-right">{formatCurrency(data.assets.fixed.total)}</td>
              </tr>
              <tr className="bg-blue-100 font-bold text-lg border-t-4 border-blue-600">
                <td className="py-3 px-4">TOTAL ASET</td>
                <td className="py-3 px-4 text-right">{formatCurrency(data.assets.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* LIABILITAS & EKUITAS */}
        <div>
          <table className="w-full break-words">
            <tbody>
              <tr className="bg-red-50">
                <td className="py-2 px-4 font-bold text-gray-900">LIABILITAS</td>
                <td className="py-2 px-4 text-right"></td>
              </tr>
              <tr>
                <td className="py-2 px-6 text-sm text-gray-600">Utang Usaha</td>
                <td className="py-2 px-4 text-right text-sm">{formatCurrency(data.liabilities.accounts_payable || 0)}</td>
              </tr>
              <tr>
                <td className="py-2 px-6 text-sm text-gray-600">Utang Pajak</td>
                <td className="py-2 px-4 text-right text-sm">{formatCurrency(data.liabilities.tax_payable || 0)}</td>
              </tr>
              <tr className="border-t border-gray-300 font-semibold">
                <td className="py-2 px-4">Total Liabilitas</td>
                <td className="py-2 px-4 text-right">{formatCurrency(data.liabilities.total)}</td>
              </tr>

              <tr className="bg-yellow-50">
                <td className="py-3 px-4 font-bold text-gray-900 pt-6">EKUITAS</td>
                <td className="py-3 px-4 text-right pt-6"></td>
              </tr>
              <tr>
                <td className="py-2 px-6 text-sm text-gray-600">Modal Saham</td>
                <td className="py-2 px-4 text-right text-sm">{formatCurrency(data.equity.capital || 0)}</td>
              </tr>
              <tr>
                <td className="py-2 px-6 text-sm text-gray-600">Laba Ditahan</td>
                <td className="py-2 px-4 text-right text-sm">{formatCurrency(data.equity.retained_earnings || 0)}</td>
              </tr>
              <tr className="border-t border-gray-300 font-semibold">
                <td className="py-2 px-4">Total Ekuitas</td>
                <td className="py-2 px-4 text-right">{formatCurrency(data.equity.total)}</td>
              </tr>

              <tr className="bg-blue-100 font-bold text-lg border-t-4 border-blue-600">
                <td className="py-3 px-4">TOTAL LIABILITAS & EKUITAS</td>
                <td className="py-3 px-4 text-right">{formatCurrency(data.liabilities.total + data.equity.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Cash Flow Report Component
const CashFlowReport: React.FC<{
  data: any;
  period: string;
  formatCurrency: (amount: number) => string;
}> = ({ data, period, formatCurrency }) => {
  return (
    <div>
      <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
        <h2 className="text-2xl font-bold text-gray-900">LAPORAN ARUS KAS</h2>
        <h3 className="text-lg font-semibold text-gray-700 mt-1">
          PT. UNAIS MULTIVERSE
        </h3>
        <p className="text-sm text-gray-600 mt-2">
          Untuk Periode {period}
        </p>
      </div>

      <table className="w-full break-words">
        <tbody>
          <tr className="bg-green-50">
            <td className="py-2 px-4 font-bold text-gray-900">ARUS KAS DARI AKTIVITAS OPERASI</td>
            <td className="py-2 px-4 text-right"></td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Penerimaan dari Pelanggan</td>
            <td className="py-2 px-4 text-right">{formatCurrency(data.operating.receipts || 0)}</td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Pembayaran ke Supplier</td>
            <td className="py-2 px-4 text-right">({formatCurrency(data.operating.payments_suppliers || 0)})</td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Pembayaran Gaji</td>
            <td className="py-2 px-4 text-right">({formatCurrency(data.operating.payments_salaries || 0)})</td>
          </tr>
          <tr className="border-t-2 border-gray-300 font-semibold">
            <td className="py-2 px-4">Kas Neto dari Aktivitas Operasi</td>
            <td className="py-2 px-4 text-right">{formatCurrency(data.operating.net)}</td>
          </tr>

          <tr className="bg-blue-50">
            <td className="py-3 px-4 font-bold text-gray-900 pt-6">ARUS KAS DARI AKTIVITAS INVESTASI</td>
            <td className="py-3 px-4 text-right pt-6"></td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Pembelian Peralatan</td>
            <td className="py-2 px-4 text-right">({formatCurrency(data.investing.equipment_purchase || 0)})</td>
          </tr>
          <tr className="border-t-2 border-gray-300 font-semibold">
            <td className="py-2 px-4">Kas Neto dari Aktivitas Investasi</td>
            <td className="py-2 px-4 text-right">{formatCurrency(data.investing.net)}</td>
          </tr>

          <tr className="bg-purple-50">
            <td className="py-3 px-4 font-bold text-gray-900 pt-6">ARUS KAS DARI AKTIVITAS PENDANAAN</td>
            <td className="py-3 px-4 text-right pt-6"></td>
          </tr>
          <tr>
            <td className="py-2 px-6 text-gray-700">Penambahan Modal</td>
            <td className="py-2 px-4 text-right">{formatCurrency(data.financing.capital_increase || 0)}</td>
          </tr>
          <tr className="border-t-2 border-gray-300 font-semibold">
            <td className="py-2 px-4">Kas Neto dari Aktivitas Pendanaan</td>
            <td className="py-2 px-4 text-right">{formatCurrency(data.financing.net)}</td>
          </tr>

          <tr className="bg-emerald-200 font-bold text-xl border-t-4 border-double border-emerald-700">
            <td className="py-4 px-4">KENAIKAN (PENURUNAN) KAS</td>
            <td className="py-4 px-4 text-right text-emerald-700">{formatCurrency(data.net_change)}</td>
          </tr>
          <tr>
            <td className="py-2 px-4 text-gray-700">Kas Awal Periode</td>
            <td className="py-2 px-4 text-right">{formatCurrency(data.beginning_cash || 0)}</td>
          </tr>
          <tr className="bg-emerald-300 font-bold text-xl border-t-4 border-emerald-800">
            <td className="py-4 px-4">KAS AKHIR PERIODE</td>
            <td className="py-4 px-4 text-right text-emerald-800">{formatCurrency(data.ending_cash)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default FinancialReports;
