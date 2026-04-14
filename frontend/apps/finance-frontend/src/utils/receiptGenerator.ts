import { jsPDF } from 'jspdf';

interface ReceiptData {
  transactionId: string;
  date: string;
  time: string;
  fromAccount: string;
  fromName: string;
  toAccount: string;
  toName: string;
  amount: number;
  bank: string;
  reference: string;
}

export const generateTransferReceipt = (data: ReceiptData): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // Thermal printer size
      });

    // Background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 80, 200, 'F');

    // Header - Bank Logo Area
    doc.setFillColor(0, 51, 160); // BCA Blue
    doc.rect(0, 0, 80, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(data.bank, 40, 10, { align: 'center' });
    doc.setFontSize(10);
    doc.text('STRUK TRANSFER', 40, 16, { align: 'center' });
    doc.text('BERHASIL', 40, 21, { align: 'center' });

    // Reset color for body
    doc.setTextColor(0, 0, 0);
    let y = 32;

    // Transaction ID
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('ID Transaksi:', 5, y);
    doc.setFont('helvetica', 'bold');
    doc.text(data.transactionId, 5, y + 4);
    y += 10;

    // Date & Time
    doc.setFont('helvetica', 'normal');
    doc.text('Tanggal:', 5, y);
    doc.text(data.date, 45, y);
    y += 5;
    doc.text('Waktu:', 5, y);
    doc.text(data.time, 45, y);
    y += 8;

    // Separator
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(5, y, 75, y);
    y += 6;

    // From Account
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DARI REKENING', 5, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('No. Rekening:', 5, y);
    doc.text(data.fromAccount, 45, y);
    y += 5;
    doc.text('Nama:', 5, y);
    doc.text(data.fromName.substring(0, 25), 45, y);
    y += 8;

    // To Account
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('KE REKENING', 5, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('No. Rekening:', 5, y);
    doc.text(data.toAccount, 45, y);
    y += 5;
    doc.text('Nama:', 5, y);
    const toNameLines = doc.splitTextToSize(data.toName, 30);
    doc.text(toNameLines, 45, y);
    y += 5 * toNameLines.length + 3;

    // Separator
    doc.line(5, y, 75, y);
    y += 6;

    // Amount
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('JUMLAH TRANSFER', 5, y);
    y += 6;
    doc.setFontSize(14);
    doc.setTextColor(0, 128, 0);
    const formattedAmount = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(data.amount);
    doc.text(formattedAmount, 40, y, { align: 'center' });
    y += 8;

    // Separator
    doc.setTextColor(0, 0, 0);
    doc.line(5, y, 75, y);
    y += 6;

    // Reference
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Referensi:', 5, y);
    doc.text(data.reference, 5, y + 4);
    y += 12;

    // Success stamp
    doc.setFillColor(0, 200, 0);
    doc.roundedRect(15, y, 50, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('✓ TRANSAKSI BERHASIL', 40, y + 8, { align: 'center' });
    y += 18;

    // Footer
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Struk ini adalah bukti sah transaksi', 40, y, { align: 'center' });
    doc.text('Harap disimpan dengan baik', 40, y + 4, { align: 'center' });
    y += 10;
    doc.text('Terima kasih telah menggunakan', 40, y, { align: 'center' });
    doc.text(data.bank, 40, y + 4, { align: 'center' });

      // Convert to blob
      const pdfBlob = doc.output('blob');
      resolve(pdfBlob);
    } catch (error) {
      console.error('Error generating receipt:', error);
      reject(error);
    }
  });
};

export const downloadReceipt = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
