// Invoice Service - Per TSD FITUR 3.4.A
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import financeEvents from '../events/financeEvents';
import pdfService from './pdf.service';
import emailService from './email.service';

const prisma = new PrismaClient();

export interface CreateInvoiceDto {
  invoice_number?: string;
  invoice_date: string;
  due_date: string;
  customer_id?: string;
  customer_name: string;
  customer_address?: string;
  customer_phone?: string;
  customer_email?: string;
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  currency?: string;
  status?: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  payment_terms?: string;
  created_by?: string;
}

export interface RecordPaymentDto {
  payment_date: string;
  amount: number;
  method: string; // 'TRANSFER', 'CASH', 'CHEQUE', etc.
  notes?: string;
}

class InvoicesService {
  /**
   * Generate auto invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Get count of invoices this month
    const countResult: any = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count
      FROM invoices
      WHERE EXTRACT(YEAR FROM invoice_date) = ${year}
      AND EXTRACT(MONTH FROM invoice_date) = ${now.getMonth() + 1}
    `);
    
    const count = countResult[0]?.count || 0;
    const sequence = String(count + 1).padStart(4, '0');
    
    return `INV-${year}${month}-${sequence}`;
  }

  /**
   * Get all invoices with filters
   */
  async getAllInvoices(filters?: {
    status?: string;
    customer_name?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.status) {
        conditions.push(`status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }

      if (filters?.customer_name) {
        conditions.push(`customer_name ILIKE $${paramIndex}`);
        params.push(`%${filters.customer_name}%`);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      // Get invoices
      const invoices: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM invoices ${whereClause} ORDER BY invoice_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        ...params,
        limit,
        skip
      );

      // Get total count
      const totalResult: any[] = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as count FROM invoices ${whereClause}`,
        ...params
      );

      const total = totalResult[0]?.count || 0;

      return {
        data: invoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Get AR summary (Accounts Receivable metrics)
   */
  async getARSummary() {
    try {
      const summary: any[] = await prisma.$queryRawUnsafe(`
        SELECT
          COALESCE(SUM(CASE WHEN status IN ('SENT', 'PARTIALLY_PAID') THEN total_amount ELSE 0 END), 0) as total_receivable,
          COALESCE(SUM(CASE WHEN status IN ('SENT', 'PARTIALLY_PAID') AND due_date < NOW() THEN total_amount ELSE 0 END), 0) as overdue_amount,
          COALESCE(AVG(EXTRACT(DAY FROM (CURRENT_DATE - invoice_date))), 0) as avg_days_outstanding
        FROM invoices
        WHERE status IN ('SENT', 'PARTIALLY_PAID', 'OVERDUE')
      `);

      return {
        total_receivable: Number(summary[0].total_receivable),
        overdue_amount: Number(summary[0].overdue_amount),
        avg_days_outstanding: Math.round(Number(summary[0].avg_days_outstanding)),
      };
    } catch (error) {
      console.error('Error fetching AR summary:', error);
      throw error;
    }
  }

  /**
   * Create new invoice
   */
  async createInvoice(data: CreateInvoiceDto) {
    try {
      // Generate invoice number if not provided
      const invoiceNumber = data.invoice_number || await this.generateInvoiceNumber();

      // Check if invoice number already exists
      const existing: any[] = await prisma.$queryRawUnsafe(
        'SELECT id FROM invoices WHERE invoice_number = $1',
        invoiceNumber
      );

      if (existing.length > 0) {
        throw new Error('Invoice number already exists');
      }

      const id = uuidv4();

      const query = `
        INSERT INTO invoices (
          id, invoice_number, invoice_date, due_date, customer_id, customer_name,
          customer_address, customer_phone, customer_email, subtotal,
          tax_amount, discount_amount, total_amount, currency, status,
          notes, payment_terms, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3::date, $4::date, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
        ) RETURNING *
      `;

      const params = [
        id,
        invoiceNumber,
        data.invoice_date,
        data.due_date,
        data.customer_id || null,
        data.customer_name,
        data.customer_address || null,
        data.customer_phone || null,
        data.customer_email || null,
        data.subtotal,
        data.tax_amount || 0,
        data.discount_amount || 0,
        data.total_amount,
        data.currency || 'IDR',
        data.status || 'DRAFT',
        data.notes || null,
        data.payment_terms || null,
        data.created_by || 'system',
      ];

      const result: any[] = await prisma.$queryRawUnsafe(query, ...params);
      
      console.log(`✅ Invoice created: ${invoiceNumber}`);
      
      return result[0];
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Send invoice - Changes status to SENT and triggers journal entry
   * Per TSD FITUR 3.4.A - Alur 1
   */
  async sendInvoice(invoiceId: string, sentBy?: string) {
    try {
      // Get invoice (cast UUID)
      const invoices: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM invoices WHERE id = $1::uuid',
        invoiceId
      );

      if (invoices.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = invoices[0];

      // Validate status
      if (invoice.status !== 'DRAFT') {
        throw new Error('Only DRAFT invoices can be sent');
      }

      // Update status to SENT (cast UUID)
      const updated: any[] = await prisma.$queryRawUnsafe(`
        UPDATE invoices
        SET status = 'SENT', updated_at = NOW(), updated_by = $2
        WHERE id = $1::uuid
        RETURNING *
      `, invoiceId, sentBy || 'system');

      console.log(`✅ Invoice ${invoice.invoice_number} sent`);

      // Trigger event for journal entry (invoice.sent)
      // Per TSD FITUR 3.4.A - FIN-10
      financeEvents.emit('invoice.sent', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        amount: Number(invoice.total_amount), // Total termasuk PPN
        subtotal: Number(invoice.subtotal), // Subtotal sebelum PPN
        taxAmount: Number(invoice.tax_amount), // PPN 11%
        customerId: invoice.customer_id,
      });

      // Generate PDF
      try {
        const pdfData = {
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          customer_name: invoice.customer_name,
          customer_address: invoice.customer_address || '-',
          customer_npwp: invoice.customer_npwp || '-',
          customer_phone: invoice.customer_phone,
          customer_email: invoice.customer_email,
          wo_po_number: invoice.payment_terms,
          items: [], // TODO: Add invoice_items relation
          subtotal: Number(invoice.subtotal),
          tax_amount: Number(invoice.tax_amount),
          tax_rate: 11,
          total_amount: Number(invoice.total_amount),
          notes: invoice.notes,
        };
        
        const pdfBuffer = await pdfService.generateInvoicePDF(pdfData);
        console.log(`📄 PDF generated for invoice ${invoice.invoice_number}`);
        
        // Save PDF to file system
        const filename = `Invoice_${invoice.invoice_number}_${Date.now()}.pdf`;
        await pdfService.savePDFToFile(pdfBuffer, filename);
        
        // Send email with PDF attachment (if customer has email)
        if (invoice.customer_email) {
          const emailSent = await emailService.sendInvoiceEmail({
            to: invoice.customer_email,
            invoiceNumber: invoice.invoice_number,
            customerName: invoice.customer_name,
            totalAmount: Number(invoice.total_amount),
            dueDate: invoice.due_date,
            pdfBuffer: pdfBuffer,
          });
          
          if (emailSent) {
            console.log(`📧 Email sent to ${invoice.customer_email}`);
          }
        } else {
          console.log('ℹ️ No customer email - PDF generated but email not sent');
        }
      } catch (error) {
        console.error('⚠️ Failed to generate PDF or send email:', error);
        // Don't fail the whole operation if PDF/email fails
      }

      return updated[0];
    } catch (error) {
      console.error('Error sending invoice:', error);
      throw error;
    }
  }

  /**
   * Record payment for invoice
   * Per TSD FITUR 3.4.A - Alur 2
   */
  async recordPayment(invoiceId: string, payment: RecordPaymentDto) {
    try {
      // Get invoice with calculated remaining (cast UUID)
      const invoices: any[] = await prisma.$queryRawUnsafe(
        'SELECT *, (total_amount - COALESCE(paid_amount, 0)) as current_remaining FROM invoices WHERE id = $1::uuid',
        invoiceId
      );

      if (invoices.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = invoices[0];
      const currentRemaining = Number(invoice.current_remaining);

      // Validate status
      if (!['SENT', 'PARTIALLY_PAID'].includes(invoice.status)) {
        throw new Error('Can only record payment for SENT or PARTIALLY_PAID invoices');
      }

      // Validate payment amount
      if (payment.amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      if (payment.amount > currentRemaining) {
        throw new Error(`Payment amount (${payment.amount}) exceeds remaining balance (${currentRemaining})`);
      }

      // Calculate new amounts
      const newPaidAmount = Number(invoice.paid_amount || 0) + payment.amount;
      const newRemainingAmount = Number(invoice.total_amount) - newPaidAmount;
      const newStatus = newRemainingAmount <= 0.01 ? 'PAID' : 'PARTIALLY_PAID';

      // Insert payment record (cast UUIDs)
      const { v4: uuidv4 } = await import('uuid');
      const paymentId = uuidv4();
      await prisma.$queryRawUnsafe(`
        INSERT INTO invoice_payments (id, invoice_id, payment_date, payment_amount, payment_method, reference_number, notes, created_at)
        VALUES ($1::uuid, $2::uuid, $3::date, $4, $5, $6, $7, NOW())
      `, paymentId, invoiceId, payment.payment_date, payment.amount, payment.method, payment.reference || `PAY-${Date.now()}`, payment.notes);

      // Update invoice status and amounts (cast UUID)
      const updated: any[] = await prisma.$queryRawUnsafe(`
        UPDATE invoices
        SET paid_amount = $2, remaining_amount = $3, status = $4, updated_at = NOW()
        WHERE id = $1::uuid
        RETURNING *
      `, invoiceId, newPaidAmount, newRemainingAmount, newStatus);

      console.log(`✅ Payment recorded for invoice ${invoice.invoice_number}: ${payment.amount} (Status: ${newStatus})`);

      // Trigger event for journal entry (payment.received)
      // Per TSD FITUR 3.4.A - FIN-11
      financeEvents.emit('payment.received', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        amount: payment.amount,
        method: payment.method,
        paymentDate: payment.payment_date,
      });

      // Per TSD: Trigger project.fully_paid jika invoice lunas
      if (newStatus === 'PAID' && invoice.customer_id) {
        console.log(`📊 Invoice ${invoice.invoice_number} FULLY PAID`);
        
        // Emit event for single invoice paid
        financeEvents.emit('invoice.fully_paid', {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          customerId: invoice.customer_id,
          totalAmount: Number(invoice.total_amount),
        });

        // Check if ALL invoices for this project/customer are now paid
        // Assuming project_id is stored or customer_id represents the project
        const projectInvoices: any[] = await prisma.$queryRawUnsafe(`
          SELECT id, invoice_number, status, total_amount
          FROM invoices
          WHERE customer_id = $1::uuid
          AND status != 'DRAFT'
        `, invoice.customer_id);

        const allPaid = projectInvoices.every(inv => inv.status === 'PAID');
        const totalRevenue = projectInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);

        if (allPaid && projectInvoices.length > 0) {
          console.log(`🎉 ALL invoices for customer ${invoice.customer_id} are PAID! Total revenue: ${totalRevenue}`);
          console.log(`   Invoices: ${projectInvoices.map(inv => inv.invoice_number).join(', ')}`);
          
          // Emit project.fully_paid event for incentive calculation
          financeEvents.emit('project.fully_paid', {
            customerId: invoice.customer_id,
            projectId: invoice.customer_id, // Use customer_id as project identifier
            invoiceCount: projectInvoices.length,
            totalRevenue: totalRevenue,
            invoiceNumbers: projectInvoices.map(inv => inv.invoice_number),
          });
        } else {
          const unpaidCount = projectInvoices.filter(inv => inv.status !== 'PAID').length;
          console.log(`   Project status: ${projectInvoices.length - unpaidCount}/${projectInvoices.length} invoices paid`);
        }
      }

      return {
        invoice: updated[0],
        payment: {
          id: paymentId,
          amount: payment.amount,
          payment_date: payment.payment_date,
          method: payment.method,
          notes: payment.notes,
        },
        remaining_amount: newRemainingAmount,
      };
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }
}

export default new InvoicesService();
