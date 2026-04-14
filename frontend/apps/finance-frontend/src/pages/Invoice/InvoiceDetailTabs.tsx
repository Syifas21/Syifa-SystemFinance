import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';

/**
 * ====================================
 * INVOICE DETAIL WITH TABS
 * ====================================
 * 
 * 4 TABS:
 * 1. Invoice Detail - Detail invoice dengan line items
 * 2. Faktur Pajak - Format e-Faktur untuk CoreTax (export XLS)
 * 3. Invoice Monitoring - Rekap semua invoice
 * 4. Template Invoice - Struk invoice untuk print/PDF
 */

interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_name: string;
  customer_address: string;
  customer_npwp: string;
  customer_contact: string;
  wo_po_number: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  ppn_rate: number;
  ppn_amount: number;
  pph23_rate: number;
  pph23_amount: number;
  grand_total: number;
  notes: string;
}

type TabType = 'invoice' | 'faktur' | 'monitoring' | 'template';

const InvoiceDetailTabs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('invoice');
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Get data from quotation if passed via navigation state
    const state = location.state as any;
    if (state?.quotationData && state?.autoGenerate) {
      const quotation = state.quotationData;
      
      // Auto-generate invoice dari quotation
      const newInvoice: InvoiceData = {
        invoice_number: `INV-${Date.now()}`, // Generate invoice number
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customer_name: quotation.customer_name,
        customer_address: quotation.customer_address,
        customer_npwp: quotation.customer_npwp,
        customer_contact: quotation.customer_contact,
        wo_po_number: quotation.wo_po_number,
        items: quotation.items,
        subtotal: quotation.subtotal,
        ppn_rate: quotation.ppn_rate,
        ppn_amount: quotation.ppn_amount,
        pph23_rate: quotation.pph23_rate,
        pph23_amount: quotation.pph23_amount,
        grand_total: quotation.grand_total,
        notes: quotation.notes,
      };
      
      setInvoiceData(newInvoice);
    }
  }, [location]);

  const handleSaveInvoice = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSaving(false);
    alert('✅ Invoice berhasil disimpan!');
  };

  const exportFakturPajakToXLS = () => {
    if (!invoiceData) return;

    // Format data untuk e-Faktur (sesuai format CoreTax/DJP)
    const fakturData = [
      ['FK', 'KD_JENIS_TRANSAKSI', 'FG_PENGGANTI', 'NOMOR_FAKTUR', 'MASA_PAJAK', 'TAHUN_PAJAK', 'TANGGAL_FAKTUR', 'NPWP', 'NAMA', 'ALAMAT_LENGKAP', 'JUMLAH_DPP', 'JUMLAH_PPN', 'JUMLAH_PPNBM', 'ID_KETERANGAN_TAMBAHAN', 'FG_UANG_MUKA', 'UANG_MUKA_DPP', 'UANG_MUKA_PPN', 'UANG_MUKA_PPNBM', 'REFERENSI'],
      ['FK', '01', '0', invoiceData.invoice_number.replace(/[^0-9]/g, ''), new Date(invoiceData.invoice_date).getMonth() + 1, new Date(invoiceData.invoice_date).getFullYear(), invoiceData.invoice_date, invoiceData.customer_npwp, invoiceData.customer_name, invoiceData.customer_address, invoiceData.subtotal, invoiceData.ppn_amount, 0, '', '0', 0, 0, 0, invoiceData.wo_po_number],
      [],
      ['OF', 'KODE_OBJEK', 'NAMA', 'HARGA_SATUAN', 'JUMLAH_BARANG', 'HARGA_TOTAL', 'DISKON', 'DPP', 'PPN', 'TARIF_PPNBM', 'PPNBM'],
      ...invoiceData.items.map((item, idx) => [
        'OF',
        `OBJ-${String(idx + 1).padStart(3, '0')}`,
        item.description,
        item.unit_price,
        item.quantity,
        item.total,
        0,
        item.total,
        Math.round(item.total * invoiceData.ppn_rate / 100),
        0,
        0
      ]),
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(fakturData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Faktur Pajak');

    // Export file
    XLSX.writeFile(wb, `Faktur_Pajak_${invoiceData.invoice_number}.xlsx`);
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
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (!invoiceData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-light mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-dark to-primary-light rounded-3xl shadow-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/sales/quotation')}
              className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all"
            >
              <ArrowLeftIcon className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">{invoiceData.invoice_number}</h1>
              <p className="text-white/90 font-medium">{invoiceData.customer_name}</p>
            </div>
          </div>
          <button
            onClick={handleSaveInvoice}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-dark font-bold shadow-lg hover:shadow-xl hover:bg-accent-gold hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-dark"></div>
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                Simpan Invoice
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all ${
              activeTab === 'invoice'
                ? 'bg-gradient-to-r from-primary-dark to-primary-light text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📄 Invoice Detail
          </button>
          <button
            onClick={() => setActiveTab('faktur')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all ${
              activeTab === 'faktur'
                ? 'bg-gradient-to-r from-primary-dark to-primary-light text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🧾 Faktur Pajak
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all ${
              activeTab === 'monitoring'
                ? 'bg-gradient-to-r from-primary-dark to-primary-light text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📊 Invoice Monitoring
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all ${
              activeTab === 'template'
                ? 'bg-gradient-to-r from-primary-dark to-primary-light text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🖨️ Template Invoice
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'invoice' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-dark mb-4">Detail Invoice</h2>
              
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Customer</label>
                  <p className="text-lg font-bold text-gray-900">{invoiceData.customer_name}</p>
                  <p className="text-sm text-gray-600 mt-1">{invoiceData.customer_address}</p>
                  <p className="text-sm text-gray-600">NPWP: {invoiceData.customer_npwp}</p>
                  <p className="text-sm text-gray-600">{invoiceData.customer_contact}</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Invoice Date</label>
                    <p className="text-lg font-bold text-gray-900">{formatDate(invoiceData.invoice_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Due Date</label>
                    <p className="text-lg font-bold text-red-600">{formatDate(invoiceData.due_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">WO/PO Number</label>
                    <p className="text-lg font-bold text-gray-900">{invoiceData.wo_po_number}</p>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Line Items</h3>
                <table className="w-full border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gradient-to-r from-primary-dark to-primary-light text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold">Description</th>
                      <th className="px-4 py-3 text-center text-sm font-bold w-24">QTY</th>
                      <th className="px-4 py-3 text-right text-sm font-bold w-32">Unit Price</th>
                      <th className="px-4 py-3 text-right text-sm font-bold w-40">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {invoiceData.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-96 space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-semibold text-gray-700">Subtotal:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(invoiceData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-semibold text-gray-700">PPN ({invoiceData.ppn_rate}%):</span>
                    <span className="font-bold text-gray-900">{formatCurrency(invoiceData.ppn_amount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-semibold text-gray-700">PPh 23 ({invoiceData.pph23_rate}%):</span>
                    <span className="font-bold text-red-600">- {formatCurrency(invoiceData.pph23_amount)}</span>
                  </div>
                  <div className="flex justify-between py-3 bg-gradient-to-r from-primary-dark to-primary-light text-white px-4 rounded-lg mt-2">
                    <span className="font-bold text-lg">GRAND TOTAL:</span>
                    <span className="font-bold text-2xl">{formatCurrency(invoiceData.grand_total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Notes:</label>
                <p className="text-sm text-gray-600">{invoiceData.notes}</p>
              </div>
            </div>
          )}

          {activeTab === 'faktur' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-primary-dark">Faktur Pajak (e-Faktur)</h2>
                <button
                  onClick={exportFakturPajakToXLS}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-gold to-primary-light text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Export to XLS (CoreTax)
                </button>
              </div>

              <div className="bg-gradient-to-br from-primary-light/10 to-accent-gold/10 border-2 border-primary-light/30 rounded-xl p-6">
                <p className="text-sm text-gray-700 mb-4">
                  ⚠️ <strong>Format e-Faktur untuk CoreTax</strong> - File XLS yang diexport sesuai dengan format DJP Online
                </p>
              </div>

              {/* Faktur Pajak Preview */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">FAKTUR PAJAK</h3>
                  <p className="text-sm text-gray-600">Sesuai Format Peraturan Direktur Jenderal Pajak</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">Kode dan Nomor Seri Faktur Pajak</label>
                      <p className="text-lg font-bold text-gray-900">{invoiceData.invoice_number}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">Tanggal Pembuatan</label>
                      <p className="font-semibold text-gray-900">{formatDate(invoiceData.invoice_date)}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">Jenis Transaksi</label>
                      <p className="font-semibold text-gray-900">01 - Kepada Pihak yang Bukan Pemungut PPN</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase">Masa Pajak</label>
                      <p className="font-semibold text-gray-900">
                        {new Date(invoiceData.invoice_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-gray-300 pt-6 mb-6">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase">Pengusaha Kena Pajak yang Menyerahkan BKP/JKP</h4>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>NPWP:</strong> 01.234.567.8-901.000</p>
                    <p className="text-sm"><strong>Nama:</strong> PT. MiniLink Indonesia</p>
                    <p className="text-sm"><strong>Alamat:</strong> Jl. Industri Raya No. 123, Jakarta Selatan 12345</p>
                  </div>
                </div>

                <div className="border-t-2 border-gray-300 pt-6 mb-6">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase">Pembeli BKP/Penerima JKP</h4>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>NPWP:</strong> {invoiceData.customer_npwp}</p>
                    <p className="text-sm"><strong>Nama:</strong> {invoiceData.customer_name}</p>
                    <p className="text-sm"><strong>Alamat:</strong> {invoiceData.customer_address}</p>
                  </div>
                </div>

                <div className="border-t-2 border-gray-300 pt-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-2 px-2 font-bold">No</th>
                        <th className="text-left py-2 px-2 font-bold">Nama Barang/Jasa</th>
                        <th className="text-right py-2 px-2 font-bold">Harga Jual/Penggantian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="py-2 px-2">{idx + 1}</td>
                          <td className="py-2 px-2">{item.description}</td>
                          <td className="py-2 px-2 text-right">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                      <tr className="font-bold border-t-2 border-gray-300">
                        <td colSpan={2} className="py-3 px-2 text-right">Dasar Pengenaan Pajak (DPP):</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(invoiceData.subtotal)}</td>
                      </tr>
                      <tr className="font-bold">
                        <td colSpan={2} className="py-2 px-2 text-right">PPN ({invoiceData.ppn_rate}%):</td>
                        <td className="py-2 px-2 text-right">{formatCurrency(invoiceData.ppn_amount)}</td>
                      </tr>
                      <tr className="font-bold bg-gray-100">
                        <td colSpan={2} className="py-3 px-2 text-right">Total PPN yang dipungut:</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(invoiceData.ppn_amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 text-xs text-gray-500 text-center">
                  <p>* Faktur Pajak ini telah dibuat sesuai dengan ketentuan peraturan perundang-undangan perpajakan</p>
                  <p>* File XLS dapat diexport untuk upload ke aplikasi e-Faktur/CoreTax DJP</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-dark mb-4">Invoice Monitoring & Rekap</h2>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-primary-light/10 to-primary-light/20 border-2 border-primary-light rounded-xl p-4">
                  <p className="text-sm font-semibold text-primary-dark mb-1">Total Invoice</p>
                  <p className="text-3xl font-bold text-primary-dark">1</p>
                  <p className="text-xs text-gray-600 mt-1">Invoice aktif</p>
                </div>
                <div className="bg-gradient-to-br from-accent-gold/10 to-accent-gold/20 border-2 border-accent-gold rounded-xl p-4">
                  <p className="text-sm font-semibold text-primary-dark mb-1">Total Nilai</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(invoiceData.grand_total)}</p>
                  <p className="text-xs text-gray-600 mt-1">Grand total</p>
                </div>
                <div className="bg-gradient-to-br from-primary-dark/10 to-primary-dark/20 border-2 border-primary-dark rounded-xl p-4">
                  <p className="text-sm font-semibold text-primary-dark mb-1">PPN</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(invoiceData.ppn_amount)}</p>
                  <p className="text-xs text-gray-600 mt-1">{invoiceData.ppn_rate}% dari DPP</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-800 mb-1">PPh 23</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(invoiceData.pph23_amount)}</p>
                  <p className="text-xs text-red-700 mt-1">{invoiceData.pph23_rate}% dari DPP</p>
                </div>
              </div>

              {/* Invoice Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-primary-dark to-primary-light text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold">Invoice Number</th>
                      <th className="px-4 py-3 text-left text-xs font-bold">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-bold">Invoice Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold">Due Date</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">Subtotal</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">PPN</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">PPh 23</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">Grand Total</th>
                      <th className="px-4 py-3 text-center text-xs font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-primary-dark">{invoiceData.invoice_number}</td>
                      <td className="px-4 py-3 text-sm">{invoiceData.customer_name}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(invoiceData.invoice_date)}</td>
                      <td className="px-4 py-3 text-sm text-red-600 font-semibold">{formatDate(invoiceData.due_date)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">{formatCurrency(invoiceData.subtotal)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">{formatCurrency(invoiceData.ppn_amount)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">-{formatCurrency(invoiceData.pph23_amount)}</td>
                      <td className="px-4 py-3 text-right text-lg font-bold text-gray-900">{formatCurrency(invoiceData.grand_total)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent-gold/20 text-accent-gold border border-accent-gold">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          Draft
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Breakdown by Tax</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Dasar Pengenaan Pajak (DPP):</span>
                      <span className="font-bold text-gray-900">{formatCurrency(invoiceData.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">PPN {invoiceData.ppn_rate}%:</span>
                      <span className="font-bold text-gray-900">{formatCurrency(invoiceData.ppn_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">PPh 23 {invoiceData.pph23_rate}%:</span>
                      <span className="font-bold text-red-600">-{formatCurrency(invoiceData.pph23_amount)}</span>
                    </div>
                    <div className="border-t-2 border-gray-300 pt-2 flex justify-between items-center">
                      <span className="font-bold text-gray-900">Grand Total:</span>
                      <span className="text-xl font-bold text-primary-dark">{formatCurrency(invoiceData.grand_total)}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">💼 Customer Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {invoiceData.customer_name}</p>
                    <p><strong>NPWP:</strong> {invoiceData.customer_npwp}</p>
                    <p><strong>Address:</strong> {invoiceData.customer_address}</p>
                    <p><strong>Contact:</strong> {invoiceData.customer_contact}</p>
                    <p><strong>WO/PO:</strong> {invoiceData.wo_po_number}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'template' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-primary-dark">Template Invoice (Struk)</h2>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-light to-accent-gold text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Print / Save PDF
                </button>
              </div>

              {/* Invoice Template Preview */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-12" id="invoice-template">
                {/* Header */}
                <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-primary-dark">
                  <div>
                    <h1 className="text-4xl font-bold text-primary-dark mb-2">MINILINK ERP</h1>
                    <p className="text-sm text-gray-600">
                      Jl. Industri Raya No. 123<br />
                      Jakarta Selatan 12345<br />
                      Tel: (021) 1234-5678 | Email: finance@minilink.co.id<br />
                      NPWP: 01.234.567.8-901.000
                    </p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-bold text-primary-dark mb-2">INVOICE</h2>
                    <div className="bg-gradient-to-r from-primary-light to-accent-gold text-white px-4 py-2 rounded-lg font-bold">
                      {invoiceData.invoice_number}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-sm font-bold text-gray-600 uppercase mb-3 border-b border-gray-300 pb-1">Bill To</h3>
                    <p className="font-bold text-lg text-gray-900">{invoiceData.customer_name}</p>
                    <p className="text-sm text-gray-700">{invoiceData.customer_address}</p>
                    <p className="text-sm text-gray-600">NPWP: {invoiceData.customer_npwp}</p>
                    <p className="text-sm text-gray-600">{invoiceData.customer_contact}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex justify-end gap-3">
                      <span className="text-sm font-semibold text-gray-600">Invoice Date:</span>
                      <span className="text-sm font-bold text-gray-900">{formatDate(invoiceData.invoice_date)}</span>
                    </div>
                    <div className="flex justify-end gap-3">
                      <span className="text-sm font-semibold text-gray-600">Due Date:</span>
                      <span className="text-sm font-bold text-red-600">{formatDate(invoiceData.due_date)}</span>
                    </div>
                    <div className="flex justify-end gap-3">
                      <span className="text-sm font-semibold text-gray-600">Reference:</span>
                      <span className="text-sm font-bold text-gray-900">{invoiceData.wo_po_number}</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <table className="w-full mb-8">
                  <thead>
                    <tr className="bg-gradient-to-r from-primary-dark to-primary-light text-white">
                      <th className="px-4 py-3 text-left text-sm font-bold uppercase">Description</th>
                      <th className="px-4 py-3 text-center text-sm font-bold uppercase w-24">QTY</th>
                      <th className="px-4 py-3 text-right text-sm font-bold uppercase w-32">Unit Price</th>
                      <th className="px-4 py-3 text-right text-sm font-bold uppercase w-40">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-96 space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-semibold text-gray-700">Subtotal:</span>
                      <span className="font-bold text-gray-900">{formatCurrency(invoiceData.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-semibold text-gray-700">PPN ({invoiceData.ppn_rate}%):</span>
                      <span className="font-bold text-gray-900">{formatCurrency(invoiceData.ppn_amount)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-semibold text-gray-700">PPh 23 ({invoiceData.pph23_rate}%):</span>
                      <span className="font-bold text-red-600">- {formatCurrency(invoiceData.pph23_amount)}</span>
                    </div>
                    <div className="bg-gradient-to-r from-primary-dark to-primary-light text-white px-4 py-3 rounded-lg mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold uppercase">Grand Total:</span>
                        <span className="text-2xl font-bold">{formatCurrency(invoiceData.grand_total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="border-t-2 border-gray-300 pt-6 text-sm">
                  <p className="font-semibold text-gray-800 mb-2">Payment Terms & Bank Details:</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-700">Payment Terms: Net 14 days from invoice date</p>
                      <p className="text-gray-700 mt-1">Late Payment: 2% penalty per month</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-semibold text-gray-800">Bank Mandiri</p>
                      <p className="text-gray-700">Acc: PT. MiniLink Indonesia</p>
                      <p className="text-gray-700">No: 1234567890</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t text-xs text-gray-500 text-center">
                  <p>This is a computer-generated invoice and does not require a signature.</p>
                  <p>For inquiries, contact finance@minilink.co.id</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailTabs;
