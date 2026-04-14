/**
 * Milestone Invoice Service
 * Auto-generate DRAFT invoices from project milestones
 * Per TSD FITUR 3.4.A - FIN-09: Auto-generate invoice based on termin/milestone
 */

import { PrismaClient } from '@prisma/client';
import { mockDataStore } from '../utils/mockData';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Helper: Auto-create journal entry for invoice
 * DR: Account Receivable (Piutang) = total_amount
 * CR: Sales Revenue (Pendapatan) = total_amount
 */
async function createJournalEntryForInvoice(
  invoiceId: string,
  invoiceNumber: string,
  invoiceDate: string,
  customerName: string,
  totalAmount: number
) {
  try {
    console.log(`📝 Creating journal entry for invoice ${invoiceNumber}...`);

    // Get Account Receivable account (Piutang)
    const arAccount: any = await prisma.$queryRawUnsafe(`
      SELECT id, account_code, account_name 
      FROM "ChartOfAccounts" 
      WHERE account_code LIKE '1-1%' AND account_name ILIKE '%piutang%'
      LIMIT 1
    `);

    // Get Sales Revenue account (Pendapatan Penjualan)
    const salesAccount: any = await prisma.$queryRawUnsafe(`
      SELECT id, account_code, account_name 
      FROM "ChartOfAccounts" 
      WHERE account_code LIKE '4-%' AND account_name ILIKE '%penjualan%'
      LIMIT 1
    `);

    if (!arAccount || arAccount.length === 0) {
      console.warn('⚠️ Account Receivable account not found in COA');
      return;
    }

    if (!salesAccount || salesAccount.length === 0) {
      console.warn('⚠️ Sales Revenue account not found in COA');
      return;
    }

    const arAccountId = arAccount[0].id;
    const salesAccountId = salesAccount[0].id;

    // Create DEBIT entry (Account Receivable)
    await prisma.$queryRawUnsafe(`
      INSERT INTO journal_entries (
        transaction_date, description, account_id, debit, credit,
        reference_id, reference_type, created_by, created_at, updated_at
      ) VALUES (
        '${new Date(invoiceDate).toISOString()}',
        'Piutang dari Invoice ${invoiceNumber} - ${customerName}',
        ${arAccountId},
        ${totalAmount},
        0,
        '${invoiceId}',
        'INVOICE',
        'SYSTEM',
        NOW(),
        NOW()
      )
    `);

    // Create CREDIT entry (Sales Revenue)
    await prisma.$queryRawUnsafe(`
      INSERT INTO journal_entries (
        transaction_date, description, account_id, debit, credit,
        reference_id, reference_type, created_by, created_at, updated_at
      ) VALUES (
        '${new Date(invoiceDate).toISOString()}',
        'Pendapatan dari Invoice ${invoiceNumber} - ${customerName}',
        ${salesAccountId},
        0,
        ${totalAmount},
        '${invoiceId}',
        'INVOICE',
        'SYSTEM',
        NOW(),
        NOW()
      )
    `);

    console.log(`✅ Journal entry created: DR Account Receivable Rp ${totalAmount.toLocaleString('id-ID')}, CR Sales Revenue Rp ${totalAmount.toLocaleString('id-ID')}`);
  } catch (error) {
    console.error('❌ Error creating journal entry for invoice:', error);
    // Don't throw error - invoice creation should succeed even if journal fails
  }
}

interface MilestoneInvoiceResult {
  success: boolean;
  invoicesGenerated: number;
  invoices: Array<{
    invoice_number: string;
    project_id: string;
    milestone_id: string;
    milestone_name: string;
    customer_name: string;
    amount: number;
  }>;
  errors: Array<{
    milestone_id: string;
    milestone_name: string;
    error: string;
  }>;
}

class MilestoneInvoiceService {
  /**
   * Generate invoice number with date
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
   * Auto-generate DRAFT invoices from milestones that reached end_date
   * Should be called by CRON job daily
   */
  async generateInvoicesFromDueMilestones(): Promise<MilestoneInvoiceResult> {
    const result: MilestoneInvoiceResult = {
      success: true,
      invoicesGenerated: 0,
      invoices: [],
      errors: [],
    };

    try {
      console.log('🔍 Checking for milestones that are due for invoicing...');

      // If Prisma/tables not available, return empty result so endpoint doesn't 500.
      if (!prisma.project_milestones) {
        console.warn('⚠️ Prisma project_milestones model unavailable - skipping invoice generation and returning empty result');
        return result;
      }

      // Query milestones yang:
      // 1. Status = DONE (milestone completed)
      // 2. end_date sudah tercapai (TODAY or past)
      // 3. invoice_generated = FALSE (belum pernah di-invoice)
      // 4. milestone_value > 0 (ada nilai untuk di-invoice)
      const dueMilestones: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          pm.id as milestone_id,
          pm.project_id,
          pm.name as milestone_name,
          pm.end_date,
          pm.milestone_value,
          p.project_name,
          p.project_number,
          p.customer_id,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.address as customer_address
        FROM project_milestones pm
        INNER JOIN projects p ON pm.project_id = p.id
        INNER JOIN customers c ON p.customer_id = c.id
        WHERE pm.status = 'DONE'
          AND pm.end_date <= CURRENT_DATE
          AND pm.invoice_generated = FALSE
          AND pm.milestone_value IS NOT NULL
          AND pm.milestone_value > 0
        ORDER BY pm.end_date ASC
      `);

      console.log(`📋 Found ${dueMilestones.length} milestones ready for invoicing`);

      if (dueMilestones.length === 0) {
        console.log('✅ No milestones to invoice at this time');
        return result;
      }

      // Generate invoice untuk setiap milestone
      for (const milestone of dueMilestones) {
        try {
          console.log(`📄 Generating invoice for milestone: ${milestone.milestone_name} (Project: ${milestone.project_name})`);

          // Generate invoice number
          const invoiceNumber = await this.generateInvoiceNumber();

          // Calculate amounts
          const subtotal = Number(milestone.milestone_value);
          const taxAmount = subtotal * 0.11; // PPN 11%
          const totalAmount = subtotal + taxAmount;

          // Calculate due date (30 days from today by default)
          const invoiceDate = new Date();
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);

          const invoiceId = uuidv4();

          // Create DRAFT invoice
          await prisma.$queryRawUnsafe(`
            INSERT INTO invoices (
              id, invoice_number, invoice_date, due_date,
              customer_id, customer_name, customer_address, customer_phone, customer_email,
              project_id, milestone_id,
              subtotal, tax_amount, discount_amount, total_amount,
              paid_amount, remaining_amount,
              currency, status, notes, payment_terms,
              created_by, created_at, updated_at
            ) VALUES (
              $1, $2, $3::date, $4::date,
              $5, $6, $7, $8, $9,
              $10, $11,
              $12, $13, 0, $14,
              0, $14,
              'IDR', 'DRAFT', $15, 'NET 30',
              'system:auto-milestone', NOW(), NOW()
            )
          `,
            invoiceId,
            invoiceNumber,
            invoiceDate.toISOString().split('T')[0],
            dueDate.toISOString().split('T')[0],
            milestone.customer_id,
            milestone.customer_name,
            milestone.customer_address || '-',
            milestone.customer_phone || '-',
            milestone.customer_email || '-',
            milestone.project_id,
            milestone.milestone_id,
            subtotal,
            taxAmount,
            totalAmount,
            `Auto-generated from Project Milestone: ${milestone.milestone_name} (${milestone.project_number})`
          );

          console.log(`✅ Invoice ${invoiceNumber} created in DRAFT status`);

          // 🔥 AUTO-CREATE JOURNAL ENTRY (Accounting Integration)
          await createJournalEntryForInvoice(
            invoiceId,
            invoiceNumber,
            invoiceDate.toISOString().split('T')[0],
            milestone.customer_name,
            totalAmount
          );

          // Update milestone flag
          await prisma.$queryRawUnsafe(`
            UPDATE project_milestones
            SET invoice_generated = TRUE
            WHERE id = $1
          `, milestone.milestone_id);

          console.log(`✅ Milestone ${milestone.milestone_name} marked as invoiced`);

          // Add to result
          result.invoicesGenerated++;
          result.invoices.push({
            invoice_number: invoiceNumber,
            project_id: milestone.project_id,
            milestone_id: milestone.milestone_id,
            milestone_name: milestone.milestone_name,
            customer_name: milestone.customer_name,
            amount: totalAmount,
          });

        } catch (error: any) {
          console.error(`❌ Error generating invoice for milestone ${milestone.milestone_name}:`, error);
          result.errors.push({
            milestone_id: milestone.milestone_id,
            milestone_name: milestone.milestone_name,
            error: error.message,
          });
        }
      }

      console.log(`\n✅ Invoice generation complete:`);
      console.log(`   - Success: ${result.invoicesGenerated} invoices`);
      console.log(`   - Errors: ${result.errors.length} failures`);

      if (result.errors.length > 0) {
        result.success = false;
      }

      return result;

    } catch (error) {
      console.error('❌ Critical error in milestone invoice generation:', error);
      result.success = false;
      return result;
    }
  }

  /**
   * Get milestones that are ready for invoicing (for preview/manual check)
   */
  async getReadyMilestones(): Promise<any[]> {
    try {
      // If Prisma/tables not available, return empty list (safe fallback)
      if (!prisma.project_milestones) {
        console.warn('⚠️ Prisma project_milestones model unavailable - returning empty ready milestones list');
        return [];
      }

      const milestones: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          pm.id as milestone_id,
          pm.project_id,
          pm.name as milestone_name,
          pm.end_date,
          pm.milestone_value,
          pm.status,
          pm.invoice_generated,
          p.project_name,
          p.project_number,
          c.name as customer_name
        FROM project_milestones pm
        INNER JOIN projects p ON pm.project_id = p.id
        INNER JOIN customers c ON p.customer_id = c.id
        WHERE pm.status = 'DONE'
          AND pm.end_date <= CURRENT_DATE
          AND pm.invoice_generated = FALSE
          AND pm.milestone_value IS NOT NULL
          AND pm.milestone_value > 0
        ORDER BY pm.end_date ASC
      `);

      return milestones;
    } catch (error) {
      console.error('Error fetching ready milestones:', error);
      throw error;
    }
  }

  /**
   * Manually trigger invoice generation for specific milestone
   */
  async generateInvoiceForMilestone(milestoneId: string): Promise<any> {
    try {
      console.log(`📄 Manually generating invoice for milestone: ${milestoneId}`);

      // Get milestone details
      const milestones: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          pm.id as milestone_id,
          pm.project_id,
          pm.name as milestone_name,
          pm.milestone_value,
          pm.status,
          pm.invoice_generated,
          p.project_name,
          p.project_number,
          p.customer_id,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          c.address as customer_address
        FROM project_milestones pm
        INNER JOIN projects p ON pm.project_id = p.id
        INNER JOIN customers c ON p.customer_id = c.id
        WHERE pm.id = $1
      `, milestoneId);

      if (milestones.length === 0) {
        throw new Error('Milestone not found');
      }

      const milestone = milestones[0];

      if (milestone.invoice_generated) {
        throw new Error('Invoice already generated for this milestone');
      }

      if (!milestone.milestone_value || milestone.milestone_value <= 0) {
        throw new Error('Milestone value is not set or invalid');
      }

      // Generate invoice (same logic as auto-generation)
      const invoiceNumber = await this.generateInvoiceNumber();

      const subtotal = Number(milestone.milestone_value);
      const taxAmount = subtotal * 0.11;
      const totalAmount = subtotal + taxAmount;

      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoiceId = uuidv4();

      await prisma.$queryRawUnsafe(`
        INSERT INTO invoices (
          id, invoice_number, invoice_date, due_date,
          customer_id, customer_name, customer_address, customer_phone, customer_email,
          project_id, milestone_id,
          subtotal, tax_amount, discount_amount, total_amount,
          paid_amount, remaining_amount,
          currency, status, notes, payment_terms,
          created_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3::date, $4::date,
          $5, $6, $7, $8, $9,
          $10, $11,
          $12, $13, 0, $14,
          0, $14,
          'IDR', 'DRAFT', $15, 'NET 30',
          'user:manual', NOW(), NOW()
        )
        RETURNING *
      `,
        invoiceId,
        invoiceNumber,
        invoiceDate.toISOString().split('T')[0],
        dueDate.toISOString().split('T')[0],
        milestone.customer_id,
        milestone.customer_name,
        milestone.customer_address || '-',
        milestone.customer_phone || '-',
        milestone.customer_email || '-',
        milestone.project_id,
        milestone.milestone_id,
        subtotal,
        taxAmount,
        totalAmount,
        `Manual invoice from Project Milestone: ${milestone.milestone_name} (${milestone.project_number})`
      );

      // 🔥 AUTO-CREATE JOURNAL ENTRY (Accounting Integration)
      await createJournalEntryForInvoice(
        invoiceId,
        invoiceNumber,
        invoiceDate.toISOString().split('T')[0],
        milestone.customer_name,
        totalAmount
      );

      // Update milestone flag
      await prisma.$queryRawUnsafe(`
        UPDATE project_milestones
        SET invoice_generated = TRUE
        WHERE id = $1
      `, milestoneId);

      console.log(`✅ Invoice ${invoiceNumber} created successfully`);

      return {
        success: true,
        invoice_number: invoiceNumber,
        milestone_name: milestone.milestone_name,
        amount: totalAmount,
      };

    } catch (error) {
      console.error('Error generating invoice for milestone:', error);
      throw error;
    }
  }
}

export default new MilestoneInvoiceService();
