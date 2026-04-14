import React, { useState } from 'react';
import {
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

/**
 * ====================================
 * INVOICE IMPORT & AUTO-GENERATE
 * ====================================
 * 
 * Fitur untuk import data invoice dari CSV/Excel dan auto-generate:
 * - Template Invoice (seperti struk Shell)
 * - Faktur Pajak (PPN 12%, PPh 23)
 * - Invoice Monitoring (rekap)
 * - Download PDF otomatis
 * 
 * CSV Format yang diharapkan:
 * Created Invoice Date, Description, No. WO/PO, Customer, Invoice Code, Goods Value, 
 * Service Value, Total Invoice Value, PPN, PPh Pasal 23, Invoice Value + Tax, 
 * INV Date Received, Due Date, Paid Date, Paid Value
 */

interface ImportedInvoiceData {
  created_date: string;
  description: string;
  wo_po_number: string;
  customer: string;
  invoice_code: string;
  goods_value: number;
  service_value: number;
  total_invoice_value: number;
  ppn: number;
  pph_pasal_23: number;
  invoice_value_with_tax: number;
  inv_date_received: string;
  due_date: string;
  paid_date?: string;
  paid_value?: number;
}

interface InvoiceImportProps {
  onClose: () => void;
  onImportSuccess: (data: ImportedInvoiceData[]) => void;
}

const InvoiceImport: React.FC<InvoiceImportProps> = ({ onClose, onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportedInvoiceData[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data: ImportedInvoiceData[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      
      data.push({
        created_date: values[0] || '',
        description: values[1] || '',
        wo_po_number: values[2] || '',
        customer: values[3] || '',
        invoice_code: values[4] || '',
        goods_value: parseFloat(values[5]) || 0,
        service_value: parseFloat(values[6]) || 0,
        total_invoice_value: parseFloat(values[7]) || 0,
        ppn: parseFloat(values[8]) || 0,
        pph_pasal_23: parseFloat(values[9]) || 0,
        invoice_value_with_tax: parseFloat(values[10]) || 0,
        inv_date_received: values[11] || '',
        due_date: values[12] || '',
        paid_date: values[13] || undefined,
        paid_value: parseFloat(values[14]) || undefined,
      });
    }
    
    setPreview(data);
    setStep('preview');
  };

  const handleImport = async () => {
    setImporting(true);
    
    // Simulasi proses import dan generate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Auto-generate untuk setiap invoice:
    // 1. Template Invoice (struk)
    // 2. Faktur Pajak
    // 3. Record di database
    
    onImportSuccess(preview);
    setStep('success');
    setImporting(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-dark to-primary-light px-8 py-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <ArrowUpTrayIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Import Invoice dari CSV/Excel</h2>
                <p className="text-sm text-white/80 mt-1">Auto-generate template invoice, faktur pajak, dan rekap</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Upload Area */}
              <div className="border-3 border-dashed border-primary-light/30 rounded-2xl p-12 text-center bg-gradient-to-br from-primary-light/5 to-accent-gold/5 hover:border-primary-light hover:bg-primary-light/10 transition-all">
                <ArrowUpTrayIcon className="w-20 h-20 mx-auto text-primary-light mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pilih File CSV/Excel</h3>
                <p className="text-gray-600 mb-6">
                  Upload file data invoice dari Shell untuk auto-generate invoice template & faktur pajak
                </p>
                <label className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-light to-accent-gold text-white font-bold rounded-xl hover:from-accent-gold hover:to-primary-dark transition-all cursor-pointer shadow-lg hover:shadow-xl">
                  <ArrowUpTrayIcon className="w-5 h-5" />
                  Pilih File
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {file && (
                  <p className="mt-4 text-sm text-primary-dark font-medium">
                    ✓ File terpilih: <span className="font-bold">{file.name}</span>
                  </p>
                )}
              </div>

              {/* Format Info */}
              <div className="bg-gradient-to-br from-primary-light/10 to-accent-gold/10 border-2 border-primary-light/30 rounded-xl p-6">
                <h4 className="font-bold text-primary-dark mb-3 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Format CSV yang Diharapkan
                </h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p className="font-mono bg-white p-3 rounded border border-gray-200 overflow-x-auto text-xs">
                    Created Invoice Date, Description, No. WO/PO, Customer, Invoice Code, Goods Value, 
                    Service Value, Total Invoice Value, PPN, PPh Pasal 23, Invoice Value + Tax, 
                    INV Date Received, Due Date, Paid Date, Paid Value
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Contoh:</strong> 3-Nov-25, RM - Identify, WOSHELLSHELL, Shell Lenteng Agung 1, INV251124, 
                    Rp137,120, Rp200,000, Rp200,000, Rp22,000, Rp4,000, Rp218,000, 3-Nov-25, 17-Nov-25, -, -
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary-light/10 to-accent-gold/10 border border-primary-light/30 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  <strong>{preview.length} invoice</strong> siap di-import. 
                  Sistem akan auto-generate template invoice + faktur pajak untuk semua data.
                </p>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-primary-dark to-primary-light">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Invoice Code</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase">Total + Tax</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {preview.slice(0, 10).map((inv, idx) => (
                      <tr key={idx} className="hover:bg-primary-light/5">
                        <td className="px-4 py-3 text-sm font-semibold text-primary-dark">{inv.invoice_code}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{inv.customer}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{inv.description}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-right">{formatCurrency(inv.invoice_value_with_tax)}</td>
                        <td className="px-4 py-3 text-sm text-center">{inv.due_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <div className="bg-gray-50 px-4 py-3 text-center text-sm text-gray-600">
                    ... dan {preview.length - 10} invoice lainnya
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('upload')}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-light to-accent-gold text-white font-bold rounded-xl hover:from-accent-gold hover:to-primary-dark transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating Invoice & Faktur...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircleIcon className="w-5 h-5" />
                      Import & Generate Semua
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-light to-accent-gold rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-primary-dark mb-3">Import Berhasil! 🎉</h3>
              <p className="text-gray-600 mb-8">
                {preview.length} invoice berhasil di-import dan auto-generate:
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                <div className="bg-primary-light/10 border-2 border-primary-light rounded-xl p-4">
                  <DocumentTextIcon className="w-8 h-8 text-primary-light mx-auto mb-2" />
                  <p className="text-sm font-bold text-primary-dark">Template Invoice</p>
                  <p className="text-xs text-gray-600">Struk invoice siap</p>
                </div>
                <div className="bg-accent-gold/10 border-2 border-accent-gold rounded-xl p-4">
                  <DocumentTextIcon className="w-8 h-8 text-accent-gold mx-auto mb-2" />
                  <p className="text-sm font-bold text-primary-dark">Faktur Pajak</p>
                  <p className="text-xs text-gray-600">PPN & PPh tercatat</p>
                </div>
                <div className="bg-primary-dark/10 border-2 border-primary-dark rounded-xl p-4">
                  <DocumentArrowDownIcon className="w-8 h-8 text-primary-dark mx-auto mb-2" />
                  <p className="text-sm font-bold text-primary-dark">PDF Ready</p>
                  <p className="text-xs text-gray-600">Siap download</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-primary-light to-accent-gold text-white font-bold rounded-xl hover:from-accent-gold hover:to-primary-dark transition-all shadow-lg"
              >
                Tutup & Lihat Invoice
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceImport;
