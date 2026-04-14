import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { exportElementAsPdf } from '../../utils/reportExporter';

interface AgingBucket {
  age_bucket: string;
  invoice_count: number;
  total_amount: number;
}

interface ARAgingReportProps {
  title?: string;
  showExportButton?: boolean;
  compact?: boolean;
}

const ARAgingReport: React.FC<ARAgingReportProps> = ({ 
  title = 'Piutang Aging (AR Receivables)', 
  showExportButton = true,
  compact = false 
}) => {
  const [agingData, setAgingData] = useState<AgingBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgingData();
  }, []);

  const fetchAgingData = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_FINANCE_API || 'http://localhost:3002/api';
      const response = await fetch(`${API_BASE}/ar/aging`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch AR aging: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle both {data: [...]} and direct array responses
      const data = result.data || result;
      setAgingData(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching AR aging:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAgingData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotals = () => {
    let totalInvoices = 0;
    let totalAmount = 0;
    agingData.forEach((bucket) => {
      totalInvoices += bucket.invoice_count || 0;
      totalAmount += bucket.total_amount || 0;
    });
    return { totalInvoices, totalAmount };
  };

  const bucketOrder = [
    'Current', 
    '1-30 Days', 
    '31-60 Days', 
    '61-90 Days', 
    '90+ Days'
  ];

  const displayLabels: Record<string, string> = {
    'Current': 'Not Yet Due',
    '1-30 Days': '1-30 Days Overdue',
    '31-60 Days': '31-60 Days Overdue',
    '61-90 Days': '61-90 Days Overdue',
    '90+ Days': '90+ Days Overdue',
  };

  const bucketMap: Record<string, AgingBucket | null> = {};
  bucketOrder.forEach((bucket) => {
    bucketMap[bucket] = agingData.find(b => b.age_bucket === bucket) || null;
  });

  const { totalInvoices, totalAmount } = calculateTotals();

  const handleExportPDF = async () => {
    try {
      const tmpContainer = document.createElement('div');
      tmpContainer.style.position = 'absolute';
      tmpContainer.style.left = '-9999px';
      tmpContainer.style.width = '800px';
      tmpContainer.style.backgroundColor = 'white';
      tmpContainer.style.padding = '40px';
      tmpContainer.style.fontFamily = 'Arial, sans-serif';

      const reportHTML = generateReportHTML();
      tmpContainer.innerHTML = reportHTML;
      document.body.appendChild(tmpContainer);

      const filename = `AR_Aging_${new Date().toISOString().split('T')[0]}.pdf`;
      await exportElementAsPdf(tmpContainer, filename);

      document.body.removeChild(tmpContainer);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
  };

  const generateReportHTML = (): string => {
    const now = new Date().toLocaleString('id-ID');

    let rows = '';
    bucketOrder.forEach((bucketKey) => {
      const bucket = bucketMap[bucketKey];
      const amount = bucket?.total_amount || 0;
      const count = bucket?.invoice_count || 0;
      const percentage = totalAmount ? ((amount / totalAmount) * 100).toFixed(1) : '0.0';
      
      const bgColor = bucketKey === 'Current' ? '#f3f4f6' : 
                      bucketKey === '90+ Days' ? '#fee2e2' : '';
      
      rows += `
        <tr style="${bgColor ? `background-color: ${bgColor};` : ''}">
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${displayLabels[bucketKey]}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${count}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(amount)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${percentage}%</td>
        </tr>
      `;
    });

    return `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="margin: 0; color: #1f2937; font-size: 24px;">Piutang Aging Report (AR)</h1>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">PT. UNAIS MULTIVERSE</p>
        <p style="margin: 5px 0; color: #666; font-size: 12px;">As of ${new Date().toISOString().split('T')[0]}</p>
        <p style="margin: 5px 0; color: #999; font-size: 11px;">Generated: ${now}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #7C2D12; color: white; font-weight: bold;">
          <td style="padding: 10px; border: 1px solid #333;">Age Category</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: center;">Invoices</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: right;">Amount (Rp)</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: right;">% Total</td>
        </tr>
        ${rows}
        <tr style="font-weight: bold; background-color: #c7d2e0;">
          <td style="padding: 10px; border: 1px solid #333;">Total</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: center;">${totalInvoices}</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: right;">${formatCurrency(totalAmount)}</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: right;">100%</td>
        </tr>
      </table>
    `;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-semibold">Error loading aging data</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className={compact ? '' : 'space-y-6'}>
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-6 w-6 text-white" />
              <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            {showExportButton && (
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Export PDF
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-600 font-semibold mb-1">Total Invoices</p>
              <p className="text-2xl font-bold text-blue-900">{totalInvoices}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-600 font-semibold mb-1">Total Receivables</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <p className="text-sm text-red-600 font-semibold mb-1">Overdue (90+ Days)</p>
              <p className="text-2xl font-bold text-red-900">
                {formatCurrency(
                  bucketMap['90+ Days']?.total_amount || 0
                )}
              </p>
            </div>
          </div>

          {/* Aging Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Age Category</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Invoices</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount (Rp)</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {bucketOrder.map((bucketKey) => {
                  const bucket = bucketMap[bucketKey];
                  const amount = bucket?.total_amount || 0;
                  const count = bucket?.invoice_count || 0;
                  const percentage = totalAmount ? ((amount / totalAmount) * 100).toFixed(1) : '0.0';
                  
                  const rowColor = bucketKey === 'Current' ? 'bg-green-50' : 
                                   bucketKey === '90+ Days' ? 'bg-red-50' : 'bg-white';

                  return (
                    <tr key={bucketKey} className={`${rowColor} border-b border-gray-200 hover:bg-gray-50 transition`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{displayLabels[bucketKey]}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{count}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(amount)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                  <td className="px-4 py-3 text-gray-900">Total</td>
                  <td className="px-4 py-3 text-center text-gray-900">{totalInvoices}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-gray-900">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Warning for High Overdue */}
          {(bucketMap['90+ Days']?.total_amount || 0) > 0 && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 rounded p-4">
              <div className="flex gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Overdue Alert</p>
                  <p className="text-red-800 text-sm mt-1">
                    You have Rp {formatCurrency(bucketMap['90+ Days']?.total_amount || 0)} in invoices overdue by 90+ days. 
                    Immediate action is recommended.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ARAgingReport;
