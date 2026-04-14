import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { exportElementAsPdf } from '../../utils/reportExporter';

const CEOFinancialReports: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [exportingReport, setExportingReport] = useState<string | null>(null);

  // CEO theme colors
  const ceoTheme = {
    primary: '#7C2D12',
    secondary: '#92400E',
    accent: '#D97706',
    light: '#FEF3C7',
  };

  // Mock data - in real app, fetch from API
  const executiveSummary = {
    revenue: {
      current: 2400000000,
      previous: 2100000000,
      trend: 'up' as const,
      change: 14.3,
    },
    profit: {
      current: 680000000,
      previous: 620000000,
      trend: 'up' as const,
      change: 9.7,
    },
    expenses: {
      current: 1200000000,
      previous: 1240000000,
      trend: 'down' as const,
      change: -3.2,
    },
    cashflow: {
      current: 450000000,
      previous: 390000000,
      trend: 'up' as const,
      change: 15.4,
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportReport = async (reportName: string) => {
    setExportingReport(reportName);
    
    try {
      // map friendly name to API endpoint
      const mapping: Record<string, { endpoint: string; type: string }> = {
        'Laba Rugi': { endpoint: '/reports/financial?type=profit_loss', type: 'profit_loss' },
        Neraca: { endpoint: '/reports/financial?type=balance_sheet', type: 'balance_sheet' },
        'Arus Kas': { endpoint: '/reports/financial?type=cash_flow', type: 'cash_flow' },
        'Piutang Aging': { endpoint: '/ar/aging', type: 'receivables_aging' },
        'Hutang Aging': { endpoint: '/payables?status=PENDING', type: 'payables_aging' },
        'Profit Margin': { endpoint: '/reports/financial?type=profit_loss', type: 'profit_margin' },
      };
      
      const targetReport = mapping[reportName] || mapping['Laba Rugi'];
      const { endpoint, type } = targetReport;

      // compute dates based on selectedPeriod
      const now = new Date();
      let startDate = '';
      let endDate = '';
      if (selectedPeriod === 'thisMonth') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split('T')[0];
      } else if (selectedPeriod === 'thisQuarter') {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
          .toISOString()
          .split('T')[0];
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0)
          .toISOString()
          .split('T')[0];
      } else if (selectedPeriod === 'thisYear') {
        startDate = new Date(now.getFullYear(), 0, 1)
          .toISOString()
          .split('T')[0];
        endDate = new Date(now.getFullYear(), 11, 31)
          .toISOString()
          .split('T')[0];
      }

      // Fetch report data from appropriate endpoint
      const API_BASE = import.meta.env.VITE_FINANCE_API || 'http://localhost:3002/api';
      
      let reportUrl = '';
      if (type === 'receivables_aging') {
        // Use AR aging endpoint
        reportUrl = `${API_BASE}${endpoint}`;
      } else if (type === 'payables_aging') {
        // Fetch payables with status=unpaid for aging calculation
        reportUrl = `${API_BASE}${endpoint}`;
      } else if (type === 'profit_margin') {
        // Use P&L endpoint to compute margins
        reportUrl = `${API_BASE}${endpoint}&startDate=${startDate}&endDate=${endDate}`;
      } else {
        // Use standard financial report endpoint
        reportUrl = `${API_BASE}${endpoint}&startDate=${startDate}&endDate=${endDate}`;
      }

      console.log(`📥 Fetching report from: ${reportUrl}`);
      const response = await fetch(reportUrl);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || `HTTP ${response.status}`);
      }

      // Handle different response formats:
      // - Financial reports: {success: true, data: {...}}
      // - AR/AP aging: either array directly OR {success: true, data: [...]}
      let reportData = result;
      if (result.success === false) {
        throw new Error(result.message || 'Gagal memuat laporan');
      }
      if (result.data !== undefined && (type === 'receivables_aging' || type === 'payables_aging')) {
        reportData = Array.isArray(result.data) ? result : { data: result };
      } else if (!Array.isArray(reportData) && result.data && !result.success) {
        // For endpoints that return {data: ...} without success field
        reportData = result;
      }

      // Create temporary container for report
      const tmpContainer = document.createElement('div');
      tmpContainer.style.position = 'absolute';
      tmpContainer.style.left = '-9999px';
      tmpContainer.style.top = '-9999px';
      tmpContainer.style.width = '800px';
      tmpContainer.style.backgroundColor = 'white';
      tmpContainer.style.padding = '40px';
      tmpContainer.style.fontFamily = 'Arial, sans-serif';

      // Build report HTML based on type
      let reportHTML = '';
      
      if (type === 'profit_loss') {
        reportHTML = generateProfitLossHTML(reportName, reportData.data || reportData, startDate, endDate);
      } else if (type === 'balance_sheet') {
        reportHTML = generateBalanceSheetHTML(reportName, reportData.data || reportData, endDate);
      } else if (type === 'cash_flow') {
        reportHTML = generateCashFlowHTML(reportName, reportData.data || reportData, startDate, endDate);
      } else if (type === 'receivables_aging') {
        reportHTML = generateReceivablesAgingHTML(reportName, reportData, startDate, endDate);
      } else if (type === 'payables_aging') {
        reportHTML = generatePayablesAgingHTML(reportName, reportData, startDate, endDate);
      } else if (type === 'profit_margin') {
        reportHTML = generateProfitMarginHTML(reportName, reportData.data || reportData, startDate, endDate);
      }

      tmpContainer.innerHTML = reportHTML;
      document.body.appendChild(tmpContainer);

      // Export as PDF
      const filename = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      await exportElementAsPdf(tmpContainer, filename);

      // Clean up
      document.body.removeChild(tmpContainer);
      setExportingReport(null);
      console.log(`✅ Report ${reportName} exported successfully`);
    } catch (error) {
      console.error('❌ Export error:', error);
      alert(`❌ Gagal mengexport laporan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setExportingReport(null);
    }
  };

  // ====================== Report HTML Generators ======================

  const generateProfitLossHTML = (
    reportName: string,
    data: any,
    startDate: string,
    endDate: string
  ): string => {
    const reportData = data.data || data;

    return `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="margin: 0; color: #1f2937; font-size: 24px;">${reportName}</h1>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">PT. UNAIS MULTIVERSE</p>
        <p style="margin: 5px 0; color: #666; font-size: 12px;">Periode: ${startDate} s/d ${endDate}</p>
        <p style="margin: 5px 0; color: #999; font-size: 11px;">Generated: ${new Date().toLocaleString('id-ID')}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; color: #1f2937; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Pendapatan (Revenues)</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Engineering</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.revenues?.engineering || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Construction</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.revenues?.construction || 0)}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #c7d2e0;">
            <td style="padding: 8px; border: 1px solid #333;">Total Pendapatan</td>
            <td style="padding: 8px; border: 1px solid #333; text-align: right;">${formatCurrency(reportData.revenues?.total || 0)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; color: #1f2937; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Harga Pokok Penjualan (COGS)</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Materials</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.cogs?.materials || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Subcontractors</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.cogs?.subcontractors || 0)}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #d1e7dd;">
            <td style="padding: 8px; border: 1px solid #333;">Laba Kotor</td>
            <td style="padding: 8px; border: 1px solid #333; text-align: right;">${formatCurrency(reportData.gross_profit || 0)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; color: #1f2937; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Beban Operasional</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Salaries & Wages</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.operating_expenses?.salaries || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Rent & Utilities</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.operating_expenses?.rent || 0)}</td>
          </tr>
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Marketing & Sales</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.operating_expenses?.marketing || 0)}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #ffe0b2;">
            <td style="padding: 8px; border: 1px solid #333;">Total Operasional</td>
            <td style="padding: 8px; border: 1px solid #333; text-align: right;">${formatCurrency(reportData.operating_expenses?.total || 0)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="font-weight: bold; background-color: #6366f1; color: white;">
            <td style="padding: 10px; border: 1px solid #333;">Net Income</td>
            <td style="padding: 10px; border: 1px solid #333; text-align: right;">${formatCurrency(reportData.net_income || 0)}</td>
          </tr>
        </table>
      </div>
    `;
  };

  const generateBalanceSheetHTML = (
    reportName: string,
    data: any,
    endDate: string
  ): string => {
    const reportData = data.data || data;

    return `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="margin: 0; color: #1f2937; font-size: 24px;">${reportName}</h1>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">PT. UNAIS MULTIVERSE</p>
        <p style="margin: 5px 0; color: #666; font-size: 12px;">Per ${endDate}</p>
        <p style="margin: 5px 0; color: #999; font-size: 11px;">Generated: ${new Date().toLocaleString('id-ID')}</p>
      </div>

      <div style="display: flex; gap: 30px;">
        <div style="flex: 1;">
          <h2 style="font-size: 16px; color: #1f2937; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">ASET</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f3f4f6; font-weight: bold;">
              <td style="padding: 8px; border: 1px solid #e5e7eb;">Current Assets</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.assets?.current?.total || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">Fixed Assets</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.assets?.fixed?.total || 0)}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #c7d2e0;">
              <td style="padding: 8px; border: 1px solid #333;">Total Aset</td>
              <td style="padding: 8px; border: 1px solid #333; text-align: right;">${formatCurrency(reportData.assets?.total || 0)}</td>
            </tr>
          </table>
        </div>
        <div style="flex: 1;">
          <h2 style="font-size: 16px; color: #1f2937; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">LIABILITAS & EKUITAS</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f3f4f6; font-weight: bold;">
              <td style="padding: 8px; border: 1px solid #e5e7eb;">Accounts Payable</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.liabilities?.accounts_payable || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">Tax Payable</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.liabilities?.tax_payable || 0)}</td>
            </tr>
            <tr style="background-color: #f3f4f6; font-weight: bold;">
              <td style="padding: 8px; border: 1px solid #e5e7eb;">Total Equity</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.equity?.total || 0)}</td>
            </tr>
            <tr style="font-weight: bold; background-color: #c7d2e0;">
              <td style="padding: 8px; border: 1px solid #333;">Total Liab + Equity</td>
              <td style="padding: 8px; border: 1px solid #333; text-align: right;">${formatCurrency((reportData.liabilities?.total || 0) + (reportData.equity?.total || 0))}</td>
            </tr>
          </table>
        </div>
      </div>
    `;
  };

  const generateCashFlowHTML = (
    reportName: string,
    data: any,
    startDate: string,
    endDate: string
  ): string => {
    const reportData = data.data || data;

    return `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="margin: 0; color: #1f2937; font-size: 24px;">${reportName}</h1>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">PT. UNAIS MULTIVERSE</p>
        <p style="margin: 5px 0; color: #666; font-size: 12px;">Periode: ${startDate} s/d ${endDate}</p>
        <p style="margin: 5px 0; color: #999; font-size: 11px;">Generated: ${new Date().toLocaleString('id-ID')}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; color: #1f2937; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Aktivitas Operasional</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Cash Receipts</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.operating?.receipts || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Supplier Payments</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">(${formatCurrency(reportData.operating?.payments_suppliers || 0)})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Salary Payments</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">(${formatCurrency(reportData.operating?.payments_salaries || 0)})</td>
          </tr>
          <tr style="font-weight: bold; background-color: #c7d2e0;">
            <td style="padding: 8px; border: 1px solid #333;">Net Operating CF</td>
            <td style="padding: 8px; border: 1px solid #333; text-align: right;">${formatCurrency(reportData.operating?.net || 0)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; color: #1f2937; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Aktivitas Investasi</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Equipment Purchase</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">(${formatCurrency(reportData.investing?.equipment_purchase || 0)})</td>
          </tr>
          <tr style="font-weight: bold; background-color: #ffe0b2;">
            <td style="padding: 8px; border: 1px solid #333;">Net Investing CF</td>
            <td style="padding: 8px; border: 1px solid #333; text-align: right;">${formatCurrency(reportData.investing?.net || 0)}</td>
          </tr>
        </table>
      </div>

      <div style="border-top: 2px solid #333; padding-top: 15px;">
        <h2 style="font-size: 16px; color: #1f2937; margin-bottom: 10px;">Ringkasan Kas</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Beginning Cash</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(reportData.beginning_cash || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Net Cash Flow</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency((reportData.operating?.net || 0) + (reportData.investing?.net || 0))}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #d1e7dd;">
            <td style="padding: 10px; border: 1px solid #333;">Ending Cash</td>
            <td style="padding: 10px; border: 1px solid #333; text-align: right;">${formatCurrency(reportData.ending_cash || 0)}</td>
          </tr>
        </table>
      </div>
    `;
  };

  const generateReceivablesAgingHTML = (
    reportName: string,
    data: any,
    startDate: string,
    endDate: string
  ): string => {
    // Backend returns array of age buckets: [{age_bucket: "Current", invoice_count: 5, total_amount: 500000000}, ...]
    const agingArray = Array.isArray(data.data) ? data.data : [];
    
    // Map backend buckets to display names and calculate totals
    const bucketMap: Record<string, { displayName: string; amount: number }> = {
      'Current': { displayName: 'Not Yet Due', amount: 0 },
      '1-30 Days': { displayName: '1-30 Days Overdue', amount: 0 },
      '31-60 Days': { displayName: '31-60 Days Overdue', amount: 0 },
      '61-90 Days': { displayName: '61-90 Days Overdue', amount: 0 },
      '90+ Days': { displayName: '90+ Days Overdue', amount: 0 },
    };

    agingArray.forEach((row: any) => {
      if (bucketMap[row.age_bucket]) {
        bucketMap[row.age_bucket].amount = Number(row.total_amount || 0);
      }
    });

    const total = Object.values(bucketMap).reduce((sum, bucket) => sum + bucket.amount, 0);

    const bucketRows = [
      { key: 'Current', style: 'background-color: #f3f4f6;' },
      { key: '1-30 Days', style: '' },
      { key: '31-60 Days', style: 'background-color: #f3f4f6;' },
      { key: '61-90 Days', style: '' },
      { key: '90+ Days', style: 'background-color: #fee2e2;' },
    ];

    let tableRows = bucketRows.map(bucket => {
      const amount = bucketMap[bucket.key].amount;
      const percentage = total ? ((amount / total) * 100).toFixed(1) : '0.0';
      return `
        <tr style="${bucket.style}">
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${bucketMap[bucket.key].displayName}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(amount)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${percentage}%</td>
        </tr>
      `;
    }).join('');

    return `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="margin: 0; color: #1f2937; font-size: 24px;">${reportName}</h1>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">PT. UNAIS MULTIVERSE</p>
        <p style="margin: 5px 0; color: #666; font-size: 12px;">Per ${endDate}</p>
        <p style="margin: 5px 0; color: #999; font-size: 11px;">Generated: ${new Date().toLocaleString('id-ID')}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #7C2D12; color: white; font-weight: bold;">
          <td style="padding: 10px; border: 1px solid #333;">Age Category</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: right;">Amount (Rp)</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: right;">% Total</td>
        </tr>
        ${tableRows}
        <tr style="font-weight: bold; background-color: #c7d2e0;">
          <td style="padding: 10px; border: 1px solid #333;">Total Receivables</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: right;">${formatCurrency(total)}</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: right;">100%</td>
        </tr>
      </table>
    `;
  };

  const generatePayablesAgingHTML = (
    reportName: string,
    data: any,
    startDate: string,
    endDate: string
  ): string => {
    const payablesData = data.data?.data || data.data || [];
    let notDue = 0, days1_30 = 0, days31_60 = 0, days61_90 = 0, days90plus = 0;
    const now = new Date();

    (Array.isArray(payablesData) ? payablesData : []).forEach((p: any) => {
      const amount = p.remaining_amount || p.amount_due || 0;
      const dueDate = new Date(p.due_date);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 0) notDue += amount;
      else if (daysOverdue <= 30) days1_30 += amount;
      else if (daysOverdue <= 60) days31_60 += amount;
      else if (daysOverdue <= 90) days61_90 += amount;
      else days90plus += amount;
    });

    const total = notDue + days1_30 + days31_60 + days61_90 + days90plus;

    return `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="margin: 0; color: #1f2937; font-size: 24px;">${reportName}</h1>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">PT. UNAIS MULTIVERSE</p>
        <p style="margin: 5px 0; color: #666; font-size: 12px;">Per ${endDate}</p>
        <p style="margin: 5px 0; color: #999; font-size: 11px;">Generated: ${new Date().toLocaleString('id-ID')}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #7C2D12; color: white; font-weight: bold;">
          <td style="padding: 10px; border: 1px solid #333;">Age Category</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: right;">Amount (Rp)</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: right;">% Total</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="padding: 8px; border: 1px solid #e5e7eb;">Not Yet Due</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(notDue)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${total ? ((notDue / total) * 100).toFixed(1) : 0}%</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">1-30 Days Overdue</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(days1_30)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${total ? ((days1_30 / total) * 100).toFixed(1) : 0}%</td>
        </tr>
        <tr style="background-color: #f3f4f6;">
          <td style="padding: 8px; border: 1px solid #e5e7eb;">31-60 Days Overdue</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(days31_60)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${total ? ((days31_60 / total) * 100).toFixed(1) : 0}%</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">61-90 Days Overdue</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(days61_90)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${total ? ((days61_90 / total) * 100).toFixed(1) : 0}%</td>
        </tr>
        <tr style="background-color: #fee2e2;">
          <td style="padding: 8px; border: 1px solid #e5e7eb;">90+ Days Overdue</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(days90plus)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${total ? ((days90plus / total) * 100).toFixed(1) : 0}%</td>
        </tr>
        <tr style="font-weight: bold; background-color: #c7d2e0;">
          <td style="padding: 10px; border: 1px solid #333;">Total Payables</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: right;">${formatCurrency(total)}</td>
          <td style="padding: 10px; border: 1px solid #333; text-align: right;">100%</td>
        </tr>
      </table>
    `;
  };

  const generateProfitMarginHTML = (
    reportName: string,
    data: any,
    startDate: string,
    endDate: string
  ): string => {
    const reportData = data.data || data;
    const revenue = reportData.revenues?.total || 0;
    const grossProfit = reportData.gross_profit || 0;
    const netIncome = reportData.net_income || 0;
    const operatingExpenses = reportData.operating_expenses?.total || 0;

    const grossMargin = revenue ? ((grossProfit / revenue) * 100).toFixed(2) : '0.00';
    const operatingMargin = revenue ? (((grossProfit - operatingExpenses) / revenue) * 100).toFixed(2) : '0.00';
    const netMargin = revenue ? ((netIncome / revenue) * 100).toFixed(2) : '0.00';

    return `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="margin: 0; color: #1f2937; font-size: 24px;">${reportName}</h1>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">PT. UNAIS MULTIVERSE</p>
        <p style="margin: 5px 0; color: #666; font-size: 12px;">Periode: ${startDate} s/d ${endDate}</p>
        <p style="margin: 5px 0; color: #999; font-size: 11px;">Generated: ${new Date().toLocaleString('id-ID')}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; color: #1f2937; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Financial Metrics</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Total Revenue</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(revenue)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Gross Profit</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(grossProfit)}</td>
          </tr>
          <tr style="background-color: #f3f4f6;">
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Operating Expenses</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(operatingExpenses)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">Net Income</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${formatCurrency(netIncome)}</td>
          </tr>
        </table>
      </div>

      <div style="border-top: 2px solid #333; padding-top: 15px;">
        <h2 style="font-size: 16px; color: #1f2937; margin-bottom: 10px;">Profit Margin Analysis</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <td style="padding: 10px; border: 1px solid #e5e7eb;">Gross Profit Margin</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-size: 18px; color: #059669;">${grossMargin}%</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">Operating Profit Margin</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-size: 18px; color: #0891b2;">${operatingMargin}%</td>
          </tr>
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <td style="padding: 10px; border: 1px solid #333;">Net Profit Margin</td>
            <td style="padding: 10px; border: 1px solid #333; text-align: right; font-size: 18px; color: #6366f1;">${netMargin}%</td>
          </tr>
        </table>
      </div>
    `;
  };

  // ====================== Main Render ======================

  return (
    <div className="min-h-screen" style={{ backgroundColor: ceoTheme.light }}>
      {/* Header */}
      <div
        className="px-6 py-8 shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${ceoTheme.primary} 0%, ${ceoTheme.secondary} 100%)`,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="p-4 rounded-xl shadow-md"
            style={{ backgroundColor: ceoTheme.accent }}
          >
            <DocumentTextIcon className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">📊 Laporan Keuangan Eksekutif</h1>
            <p className="text-amber-100 mt-1">
              Ringkasan finansial perusahaan untuk pengambilan keputusan strategis
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mt-6 flex gap-3">
          {['thisMonth', 'thisQuarter', 'thisYear'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedPeriod === period
                  ? 'bg-white text-amber-900'
                  : 'bg-amber-900/30 text-white hover:bg-amber-900/50'
              }`}
            >
              {period === 'thisMonth' && 'Bulan Ini'}
              {period === 'thisQuarter' && 'Kuartal Ini'}
              {period === 'thisYear' && 'Tahun Ini'}
            </button>
          ))}
        </div>
      </div>

      {/* CEO Info Banner */}
      <div className="px-6 py-4">
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👁️</span>
            <div>
              <h3 className="font-semibold text-amber-900">Mode Executive Summary</h3>
              <p className="text-sm text-amber-700">
                Unduh laporan langsung dari halaman ini dalam format PDF. Setiap laporan dapat diunduh sesuai kebutuhan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Revenue Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              {executiveSummary.revenue.trend === 'up' ? (
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900 mb-1 break-words">
              {formatCurrency(executiveSummary.revenue.current)}
            </p>
            <p className="text-sm text-green-600 font-semibold">
              +{executiveSummary.revenue.change}% vs periode lalu
            </p>
          </div>

          {/* Profit Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              {executiveSummary.profit.trend === 'up' ? (
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Net Profit</h3>
            <p className="text-2xl font-bold text-gray-900 mb-1 break-words">
              {formatCurrency(executiveSummary.profit.current)}
            </p>
            <p className="text-sm text-green-600 font-semibold">
              +{executiveSummary.profit.change}% vs periode lalu
            </p>
          </div>

          {/* Expenses Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-orange-500 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <BanknotesIcon className="h-8 w-8 text-orange-600" />
              {executiveSummary.expenses.trend === 'down' ? (
                <ArrowTrendingDownIcon className="h-6 w-6 text-green-600" />
              ) : (
                <ArrowTrendingUpIcon className="h-6 w-6 text-red-600" />
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Operating Expenses</h3>
            <p className="text-2xl font-bold text-gray-900 mb-1 break-words">
              {formatCurrency(executiveSummary.expenses.current)}
            </p>
            <p className="text-sm text-green-600 font-semibold">
              {executiveSummary.expenses.change}% vs periode lalu
            </p>
          </div>

          {/* Cashflow Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <BanknotesIcon className="h-8 w-8 text-purple-600" />
              {executiveSummary.cashflow.trend === 'up' ? (
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Cash Flow</h3>
            <p className="text-2xl font-bold text-gray-900 mb-1 break-words">
              {formatCurrency(executiveSummary.cashflow.current)}
            </p>
            <p className="text-sm text-green-600 font-semibold">
              +{executiveSummary.cashflow.change}% vs periode lalu
            </p>
          </div>
        </div>
      </div>

      {/* Quick Reports Access */}
      <div className="px-6 py-4 pb-8">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-xl p-8 border-2 border-amber-200">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-amber-900 mb-2">📑 Laporan Tersedia - Download Langsung</h2>
            <p className="text-amber-700 text-sm">Unduh laporan keuangan dalam format PDF. Setiap laporan dapat disesuaikan sesuai periode yang dipilih.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Laba Rugi', icon: ChartBarIcon, status: 'Ready', desc: 'Laporan pendapatan & biaya' },
              { name: 'Neraca', icon: DocumentTextIcon, status: 'Ready', desc: 'Aset, liabilitas & ekuitas' },
              { name: 'Arus Kas', icon: BanknotesIcon, status: 'Ready', desc: 'Proyeksi cash flow operasional' },
              { name: 'Piutang Aging', icon: DocumentTextIcon, status: 'Ready', desc: 'Analisis keterlambatan piutang' },
              { name: 'Hutang Aging', icon: DocumentTextIcon, status: 'Ready', desc: 'Analisis keterlambatan hutang' },
              { name: 'Profit Margin', icon: ChartBarIcon, status: 'Ready', desc: 'Margin kotor & operasi' },
            ].map((report) => {
              const Icon = report.icon;
              const isExporting = exportingReport === report.name;
              return (
                <button
                  key={report.name}
                  onClick={() => handleExportReport(report.name)}
                  disabled={isExporting}
                  className="flex flex-col gap-2 p-5 bg-white border-2 border-amber-300 rounded-xl hover:border-amber-500 hover:shadow-lg hover:bg-amber-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-amber-100">
                      <Icon className="h-6 w-6 text-amber-700" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-bold text-amber-900">{report.name}</p>
                      <p className="text-xs text-amber-600 font-semibold">{report.status}</p>
                    </div>
                    {isExporting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-600"></div>
                    ) : (
                      <ArrowDownTrayIcon className="h-5 w-5 text-amber-600 group-hover:text-amber-700" />
                    )}
                  </div>
                  <p className="text-xs text-amber-700 text-left">{report.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CEOFinancialReports;
