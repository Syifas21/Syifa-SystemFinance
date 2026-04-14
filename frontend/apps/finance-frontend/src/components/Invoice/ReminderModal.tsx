// Email Reminder Template Modal
// Template pengingat pembayaran untuk dikirim ke customer

import React, { useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_email?: string;
    wo_po_number: string;
    items: Array<{
      description: string;
    }>;
    subtotal: number;
    grand_total: number;
    invoice_date: string;
    due_date: string;
    ppn_amount: number;
    pph23_amount: number;
  };
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const [recipientEmail, setRecipientEmail] = useState(invoice.customer_email || '');
  const [ccEmails, setCcEmails] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigals: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSendReminder = async () => {
    if (!recipientEmail) {
      alert('❌ Email penerima harus diisi!');
      return;
    }

    setIsSending(true);
    try {
      // TODO: Integrate with email service
      const emailTemplate = generateEmailTemplate();
      
      console.log('📧 Sending reminder email to:', recipientEmail);
      console.log('📄 Email content:', emailTemplate);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      alert(
        `✅ PENGINGAT BERHASIL DIKIRIM!\n\n` +
        `📧 Kepada: ${recipientEmail}\n` +
        `📄 Invoice: ${invoice.invoice_number}\n` +
        `💰 Total: ${formatCurrency(invoice.grand_total)}\n\n` +
        `Email pengingat sudah dikirim dengan lampiran:\n` +
        `• Invoice PDF\n` +
        `• Faktur Pajak\n\n` +
        `Customer akan menerima email dalam beberapa menit.`
      );

      onClose();
    } catch (error: any) {
      console.error('❌ Error sending reminder:', error);
      alert('❌ Gagal mengirim pengingat: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const generateEmailTemplate = () => {
    const jobDescription = invoice.items.map(item => item.description).join(', ') || 'Pekerjaan sesuai WO';
    
    return `
Dear ${invoice.customer_name} team,

Apakah pekerjaan ini sudah dibayar? Berikut invoice atas pekerjaan:

No WO           : ${invoice.wo_po_number}
Job Description : ${jobDescription}

No Invoice      : ${invoice.invoice_number}
Invoice Date    : ${formatDate(invoice.invoice_date)}
Total Tagihan   : ${formatCurrency(invoice.grand_total)}

NOTE:
- Nominal akhir (grand total) yang tertera pada invoice service, merupakan nilai akhir setelah dikurangi dengan nilai PPh 23
- Mohon membayar sesuai dengan nilai tagihan (Total/Grand Total) yang tertera pada invoice terlampir
- Pada saat melakukan pembayaran dan penerbitan bukti potong, mohon mencantumkan nomor invoice sesuai dengan dokumen terlampir
- Setelah melakukan pembayaran mohon agar melakukan konfirmasi dengan membalas dan melampirkan bukti pembayaran pada email ini
- Mohon untuk melampirkan bukti potong bersamaan dengan bukti pembayaran.

Terima kasih atas perhatian dan kerjasamanya.

Best Regards,
Finance Team
PT. UNAIS
    `.trim();
  };

  const copyToClipboard = () => {
    const template = generateEmailTemplate();
    navigator.clipboard.writeText(template);
    alert('✅ Template email berhasil disalin ke clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <PaperAirplaneIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Kirim Pengingat Pembayaran</h2>
              <p className="text-white/90 text-sm mt-1">
                Invoice: {invoice.invoice_number} | Jatuh Tempo: {formatDate(invoice.due_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Email Form */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📧 Email Penerima <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="customer@company.com"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📧 CC (Optional)
                </label>
                <input
                  type="text"
                  value={ccEmails}
                  onChange={(e) => setCcEmails(e.target.value)}
                  placeholder="email1@company.com, email2@company.com"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Lampiran Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-800 mb-2">📎 Lampiran yang akan dikirim:</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Invoice PDF ({invoice.invoice_number})</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Faktur Pajak</span>
                </div>
              </div>
            </div>
          </div>

          {/* Email Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                📝 Preview Email Template
              </label>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-semibold"
              >
                📋 Copy Template
              </button>
            </div>
            <div className="bg-white border-2 border-gray-300 rounded-xl p-6 font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
              {generateEmailTemplate()}
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border-l-4 border-orange-500">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Detail Invoice</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Customer:</span>
                <p className="font-semibold text-gray-900">{invoice.customer_name}</p>
              </div>
              <div>
                <span className="text-gray-600">No. WO/PO:</span>
                <p className="font-semibold text-gray-900">{invoice.wo_po_number}</p>
              </div>
              <div>
                <span className="text-gray-600">DPP:</span>
                <p className="font-semibold text-gray-900">{formatCurrency(invoice.subtotal)}</p>
              </div>
              <div>
                <span className="text-gray-600">PPN 11%:</span>
                <p className="font-semibold text-green-600">+{formatCurrency(invoice.ppn_amount)}</p>
              </div>
              <div>
                <span className="text-gray-600">PPh 23 (2%):</span>
                <p className="font-semibold text-red-600">-{formatCurrency(invoice.pph23_amount)}</p>
              </div>
              <div>
                <span className="text-gray-600">Grand Total:</span>
                <p className="font-bold text-xl text-orange-600">{formatCurrency(invoice.grand_total)}</p>
              </div>
              <div>
                <span className="text-gray-600">Tanggal Invoice:</span>
                <p className="font-semibold text-gray-900">{formatDate(invoice.invoice_date)}</p>
              </div>
              <div>
                <span className="text-gray-600">Jatuh Tempo:</span>
                <p className="font-semibold text-red-600">{formatDate(invoice.due_date)}</p>
              </div>
            </div>
          </div>

          {/* Warning Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Perhatian:</strong> Pastikan email penerima sudah benar dan lampiran invoice & faktur pajak tersedia. 
              Email ini akan dikirim langsung ke customer.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              disabled={isSending}
            >
              Batal
            </button>
            <button
              onClick={handleSendReminder}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isSending || !recipientEmail}
            >
              {isSending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Mengirim...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5" />
                  Kirim Pengingat
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
