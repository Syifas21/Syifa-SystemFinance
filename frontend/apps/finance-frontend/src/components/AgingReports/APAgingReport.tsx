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

interface APAgingReportProps {
  title?: string;
  showExportButton?: boolean;
  compact?: boolean;
}

const APAgingReport: React.FC<APAgingReportProps> = ({ 
  title = 'Hutang Aging (AP Payables)', 
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
      const response = await fetch(`${API_BASE}/payables/aging`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch AP aging: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle both {data: [...]} and direct array responses
      const data = result.data || result;
      setAgingData(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching AP aging:', err);
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

      const filename = `AP_Aging_${new Date().toISOString().split('T')[0]}.pdf`;
      await exportElementAsPdf(tmpContainer, filename);

      document.body.removeChild(tmpContainer);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
  };

  const generateReportHTML = (): string => {
    const now = new Date().toLocaleString('id-ID');
    const { totalInvoices, totalAmount } = calculateTotals();

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
        <h1 style="margin: 0; color: #1f2937; font-size: 24px;">Hutang Aging Report (AP)</h1>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">PT. UNAIS MULTIVERSE</p>
        <p style="margin: 5px 0; color: #666; font-size: 12px;">As of ${new Date().toISOString().split('T')[0]}</p>
        <p style="margin: 5px 0; color: #999; font-size: 11px;">Generated: ${now}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #7C2D12; color: white; font-weight: bold;">
          <td style="padding: 10px; border: 1px solid #333;">Age Category</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: center;">Items</td>
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

  const { totalInvoices, totalAmount } = calculateTotals();

  return (
    <div className={compact ? '' : 'space-y-6'}>
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-6 w-6 text-white" />
              <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            {showExportButton && (
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 bg-white text-rose-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
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
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg p-4 border border-rose-200">
              <p className="text-sm text-rose-600 font-semibold mb-1">Total Items</p>
              <p className="text-2xl font-bold text-rose-900">{totalInvoices}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <p className="text-sm text-orange-600 font-semibold mb-1">Total Payables</p>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <p className="text-sm text-red-600 font-semibold mb-1">Critical (90+ Days)</p>
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
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Items</th>
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

                  const bgColor = bucketKey === 'Current' ? 'bg-green-50' :
                                  bucketKey === '1-30 Days' ? 'bg-yellow-50' :
                                  bucketKey === '31-60 Days' ? 'bg-orange-50' :
                                  bucketKey === '61-90 Days' ? 'bg-orange-100' :
                                  'bg-red-50';

                  return (
                    <tr key={bucketKey} className={`${bgColor} border-b border-gray-200 hover:opacity-75 transition`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{displayLabels[bucketKey]}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{count}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(amount)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{percentage}%</td>
                    </tr>
                  );
                })}
                <tr className="font-bold bg-blue-50 border-t-2 border-gray-300">
                  <td className="px-4 py-3 text-gray-900">Total</td>
                  <td className="px-4 py-3 text-center text-gray-900">{totalInvoices}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-gray-900">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APAgingReport;
