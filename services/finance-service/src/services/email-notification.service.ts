// ============================================
// PROJECT FINANCE - Email Service
// Real Email Integration with Nodemailer
// ============================================

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
    encoding?: string;
    contentType?: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      EMAIL_FROM,
      NODE_ENV
    } = process.env;

    // Check if email is configured
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn('⚠️  Email not configured. Email features will be simulated.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587'),
        secure: SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure email service:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; message: string; messageId?: string }> {
    try {
      // If not configured, simulate
      if (!this.isConfigured || !this.transporter) {
        console.log('📧 [SIMULATED] Email would be sent:', {
          to: options.to,
          subject: options.subject,
        });
        return {
          success: true,
          message: 'Email simulated (no SMTP configured)',
          messageId: `simulated-${Date.now()}`,
        };
      }

      // Send real email
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments?.map(att => {
          // Jika content adalah base64 string, convert ke Buffer
          const content = typeof att.content === 'string' && att.encoding === 'base64'
            ? Buffer.from(att.content, 'base64')
            : att.content;
          
          return {
            filename: att.filename,
            content: content,
            contentType: att.contentType || 'application/pdf'
          };
        }),
      });

      console.log('✅ Email sent successfully:', info.messageId);
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return {
        success: false,
        message: `Failed to send email: ${error}`,
      };
    }
  }

  // ============================================
  // Invoice Email Templates
  // ============================================

  async sendInvoiceEmail(data: {
    to: string;
    invoiceNumber: string;
    customerName: string;
    amount: number;
    dueDate: string;
    invoiceUrl?: string;
  }): Promise<{ success: boolean; message: string }> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .amount { font-size: 24px; font-weight: bold; color: #667eea; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 Invoice Ready</h1>
      <p>Your invoice has been generated</p>
    </div>
    <div class="content">
      <p>Dear ${data.customerName},</p>
      <p>Thank you for your business! Your invoice is now ready for payment.</p>
      
      <div class="invoice-details">
        <div class="detail-row">
          <span><strong>Invoice Number:</strong></span>
          <span>${data.invoiceNumber}</span>
        </div>
        <div class="detail-row">
          <span><strong>Due Date:</strong></span>
          <span>${data.dueDate}</span>
        </div>
        <div class="detail-row">
          <span><strong>Amount:</strong></span>
          <span class="amount">IDR ${data.amount.toLocaleString('id-ID')}</span>
        </div>
      </div>

      ${data.invoiceUrl ? `<a href="${data.invoiceUrl}" class="button">View Invoice</a>` : ''}
      
      <p style="margin-top: 30px;">Please process the payment before the due date to avoid late fees.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
    </div>
    <div class="footer">
      <p>This is an automated email from Project Finance</p>
      <p>© ${new Date().getFullYear()} Project Finance. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `Invoice ${data.invoiceNumber} - Payment Due ${data.dueDate}`,
      html,
    });
  }

  // ============================================
  // Payment Reminder Email
  // ============================================

  async sendPaymentReminder(data: {
    to: string;
    invoiceNumber: string;
    customerName: string;
    amount: number;
    dueDate: string;
    daysOverdue?: number;
  }): Promise<{ success: boolean; message: string }> {
    const isOverdue = data.daysOverdue && data.daysOverdue > 0;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${isOverdue ? '#ef4444' : '#f59e0b'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .warning-box { background: ${isOverdue ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${isOverdue ? '#ef4444' : '#f59e0b'}; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .amount { font-size: 24px; font-weight: bold; color: ${isOverdue ? '#dc2626' : '#d97706'}; }
    .button { display: inline-block; background: ${isOverdue ? '#dc2626' : '#d97706'}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Payment ${isOverdue ? 'Overdue' : 'Reminder'}</h1>
    </div>
    <div class="content">
      <p>Dear ${data.customerName},</p>
      
      <div class="warning-box">
        <strong>${isOverdue ? '🔴 OVERDUE INVOICE' : '🟡 PAYMENT DUE SOON'}</strong>
        <p style="margin: 10px 0 0 0;">
          ${isOverdue 
            ? `This invoice is ${data.daysOverdue} days overdue. Please process payment immediately.`
            : 'Your invoice is due soon. Please arrange payment to avoid late fees.'
          }
        </p>
      </div>

      <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
      <p><strong>Due Date:</strong> ${data.dueDate}</p>
      <p><strong>Amount Due:</strong> <span class="amount">IDR ${data.amount.toLocaleString('id-ID')}</span></p>

      <p style="margin-top: 30px;">Please process this payment as soon as possible.</p>
      
      <a href="#" class="button">Pay Now</a>
    </div>
    <div class="footer" style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Project Finance. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `${isOverdue ? '🔴 OVERDUE' : '⚠️ REMINDER'}: Invoice ${data.invoiceNumber}`,
      html,
    });
  }

  // ============================================
  // Payment Received Email
  // ============================================

  async sendPaymentConfirmation(data: {
    to: string;
    invoiceNumber: string;
    customerName: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
  }): Promise<{ success: boolean; message: string }> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .amount { font-size: 24px; font-weight: bold; color: #059669; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Payment Received</h1>
      <p>Thank you for your payment!</p>
    </div>
    <div class="content">
      <p>Dear ${data.customerName},</p>
      
      <div class="success-box">
        <strong>✅ Payment Confirmed</strong>
        <p style="margin: 10px 0 0 0;">We have successfully received your payment.</p>
      </div>

      <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
      <p><strong>Payment Date:</strong> ${data.paymentDate}</p>
      <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
      <p><strong>Amount Paid:</strong> <span class="amount">IDR ${data.amount.toLocaleString('id-ID')}</span></p>

      <p style="margin-top: 30px;">Thank you for your business! We appreciate your prompt payment.</p>
    </div>
    <div class="footer" style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Project Finance. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `✅ Payment Received - Invoice ${data.invoiceNumber}`,
      html,
    });
  }

  // ============================================
  // Test Email Configuration
  // ============================================

  async sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Email Test Successful!</h1>
      <p>Your email configuration is working correctly.</p>
      <p style="font-size: 14px; margin-top: 20px;">Project Finance - Email Service</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to,
      subject: '✅ Project Finance - Email Test',
      html,
    });
  }

  // Check if email service is configured
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
