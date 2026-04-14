// Event Emitter for Finance Events
// Per TSD FITUR 3.4.A & 3.4.B - Auto Journal Creation
// In production, this should use a message queue (RabbitMQ, Kafka, etc.)

import { EventEmitter } from 'events';
import journalEntriesService from '../services/journalentries.service';
import { prisma } from '../utils/prisma';

class FinanceEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  /**
   * Setup all event listeners for auto journal creation
   */
  private setupListeners() {
    // Invoice sent event -> Create journal entry (Debit: Piutang, Credit: Pendapatan)
    this.on('invoice.sent', this.onInvoiceSent.bind(this));

    // Payment received event -> Create journal entry (Debit: Kas, Credit: Piutang)
    this.on('payment.received', this.onPaymentReceived.bind(this));

    // Payable created event -> Create journal entry (Debit: Beban/Persediaan, Credit: Utang)
    this.on('payable.created', this.onPayableCreated.bind(this));

    // Payable paid event -> Create journal entry (Debit: Utang, Credit: Kas)
    this.on('payable.paid', this.onPayablePaid.bind(this));

    // Material issued event -> Create journal entry (Debit: Beban Proyek, Credit: Persediaan)
    this.on('material.issued', this.onMaterialIssued.bind(this));

    // Payroll approved event -> Create journal entry (Debit: Beban Gaji, Credit: Utang Gaji + Pajak)
    this.on('payroll.approved', this.onPayrollApproved.bind(this));

    console.log('✅ Finance event listeners initialized');
  }

  /**
   * EVENT: invoice.sent
   * Triggered when invoice status changes to SENT
   * Journal Entry: DEBIT Piutang Usaha, CREDIT Pendapatan
   */
  private async onInvoiceSent(eventData: {
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    subtotal: number;
    taxAmount: number;
    customerId?: string;
  }) {
    try {
      console.log(`📝 Creating journal entry for invoice.sent: ${eventData.invoiceNumber}`);

      // Get account IDs (in production, these should be configurable)
      const accountsReceivable = await this.getAccountByCode('1120'); // Piutang Usaha
      const revenueAccount = await this.getAccountByCode('4100'); // Pendapatan
      const taxPayableAccount = await this.getAccountByCode('2110'); // PPN Keluaran

      if (!accountsReceivable || !revenueAccount || !taxPayableAccount) {
        throw new Error('Required accounts not found in Chart of Accounts');
      }

      // Create journal entry with multiple lines
      // Pass invoiceId as reference_id for tracking
      const journalData = {
        transaction_date: new Date().toISOString().split('T')[0],
        description: `Penjualan - Invoice ${eventData.invoiceNumber}`,
        reference_type: 'INVOICE_SENT',
        reference_id: eventData.invoiceId, // Link to invoice
        lines: [
          {
            account_id: accountsReceivable.id,
            debit: eventData.amount, // Total termasuk PPN
            description: `Piutang dari invoice ${eventData.invoiceNumber}`,
          },
          {
            account_id: revenueAccount.id,
            credit: eventData.subtotal, // Subtotal sebelum PPN
            description: `Pendapatan dari invoice ${eventData.invoiceNumber}`,
          },
          {
            account_id: taxPayableAccount.id,
            credit: eventData.taxAmount, // PPN
            description: `PPN Keluaran ${eventData.invoiceNumber}`,
          },
        ],
        created_by: 'system:auto-journal',
      };

      await journalEntriesService.createGeneralJournal(journalData);

      console.log(`✅ Journal entry created for invoice ${eventData.invoiceNumber}`);
    } catch (error) {
      console.error('❌ Error creating journal entry for invoice.sent:', error);
      // In production, send to dead letter queue for retry
    }
  }

  /**
   * EVENT: payment.received
   * Triggered when payment is recorded for an invoice
   * Journal Entry: DEBIT Kas/Bank, CREDIT Piutang Usaha
   */
  private async onPaymentReceived(eventData: {
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    method: string;
    paymentDate: string;
  }) {
    try {
      console.log(`💰 Creating journal entry for payment.received: ${eventData.invoiceNumber}`);

      // Get account IDs
      const cashAccount = await this.getAccountByCode('1110'); // Kas/Bank
      const accountsReceivable = await this.getAccountByCode('1120'); // Piutang Usaha

      if (!cashAccount || !accountsReceivable) {
        throw new Error('Required accounts not found in Chart of Accounts');
      }

      const journalData = {
        transaction_date: eventData.paymentDate,
        description: `Pembayaran Invoice ${eventData.invoiceNumber} via ${eventData.method}`,
        reference_type: 'PAYMENT_RECEIVED',
        reference_id: eventData.invoiceId, // Link to invoice
        lines: [
          {
            account_id: cashAccount.id,
            debit: eventData.amount,
            description: `Penerimaan pembayaran invoice ${eventData.invoiceNumber}`,
          },
          {
            account_id: accountsReceivable.id,
            credit: eventData.amount,
            description: `Pengurangan piutang invoice ${eventData.invoiceNumber}`,
          },
        ],
        created_by: 'system:auto-journal',
      };

      await journalEntriesService.createGeneralJournal(journalData);

      console.log(`✅ Journal entry created for payment ${eventData.invoiceNumber}`);
    } catch (error) {
      console.error('❌ Error creating journal entry for payment.received:', error);
    }
  }

  /**
   * EVENT: payable.created
   * Triggered when vendor bill is recorded
   * Journal Entry: DEBIT Beban/Persediaan, CREDIT Utang Usaha
   */
  private async onPayableCreated(eventData: {
    payableId: string;
    vendorName: string;
    amount: number;
    type: 'GOODS' | 'SERVICES'; // PO for goods, WO for services
  }) {
    try {
      console.log(`📝 Creating journal entry for payable.created: ${eventData.vendorName}`);

      // Get account IDs based on type
      let debitAccountCode = '';
      if (eventData.type === 'GOODS') {
        debitAccountCode = '1310'; // Persediaan Barang
      } else {
        debitAccountCode = '5200'; // Beban Jasa Profesional
      }

      const debitAccount = await this.getAccountByCode(debitAccountCode);
      const accountsPayable = await this.getAccountByCode('2100'); // Utang Usaha

      if (!debitAccount || !accountsPayable) {
        throw new Error('Required accounts not found in Chart of Accounts');
      }

      const journalData = {
        transaction_date: new Date().toISOString().split('T')[0],
        description: `Pembelian dari ${eventData.vendorName}`,
        reference_type: 'PAYABLE_CREATED',
        lines: [
          {
            account_id: debitAccount.id,
            debit: eventData.amount,
            description: `Pembelian ${eventData.type === 'GOODS' ? 'barang' : 'jasa'} dari ${eventData.vendorName}`,
          },
          {
            account_id: accountsPayable.id,
            credit: eventData.amount,
            description: `Utang kepada ${eventData.vendorName}`,
          },
        ],
        created_by: 'system:auto-journal',
      };

      await journalEntriesService.createGeneralJournal(journalData);

      console.log(`✅ Journal entry created for payable to ${eventData.vendorName}`);
    } catch (error) {
      console.error('❌ Error creating journal entry for payable.created:', error);
    }
  }

  /**
   * EVENT: payable.paid
   * Triggered when vendor bill is paid
   * Journal Entry: DEBIT Utang Usaha, CREDIT Kas/Bank
   */
  private async onPayablePaid(eventData: {
    payableId: string;
    vendorName: string;
    amount: number;
    paymentDate: string;
  }) {
    try {
      console.log(`💸 Creating journal entry for payable.paid: ${eventData.vendorName}`);

      const accountsPayable = await this.getAccountByCode('2100'); // Utang Usaha
      const cashAccount = await this.getAccountByCode('1110'); // Kas/Bank

      if (!accountsPayable || !cashAccount) {
        throw new Error('Required accounts not found in Chart of Accounts');
      }

      const journalData = {
        transaction_date: eventData.paymentDate,
        description: `Pembayaran utang kepada ${eventData.vendorName}`,
        reference_type: 'PAYABLE_PAID',
        lines: [
          {
            account_id: accountsPayable.id,
            debit: eventData.amount,
            description: `Pengurangan utang kepada ${eventData.vendorName}`,
          },
          {
            account_id: cashAccount.id,
            credit: eventData.amount,
            description: `Pembayaran kepada ${eventData.vendorName}`,
          },
        ],
        created_by: 'system:auto-journal',
      };

      await journalEntriesService.createGeneralJournal(journalData);

      console.log(`✅ Journal entry created for payment to ${eventData.vendorName}`);
    } catch (error) {
      console.error('❌ Error creating journal entry for payable.paid:', error);
    }
  }

  /**
   * EVENT: material.issued
   * Triggered when material is issued to a project
   * Journal Entry: DEBIT Beban Proyek, CREDIT Persediaan
   */
  private async onMaterialIssued(eventData: {
    materialName: string;
    quantity: number;
    costPerUnit: number;
    totalCost: number;
    projectId?: string;
  }) {
    try {
      console.log(`📦 Creating journal entry for material.issued: ${eventData.materialName}`);

      const projectExpenseAccount = await this.getAccountByCode('5100'); // Beban Proyek
      const inventoryAccount = await this.getAccountByCode('1310'); // Persediaan Barang

      if (!projectExpenseAccount || !inventoryAccount) {
        throw new Error('Required accounts not found in Chart of Accounts');
      }

      const journalData = {
        transaction_date: new Date().toISOString().split('T')[0],
        description: `Pemakaian material: ${eventData.materialName} (${eventData.quantity} unit)`,
        reference_type: 'MATERIAL_ISSUED',
        lines: [
          {
            account_id: projectExpenseAccount.id,
            debit: eventData.totalCost,
            description: `Beban material ${eventData.materialName} untuk proyek`,
          },
          {
            account_id: inventoryAccount.id,
            credit: eventData.totalCost,
            description: `Pengurangan persediaan ${eventData.materialName}`,
          },
        ],
        created_by: 'system:auto-journal',
      };

      await journalEntriesService.createGeneralJournal(journalData);

      console.log(`✅ Journal entry created for material issuance: ${eventData.materialName}`);
    } catch (error) {
      console.error('❌ Error creating journal entry for material.issued:', error);
    }
  }

  /**
   * EVENT: payroll.approved
   * Triggered when payroll is approved
   * Journal Entry: DEBIT Beban Gaji, CREDIT Utang Gaji + Utang Pajak (PPh21)
   */
  private async onPayrollApproved(eventData: {
    payrollId: string;
    period: string;
    grossSalary: number;
    tax: number;
    netSalary: number;
  }) {
    try {
      console.log(`💼 Creating journal entry for payroll.approved: ${eventData.period}`);

      const salaryExpenseAccount = await this.getAccountByCode('5300'); // Beban Gaji
      const salaryPayableAccount = await this.getAccountByCode('2300'); // Utang Gaji
      const taxPayableAccount = await this.getAccountByCode('2310'); // Utang Pajak (PPh21)

      if (!salaryExpenseAccount || !salaryPayableAccount || !taxPayableAccount) {
        throw new Error('Required accounts not found in Chart of Accounts');
      }

      const journalData = {
        transaction_date: new Date().toISOString().split('T')[0],
        description: `Beban gaji periode ${eventData.period}`,
        reference_type: 'PAYROLL_APPROVED',
        lines: [
          {
            account_id: salaryExpenseAccount.id,
            debit: eventData.grossSalary,
            description: `Beban gaji karyawan periode ${eventData.period}`,
          },
          {
            account_id: salaryPayableAccount.id,
            credit: eventData.netSalary,
            description: `Utang gaji net kepada karyawan`,
          },
          {
            account_id: taxPayableAccount.id,
            credit: eventData.tax,
            description: `Utang pajak PPh21 periode ${eventData.period}`,
          },
        ],
        created_by: 'system:auto-journal',
      };

      await journalEntriesService.createGeneralJournal(journalData);
      console.log(`✅ Journal entry created for payroll: ${eventData.period}`);
    } catch (error) {
      console.error('❌ Error creating journal entry for payroll.approved:', error);
    }
  }

  /**
   * Helper: Get account by code
   */
  private async getAccountByCode(accountCode: string) {
    try {
      const accounts: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM "ChartOfAccounts" WHERE account_code = $1 LIMIT 1',
        accountCode
      );
      return accounts[0] || null;
    } catch (error) {
      console.error(`Error finding account ${accountCode}:`, error);
      return null;
    }
  }
}

// Singleton instance - LAZY LOADING to prevent crashes on import
let _financeEvents: FinanceEventEmitter | null = null;

export const getFinanceEvents = () => {
  if (!_financeEvents) {
    _financeEvents = new FinanceEventEmitter();
  }
  return _financeEvents;
};

// For backward compatibility
export const financeEvents = {
  emit: (...args: any[]) => getFinanceEvents().emit(...args),
  on: (...args: any[]) => getFinanceEvents().on(...args),
  once: (...args: any[]) => getFinanceEvents().once(...args),
  removeListener: (...args: any[]) => getFinanceEvents().removeListener(...args),
} as any;

export default financeEvents;
