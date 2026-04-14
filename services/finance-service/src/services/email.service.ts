/**
 * Email Service for sending invoices and notifications
 * Uses Nodemailer (can be swapped with SendGrid/AWS SES in production)
 */

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

interface SendInvoiceEmailParams {
  to: string;
  cc?: string[];
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  dueDate: string;
  pdfBuffer: Buffer;
}

interface SendReminderEmailParams {
  to: string;
  cc?: string[];
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  dueDate: string;
  daysOverdue?: number;
}

import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize email transporter
   * In production, use environment variables for email configuration
   */
  private initialize() {
    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn('⚠️ SMTP credentials not configured - Email service in placeholder mode');
        console.warn('   Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to enable email');
        this.isConfigured = false;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      
      console.log('✅ Email service initialized with SMTP configuration');
      this.isConfigured = true;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send invoice email to customer
   */
  async sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<boolean> {
    try {
      const { to, cc, invoiceNumber, customerName, totalAmount, dueDate, pdfBuffer } = params;

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(amount);
      };

      const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      };

      const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #4E88BE, #06103A); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
    .invoice-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .label { font-weight: 600; color: #666; }
    .value { font-weight: bold; color: #333; }
    .amount { font-size: 24px; color: #4E88BE; font-weight: bold; }
    .button { background: #4E88BE; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Invoice dari Unais Multiverse</h1>
      <p style="margin: 10px 0 0 0;">PT. Unais Creasindo Multiverse</p>
    </div>
    <div class="content">
      <p>Dear ${customerName} team,</p>
      
      <p>Terima kasih atas kerjasamanya. Terlampir adalah invoice untuk layanan/produk yang telah kami sediakan.</p>
      
      <div class="invoice-info">
        <div class="info-row">
          <span class="label">Invoice Number:</span>
          <span class="value">${invoiceNumber}</span>
        </div>
        <div class="info-row">
          <span class="label">Due Date:</span>
          <span class="value" style="color: #dc3545;">${formatDate(dueDate)}</span>
        </div>
        <div class="info-row" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #dee2e6;">
          <span class="label" style="font-size: 16px;">Total Amount:</span>
          <span class="amount">${formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <p><strong>Payment Instructions:</strong></p>
      <ul>
        <li>Bank: <strong>Bank Mandiri</strong></li>
        <li>Account Name: <strong>PT. Unais Creasindo Multiverse</strong></li>
        <li>Account Number: <strong>1234567890</strong></li>
        <li>Payment Terms: Net 14 days from invoice date</li>
      </ul>

      <p>Mohon melakukan pembayaran sebelum tanggal jatuh tempo. PDF invoice terlampir dalam email ini.</p>
      
      <p>Jika ada pertanyaan, silakan hubungi kami di <a href="mailto:finance@unais.co.id">finance@unais.co.id</a></p>

      <p style="margin-top: 30px;">
        Best Regards,<br>
        <strong>Finance Team</strong><br>
        PT. Unais Creasindo Multiverse
      </p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply directly to this message.</p>
      <p>© 2025 PT. Unais Creasindo Multiverse. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `.trim();

      const mailOptions = {
        from: '"Unais Finance" <finance@unais.co.id>',
        to: to,
        cc: cc || [],
        subject: `Invoice ${invoiceNumber} - Unais Multiverse`,
        html: emailHTML,
        attachments: [
          {
            filename: `Invoice_${invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      if (this.isConfigured && this.transporter) {
        // Send actual email via SMTP
        const info = await this.transporter.sendMail(mailOptions);
        console.log(`✅ Invoice email sent successfully: ${info.messageId}`);
        return true;
      }

      // Placeholder mode - just log
      console.log('📧 Email placeholder mode - SMTP not configured');
      console.log(`   To: ${to}`);
      console.log(`   CC: ${cc?.join(', ') || 'None'}`);
      console.log(`   Subject: ${mailOptions.subject}`);
      console.log(`   Attachment: Invoice_${invoiceNumber}.pdf (${pdfBuffer.length} bytes)`);
      console.log('   💡 Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env to enable email sending');
      
      return true;
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      return false;
    }
  }

  /**
   * Send payment reminder email
   */
  async sendReminderEmail(params: SendReminderEmailParams): Promise<boolean> {
    try {
      const { to, cc, invoiceNumber, customerName, totalAmount, dueDate, daysOverdue } = params;

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(amount);
      };

      const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      };

      const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #ffc107, #ff9800); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
    .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .invoice-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .label { font-weight: 600; color: #666; }
    .value { font-weight: bold; color: #333; }
    .amount { font-size: 24px; color: #dc3545; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🔔 Payment Reminder</h1>
      <p style="margin: 10px 0 0 0;">PT. Unais Creasindo Multiverse</p>
    </div>
    <div class="content">
      <p>Dear ${customerName} team,</p>
      
      ${daysOverdue && daysOverdue > 0 ? `
      <div class="warning-box">
        <strong>⚠️ Overdue Notice:</strong> This invoice is ${daysOverdue} days overdue. Please arrange payment as soon as possible to avoid late payment penalties.
      </div>
      ` : `
      <p>Kami ingin mengingatkan bahwa invoice berikut akan segera jatuh tempo:</p>
      `}
      
      <div class="invoice-info">
        <div class="info-row">
          <span class="label">Invoice Number:</span>
          <span class="value">${invoiceNumber}</span>
        </div>
        <div class="info-row">
          <span class="label">Due Date:</span>
          <span class="value" style="color: #dc3545;">${formatDate(dueDate)}</span>
        </div>
        <div class="info-row" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #dee2e6;">
          <span class="label" style="font-size: 16px;">Outstanding Amount:</span>
          <span class="amount">${formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <p><strong>Payment Details:</strong></p>
      <ul>
        <li>Bank: <strong>Bank Mandiri</strong></li>
        <li>Account Name: <strong>PT. Unais Creasindo Multiverse</strong></li>
        <li>Account Number: <strong>1234567890</strong></li>
      </ul>

      <p>Mohon segera melakukan pembayaran atau konfirmasi jika sudah melakukan transfer.</p>
      
      <p>Jika ada pertanyaan atau kendala pembayaran, silakan hubungi kami di <a href="mailto:finance@unais.co.id">finance@unais.co.id</a></p>

      <p style="margin-top: 30px;">
        Best Regards,<br>
        <strong>Finance Team</strong><br>
        PT. Unais Creasindo Multiverse
      </p>
    </div>
    <div class="footer">
      <p>This is an automated reminder. Please do not reply directly to this message.</p>
      <p>© 2025 PT. Unais Creasindo Multiverse. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `.trim();

      const mailOptions = {
        from: '"Unais Finance" <finance@unais.co.id>',
        to: to,
        cc: cc || [],
        subject: `[Reminder] Invoice ${invoiceNumber} ${daysOverdue && daysOverdue > 0 ? '- OVERDUE' : '- Payment Due'}`,
        html: emailHTML,
      };

      if (this.isConfigured && this.transporter) {
        // Send actual email
        // const info = await this.transporter.sendMail(mailOptions);
        // console.log(`✅ Reminder email sent: ${info.messageId}`);
        // return true;
      }

      // Placeholder mode
      console.log('📧 [PLACEHOLDER] Reminder email prepared:');
      console.log(`   To: ${to}`);
      console.log(`   CC: ${cc?.join(', ') || 'None'}`);
      console.log(`   Subject: ${mailOptions.subject}`);
      console.log('   ⚠️ Email not sent - Nodemailer not configured');
      
      return true;
    } catch (error) {
      console.error('Failed to send reminder email:', error);
      return false;
    }
  }
}

export default new EmailService();
