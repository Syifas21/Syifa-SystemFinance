import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { journalEvents } from '../services/journalEventListener';

const router = Router();
const prisma = new PrismaClient();


router.post('/:id/payments', async (req: Request, res: Response) => {
  try {
    const { id: invoiceId } = req.params;
    const {
      payment_date,
      amount,
      payment_method,
      reference_number,
      notes,
      bank_name,
      account_number
    } = req.body;

    // Validasi input required
    if (!payment_date || !amount) {
      return res.status(400).json({
        success: false,
        message: 'payment_date and amount are required'
      });
    }

    // Cek apakah invoice exists
    const invoice = await prisma.invoices.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Validasi amount tidak boleh melebihi remaining
    const currentRemaining = parseFloat(invoice.remaining_amount?.toString() || invoice.total_amount.toString());
    const paymentAmount = parseFloat(amount);

    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      });
    }

    if (paymentAmount > currentRemaining) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${paymentAmount}) exceeds remaining balance (${currentRemaining})`
      });
    }

    // Hitung paid_amount dan remaining_amount baru
    const currentPaid = parseFloat(invoice.paid_amount?.toString() || '0');
    const newPaidAmount = currentPaid + paymentAmount;
    const newRemainingAmount = currentRemaining - paymentAmount;

    // Tentukan status baru invoice
    let newStatus = invoice.status;
    if (newRemainingAmount === 0) {
      newStatus = 'PAID';
    } else if (newStatus === 'DRAFT') {
      newStatus = 'SENT'; // Kalau ada pembayaran, minimal jadi SENT
    }

    // Update invoice dengan transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Insert payment record ke invoice_payments table
      const paymentRecord = await tx.invoice_payments.create({
        data: {
          invoice_id: invoiceId,
          payment_date: new Date(payment_date),
          payment_amount: paymentAmount,
          payment_method: payment_method || 'TRANSFER',
          reference_number: reference_number || null,
          notes: notes || null,
          created_by: 'system' // TODO: Get from authenticated user
        }
      });

      // 2. Update invoice
      const updatedInvoice = await tx.invoices.update({
        where: { id: invoiceId },
        data: {
          paid_amount: newPaidAmount,
          remaining_amount: newRemainingAmount,
          status: newStatus,
          updated_at: new Date()
        }
      });

      // 3. Create journal entry (Debit: Cash/Bank, Credit: Account Receivable)
      // Get Chart of Accounts
      const cashAccount = await tx.chartOfAccounts.findFirst({
        where: { 
          account_code: { startsWith: '1-1-1' }, // Kas/Bank
          account_type: 'Asset'
        }
      });

      const arAccount = await tx.chartOfAccounts.findFirst({
        where: { 
          account_code: { startsWith: '1-1' }, // Piutang Usaha
          account_type: 'Asset'
        }
      });

      if (cashAccount && arAccount) {
        // Debit: Cash/Bank (increase asset)
        await tx.journal_entries.create({
          data: {
            transaction_date: new Date(payment_date),
            description: `Pembayaran invoice ${invoice.invoice_number} - ${payment_method}`,
            account_id: cashAccount.id,
            debit: paymentAmount,
            credit: 0,
            reference_id: paymentRecord.id,
            reference_type: 'PAYMENT',
            created_by: 'system'
          }
        });

        // Credit: Account Receivable (decrease asset)
        await tx.journal_entries.create({
          data: {
            transaction_date: new Date(payment_date),
            description: `Pembayaran invoice ${invoice.invoice_number} - ${payment_method}`,
            account_id: arAccount.id,
            debit: 0,
            credit: paymentAmount,
            reference_id: paymentRecord.id,
            reference_type: 'PAYMENT',
            created_by: 'system'
          }
        });

        console.log(`📝 Journal entries created for payment ${paymentRecord.id}`);
      }
      
      return { invoice: updatedInvoice, payment: paymentRecord };
    });

    console.log(`✅ Payment recorded for invoice ${invoice.invoice_number}: ${paymentAmount}`);

    // Emit event untuk auto-journal (MIN-139)
    journalEvents.emit('payment.received', {
      payment_id: result.payment.id,
      invoice_number: invoice.invoice_number,
      amount: paymentAmount,
      payment_method: payment_method || 'TRANSFER',
      payment_date: new Date(payment_date),
      created_by: 'system'
    });

    res.json({
      success: true,
      message: 'Payment recorded successfully and journal entries created',
      data: {
        payment_id: result.payment.id,
        invoice_id: result.invoice.id,
        invoice_number: result.invoice.invoice_number,
        payment_amount: paymentAmount,
        paid_amount: result.invoice.paid_amount,
        remaining_amount: result.invoice.remaining_amount,
        status: result.invoice.status,
        payment_date,
        reference_number: result.payment.reference_number
      }
    });

  } catch (error: any) {
    console.error('❌ Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment',
      error: error.message
    });
  }
});

export default router;
