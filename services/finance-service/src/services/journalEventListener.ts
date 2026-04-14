import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * MIN-139 [FIN-12]
 * Event Listener untuk Auto-Journal
 * 
 * Events:
 * - material.issued: Material dikeluarkan dari gudang
 * - invoice.sent: Invoice dikirim ke customer
 * - payment.received: Pembayaran diterima dari customer
 * - purchase.approved: Purchase order disetujui
 * - expense.recorded: Expense dicatat
 */

class JournalEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  private setupListeners() {
    // Event 1: Material Issued (Pengeluaran Barang)
    this.on('material.issued', async (data: MaterialIssuedData) => {
      await this.handleMaterialIssued(data);
    });

    // Event 2: Invoice Sent (Invoice Dikirim)
    this.on('invoice.sent', async (data: InvoiceSentData) => {
      await this.handleInvoiceSent(data);
    });

    // Event 3: Payment Received (Pembayaran Diterima)
    this.on('payment.received', async (data: PaymentReceivedData) => {
      await this.handlePaymentReceived(data);
    });

    // Event 4: Purchase Approved (PO Disetujui)
    this.on('purchase.approved', async (data: PurchaseApprovedData) => {
      await this.handlePurchaseApproved(data);
    });

    // Event 5: Expense Recorded (Biaya Dicatat)
    this.on('expense.recorded', async (data: ExpenseRecordedData) => {
      await this.handleExpenseRecorded(data);
    });

    console.log('✅ Journal Event Listeners initialized');
  }

  /**
   * Handle Material Issued
   * Jurnal: Debit HPP, Credit Inventory
   */
  private async handleMaterialIssued(data: MaterialIssuedData) {
    try {
      console.log('📦 Processing material.issued event:', data);

      // Get COA accounts
      const cogs = await prisma.chartOfAccounts.findFirst({
        where: { account_code: { startsWith: '5-1' }, account_name: { contains: 'HPP' } }
      });

      const inventory = await prisma.chartOfAccounts.findFirst({
        where: { account_code: { startsWith: '1-3' }, account_name: { contains: 'Persediaan' } }
      });

      if (!cogs || !inventory) {
        console.warn('⚠️ COA not found for material.issued');
        return;
      }

      await prisma.$transaction(async (tx) => {
        // Debit: HPP (Cost of Goods Sold) - Increase expense
        await tx.journal_entries.create({
          data: {
            transaction_date: data.transaction_date || new Date(),
            description: `HPP - Material issued: ${data.material_name} (${data.quantity} ${data.unit})`,
            account_id: cogs.id,
            debit: data.total_cost,
            credit: 0,
            reference_id: data.reference_id,
            reference_type: 'MATERIAL_ISSUE',
            created_by: data.created_by || 'system'
          }
        });

        // Credit: Inventory - Decrease asset
        await tx.journal_entries.create({
          data: {
            transaction_date: data.transaction_date || new Date(),
            description: `Pengurangan persediaan: ${data.material_name} (${data.quantity} ${data.unit})`,
            account_id: inventory.id,
            debit: 0,
            credit: data.total_cost,
            reference_id: data.reference_id,
            reference_type: 'MATERIAL_ISSUE',
            created_by: data.created_by || 'system'
          }
        });
      });

      console.log(`✅ Journal created for material.issued: ${data.material_name} - ${data.total_cost}`);
    } catch (error: any) {
      console.error('❌ Error handling material.issued:', error.message);
    }
  }

  /**
   * Handle Invoice Sent
   * Jurnal: Debit Piutang, Credit Pendapatan
   */
  private async handleInvoiceSent(data: InvoiceSentData) {
    try {
      console.log('📄 Processing invoice.sent event:', data);

      // Get COA accounts
      const ar = await prisma.chartOfAccounts.findFirst({
        where: { account_code: { startsWith: '1-2' }, account_name: { contains: 'Piutang' } }
      });

      const revenue = await prisma.chartOfAccounts.findFirst({
        where: { account_code: { startsWith: '4-1' }, account_name: { contains: 'Pendapatan' } }
      });

      if (!ar || !revenue) {
        console.warn('⚠️ COA not found for invoice.sent');
        return;
      }

      await prisma.$transaction(async (tx) => {
        // Debit: Account Receivable - Increase asset
        await tx.journal_entries.create({
          data: {
            transaction_date: data.invoice_date || new Date(),
            description: `Piutang - Invoice ${data.invoice_number} - ${data.customer_name}`,
            account_id: ar.id,
            debit: data.total_amount,
            credit: 0,
            reference_id: data.invoice_id,
            reference_type: 'INVOICE',
            created_by: data.created_by || 'system'
          }
        });

        // Credit: Revenue - Increase income
        await tx.journal_entries.create({
          data: {
            transaction_date: data.invoice_date || new Date(),
            description: `Pendapatan - Invoice ${data.invoice_number} - ${data.customer_name}`,
            account_id: revenue.id,
            debit: 0,
            credit: data.total_amount,
            reference_id: data.invoice_id,
            reference_type: 'INVOICE',
            created_by: data.created_by || 'system'
          }
        });
      });

      console.log(`✅ Journal created for invoice.sent: ${data.invoice_number} - ${data.total_amount}`);
    } catch (error: any) {
      console.error('❌ Error handling invoice.sent:', error.message);
    }
  }

  /**
   * Handle Payment Received
   * Jurnal: Debit Kas/Bank, Credit Piutang
   */
  private async handlePaymentReceived(data: PaymentReceivedData) {
    try {
      console.log('💰 Processing payment.received event:', data);

      // Get COA accounts
      const cash = await prisma.chartOfAccounts.findFirst({
        where: { 
          account_code: { startsWith: '1-1-1' },
          account_name: { contains: data.payment_method === 'CASH' ? 'Kas' : 'Bank' }
        }
      });

      const ar = await prisma.chartOfAccounts.findFirst({
        where: { account_code: { startsWith: '1-2' }, account_name: { contains: 'Piutang' } }
      });

      if (!cash || !ar) {
        console.warn('⚠️ COA not found for payment.received');
        return;
      }

      await prisma.$transaction(async (tx) => {
        // Debit: Cash/Bank - Increase asset
        await tx.journal_entries.create({
          data: {
            transaction_date: data.payment_date || new Date(),
            description: `Penerimaan pembayaran ${data.payment_method} - Invoice ${data.invoice_number}`,
            account_id: cash.id,
            debit: data.amount,
            credit: 0,
            reference_id: data.payment_id,
            reference_type: 'PAYMENT',
            created_by: data.created_by || 'system'
          }
        });

        // Credit: Account Receivable - Decrease asset
        await tx.journal_entries.create({
          data: {
            transaction_date: data.payment_date || new Date(),
            description: `Pelunasan piutang - Invoice ${data.invoice_number}`,
            account_id: ar.id,
            debit: 0,
            credit: data.amount,
            reference_id: data.payment_id,
            reference_type: 'PAYMENT',
            created_by: data.created_by || 'system'
          }
        });
      });

      console.log(`✅ Journal created for payment.received: ${data.invoice_number} - ${data.amount}`);
    } catch (error: any) {
      console.error('❌ Error handling payment.received:', error.message);
    }
  }

  /**
   * Handle Purchase Approved
   * Jurnal: Debit Inventory/Expense, Credit Hutang
   */
  private async handlePurchaseApproved(data: PurchaseApprovedData) {
    try {
      console.log('🛒 Processing purchase.approved event:', data);

      // Tentukan debit account berdasarkan tipe pembelian
      let debitAccount;
      if (data.purchase_type === 'INVENTORY') {
        debitAccount = await prisma.chartOfAccounts.findFirst({
          where: { account_code: { startsWith: '1-3' }, account_name: { contains: 'Persediaan' } }
        });
      } else {
        debitAccount = await prisma.chartOfAccounts.findFirst({
          where: { account_code: { startsWith: '5-' }, account_name: { contains: 'Beban' } }
        });
      }

      const ap = await prisma.chartOfAccounts.findFirst({
        where: { account_code: { startsWith: '2-1' }, account_name: { contains: 'Hutang' } }
      });

      if (!debitAccount || !ap) {
        console.warn('⚠️ COA not found for purchase.approved');
        return;
      }

      await prisma.$transaction(async (tx) => {
        // Debit: Inventory/Expense - Increase asset or expense
        await tx.journal_entries.create({
          data: {
            transaction_date: data.purchase_date || new Date(),
            description: `Pembelian ${data.purchase_type} - PO ${data.po_number} - ${data.vendor_name}`,
            account_id: debitAccount.id,
            debit: data.total_amount,
            credit: 0,
            reference_id: data.po_id,
            reference_type: 'PURCHASE',
            created_by: data.created_by || 'system'
          }
        });

        // Credit: Account Payable - Increase liability
        await tx.journal_entries.create({
          data: {
            transaction_date: data.purchase_date || new Date(),
            description: `Hutang - PO ${data.po_number} - ${data.vendor_name}`,
            account_id: ap.id,
            debit: 0,
            credit: data.total_amount,
            reference_id: data.po_id,
            reference_type: 'PURCHASE',
            created_by: data.created_by || 'system'
          }
        });
      });

      console.log(`✅ Journal created for purchase.approved: ${data.po_number} - ${data.total_amount}`);
    } catch (error: any) {
      console.error('❌ Error handling purchase.approved:', error.message);
    }
  }

  /**
   * Handle Expense Recorded
   * Jurnal: Debit Beban, Credit Kas/Bank
   */
  private async handleExpenseRecorded(data: ExpenseRecordedData) {
    try {
      console.log('💸 Processing expense.recorded event:', data);

      // Get COA accounts
      const expenseAccount = await prisma.chartOfAccounts.findFirst({
        where: { 
          account_code: { startsWith: '5-' },
          account_name: { contains: data.expense_category || 'Beban' }
        }
      });

      const cash = await prisma.chartOfAccounts.findFirst({
        where: { 
          account_code: { startsWith: '1-1-1' },
          account_name: { contains: data.payment_method === 'CASH' ? 'Kas' : 'Bank' }
        }
      });

      if (!expenseAccount || !cash) {
        console.warn('⚠️ COA not found for expense.recorded');
        return;
      }

      await prisma.$transaction(async (tx) => {
        // Debit: Expense - Increase expense
        await tx.journal_entries.create({
          data: {
            transaction_date: data.expense_date || new Date(),
            description: `${data.expense_category || 'Beban'} - ${data.description}`,
            account_id: expenseAccount.id,
            debit: data.amount,
            credit: 0,
            reference_id: data.expense_id,
            reference_type: 'EXPENSE',
            created_by: data.created_by || 'system'
          }
        });

        // Credit: Cash/Bank - Decrease asset
        await tx.journal_entries.create({
          data: {
            transaction_date: data.expense_date || new Date(),
            description: `Pembayaran ${data.expense_category || 'beban'} - ${data.description}`,
            account_id: cash.id,
            debit: 0,
            credit: data.amount,
            reference_id: data.expense_id,
            reference_type: 'EXPENSE',
            created_by: data.created_by || 'system'
          }
        });
      });

      console.log(`✅ Journal created for expense.recorded: ${data.description} - ${data.amount}`);
    } catch (error: any) {
      console.error('❌ Error handling expense.recorded:', error.message);
    }
  }
}

// Type Definitions
interface MaterialIssuedData {
  reference_id: string;
  material_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  transaction_date?: Date;
  created_by?: string;
}

interface InvoiceSentData {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  invoice_date?: Date;
  created_by?: string;
}

interface PaymentReceivedData {
  payment_id: string;
  invoice_number: string;
  amount: number;
  payment_method: string;
  payment_date?: Date;
  created_by?: string;
}

interface PurchaseApprovedData {
  po_id: string;
  po_number: string;
  vendor_name: string;
  total_amount: number;
  purchase_type: 'INVENTORY' | 'EXPENSE';
  purchase_date?: Date;
  created_by?: string;
}

interface ExpenseRecordedData {
  expense_id: string;
  description: string;
  amount: number;
  expense_category?: string;
  payment_method: string;
  expense_date?: Date;
  created_by?: string;
}

// Export singleton instance
export const journalEvents = new JournalEventEmitter();

// Export type definitions for use in other files
export type {
  MaterialIssuedData,
  InvoiceSentData,
  PaymentReceivedData,
  PurchaseApprovedData,
  ExpenseRecordedData
};
