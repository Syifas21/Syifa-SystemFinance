/**
 * PDF Generation Service for Invoices
 * Uses Puppeteer for generating invoice PDFs from HTML
 * 
 * NOTE: Puppeteer is currently disabled due to disk space constraints
 * To enable: npm install puppeteer --legacy-peer-deps
 */

// import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

interface InvoicePDFData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_name: string;
  customer_address: string;
  customer_npwp: string;
  customer_phone?: string;
  customer_email?: string;
  wo_po_number?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  tax_amount: number;
  tax_rate?: number;
  total_amount: number;
  notes?: string;
}

class PDFService {
  /**
   * Generate Invoice PDF as Buffer
   * Returns PDF buffer that can be sent as email attachment or saved to file
   */
  async generateInvoicePDF(data: InvoicePDFData): Promise<Buffer> {
    try {
      console.log(`📄 PDF Generation temporarily disabled - returning placeholder`);
      console.log(`   Invoice: ${data.invoice_number}`);
      console.warn('⚠️  To enable PDF generation, install puppeteer: npm install puppeteer --legacy-peer-deps');
      
      // Return a placeholder buffer with HTML content
      const htmlContent = this.generateInvoiceHTML(data);
      return Buffer.from(htmlContent, 'utf-8');
      
      /* DISABLED - Requires puppeteer installation
      const htmlContent = this.generateInvoiceHTML(data);
      
      // Launch Puppeteer to convert HTML to PDF
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF with proper formatting
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });
      
      await browser.close();
      
      console.log(`✅ PDF generated successfully for invoice ${data.invoice_number}`);
      return Buffer.from(pdfBuffer);
      */
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate invoice PDF');
    }
  }

  /**
   * Generate Invoice HTML Template
   */
  private generateInvoiceHTML(data: InvoicePDFData): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(date);
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoice_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; font-size: 12px; color: #333; padding: 40px; }
    .header { border-bottom: 4px solid #4E88BE; padding-bottom: 20px; margin-bottom: 30px; }
    .company-info { float: left; width: 60%; }
    .company-name { font-size: 28px; font-weight: bold; color: #06103A; margin-bottom: 5px; }
    .company-tagline { font-size: 14px; color: #666; margin-bottom: 15px; }
    .company-address { font-size: 11px; line-height: 1.6; color: #555; }
    .invoice-title { float: right; text-align: right; width: 40%; }
    .invoice-title h1 { font-size: 36px; color: #06103A; margin-bottom: 10px; }
    .invoice-number { background: linear-gradient(to right, #4E88BE, #C8A870); color: white; padding: 10px 20px; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block; }
    .clearfix::after { content: ""; display: table; clear: both; }
    .info-section { margin-top: 30px; margin-bottom: 30px; }
    .info-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
    .info-box h3 { background: #4E88BE; color: white; padding: 8px 12px; border-radius: 4px 4px 0 0; margin: -15px -15px 10px -15px; font-size: 12px; text-transform: uppercase; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .info-label { font-weight: 600; color: #666; }
    .info-value { font-weight: bold; color: #333; }
    .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    .items-table thead { background: linear-gradient(to right, #4E88BE, #06103A); color: white; }
    .items-table th { padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; }
    .items-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
    .items-table tbody tr:hover { background: #f8f9fa; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .summary-section { float: right; width: 350px; margin-top: 20px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
    .summary-row.total { border-top: 2px solid #333; margin-top: 10px; padding-top: 15px; font-size: 18px; font-weight: bold; color: #4E88BE; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid #e0e0e0; }
    .footer-section { display: inline-block; width: 48%; vertical-align: top; }
    .footer-title { background: #C8A870; color: white; padding: 6px 10px; border-radius: 4px 4px 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; }
    .footer-content { background: #f8f9fa; padding: 12px; border: 2px solid #e0e0e0; border-radius: 0 0 4px 4px; }
    .footer-note { text-align: center; margin-top: 30px; font-size: 10px; color: #999; }
  </style>
</head>
<body>
  <div class="header clearfix">
    <div class="company-info">
      <div class="company-name">Unais Multiverse</div>
      <div class="company-tagline">PT. Unais Creasindo Multiverse</div>
      <div class="company-address">
        Jl. P.H.H Mustofa No. 39 Surapati Core, Blok M-30,<br>
        RT. 004 RW. 010, Pasirlayung, Cibeunyng Kidul,<br>
        Kota Bandung, Jawa Barat<br>
        Tel: (022) 1234-5678 | Email: finance@unais.co.id<br>
        NPWP: 01.234.567.8-901.000
      </div>
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <div class="invoice-number">${data.invoice_number}</div>
    </div>
  </div>

  <div class="info-section clearfix">
    <div style="float: left; width: 48%;">
      <div class="info-box">
        <h3>Bill To</h3>
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${data.customer_name}</div>
        <div style="color: #666; margin-bottom: 5px;">${data.customer_address}</div>
        <div style="font-size: 11px; color: #999;">NPWP: ${data.customer_npwp}</div>
        ${data.customer_phone ? `<div style="font-size: 11px; color: #999;">Tel: ${data.customer_phone}</div>` : ''}
        ${data.customer_email ? `<div style="font-size: 11px; color: #999;">Email: ${data.customer_email}</div>` : ''}
      </div>
    </div>
    <div style="float: right; width: 48%;">
      <div class="info-box">
        <h3>Invoice Details</h3>
        <div class="info-row">
          <span class="info-label">Invoice Number:</span>
          <span class="info-value">${data.invoice_number}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Invoice Date:</span>
          <span class="info-value">${formatDate(data.invoice_date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Due Date:</span>
          <span class="info-value" style="color: #dc3545;">${formatDate(data.due_date)}</span>
        </div>
        ${data.wo_po_number ? `
        <div class="info-row">
          <span class="info-label">Reference:</span>
          <span class="info-value">${data.wo_po_number}</span>
        </div>
        ` : ''}
      </div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>No</th>
        <th>Description</th>
        <th class="text-center">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${data.items && data.items.length > 0 ? data.items.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${item.description}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">${formatCurrency(item.unit_price)}</td>
        <td class="text-right" style="font-weight: bold;">${formatCurrency(item.total)}</td>
      </tr>
      `).join('') : `
      <tr>
        <td colspan="5" class="text-center" style="color: #999;">No items</td>
      </tr>
      `}
    </tbody>
  </table>

  <div class="clearfix">
    <div class="summary-section">
      <div class="summary-row">
        <span>Subtotal (DPP):</span>
        <span style="font-weight: 600;">${formatCurrency(data.subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>PPN (${data.tax_rate || 11}%):</span>
        <span style="font-weight: 600; color: #28a745;">${formatCurrency(data.tax_amount)}</span>
      </div>
      <div class="summary-row total">
        <span>Grand Total:</span>
        <span>${formatCurrency(data.total_amount)}</span>
      </div>
    </div>
  </div>

  <div class="footer clearfix">
    <div class="footer-section">
      <div class="footer-title">Payment Terms</div>
      <div class="footer-content">
        • Payment due within 14 days from invoice date<br>
        • Late payment: 2% penalty per month<br>
        • All payments should be made to bank account below
      </div>
    </div>
    <div class="footer-section" style="margin-left: 4%;">
      <div class="footer-title">Bank Details</div>
      <div class="footer-content">
        <strong>Bank Mandiri</strong><br>
        Account Name: PT. Unais Creasindo Multiverse<br>
        Account No: 1234567890
      </div>
    </div>
  </div>

  ${data.notes ? `
  <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
    <strong>Notes:</strong> ${data.notes}
  </div>
  ` : ''}

  <div class="footer-note">
    This is a computer-generated invoice and does not require a signature.<br>
    For inquiries, contact finance@unais.co.id
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Save PDF to file system
   */
  async savePDFToFile(pdfBuffer: Buffer, filename: string): Promise<string> {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Create invoices directory if not exists
    const invoicesDir = path.join(process.cwd(), 'public', 'invoices');
    await fs.mkdir(invoicesDir, { recursive: true });
    
    const filePath = path.join(invoicesDir, filename);
    await fs.writeFile(filePath, pdfBuffer);
    
    console.log(`✅ PDF saved to: ${filePath}`);
    return filePath;
  }
}

export default new PDFService();
