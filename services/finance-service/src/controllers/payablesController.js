const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * MIN-140: Accounts Payable Management Controller
 * Handles vendor payables recording and payment processing
 */

// Get all payables with filters
exports.getAllPayables = async (req, res) => {
  try {
    const { status, vendor_name, from_date, to_date, overdue_only } = req.query;

    const where = {};
    
    if (status) where.status = status;
    if (vendor_name) where.vendor_name = { contains: vendor_name, mode: 'insensitive' };
    if (from_date || to_date) {
      where.invoice_date = {};
      if (from_date) where.invoice_date.gte = new Date(from_date);
      if (to_date) where.invoice_date.lte = new Date(to_date);
    }
    if (overdue_only === 'true') {
      where.status = 'OVERDUE';
      where.due_date = { lt: new Date() };
    }

    const payables = await prisma.payables.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        payments: {
          orderBy: { payment_date: 'desc' }
        },
        items: true
      }
    });

    // Calculate remaining amounts
    const enrichedPayables = payables.map(payable => {
      const totalPaid = payable.payments.reduce((sum, p) => sum + Number(p.payment_amount), 0);
      const remainingAmount = Number(payable.total_amount) - totalPaid;
      
      // Auto-update status
      let status = payable.status;
      if (remainingAmount <= 0) {
        status = 'PAID';
      } else if (new Date(payable.due_date) < new Date() && status !== 'PAID') {
        status = 'OVERDUE';
      }

      return {
        ...payable,
        paid_amount: totalPaid,
        remaining_amount: remainingAmount,
        status
      };
    });

    res.json({
      success: true,
      data: enrichedPayables,
      total: enrichedPayables.length
    });
  } catch (error) {
    console.error('Error fetching payables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payables',
      error: error.message
    });
  }
};

// Get single payable by ID
exports.getPayableById = async (req, res) => {
  try {
    const { id } = req.params;

    const payable = await prisma.payables.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { payment_date: 'desc' }
        },
        items: true
      }
    });

    if (!payable) {
      return res.status(404).json({
        success: false,
        message: 'Payable not found'
      });
    }

    const totalPaid = payable.payments.reduce((sum, p) => sum + Number(p.payment_amount), 0);
    const remainingAmount = Number(payable.total_amount) - totalPaid;

    res.json({
      success: true,
      data: {
        ...payable,
        paid_amount: totalPaid,
        remaining_amount: remainingAmount
      }
    });
  } catch (error) {
    console.error('Error fetching payable:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payable',
      error: error.message
    });
  }
};

// Create new payable (manual entry)
exports.createPayable = async (req, res) => {
  try {
    const {
      vendor_invoice_number,
      invoice_date,
      due_date,
      vendor_name,
      vendor_npwp,
      description,
      total_amount,
      items,
      po_id,
      currency = 'IDR'
    } = req.body;

    // Validation
    if (!vendor_invoice_number || !invoice_date || !due_date || !vendor_name || !total_amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vendor_invoice_number, invoice_date, due_date, vendor_name, total_amount'
      });
    }

    // Check duplicate invoice number
    const existing = await prisma.payables.findFirst({
      where: {
        vendor_invoice_number,
        vendor_name
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate invoice number for this vendor'
      });
    }

    // Calculate subtotal and tax
    const subtotal = Number(total_amount) / 1.11; // Reverse calculate assuming 11% tax included
    const taxAmount = Number(total_amount) - subtotal;

    // Create payable with items
    const payable = await prisma.payables.create({
      data: {
        po_id: po_id || null, // Optional - untuk manual input bisa null
        vendor_invoice_number,
        invoice_date: new Date(invoice_date),
        due_date: new Date(due_date),
        vendor_name,
        vendor_npwp: vendor_npwp || null,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: Number(total_amount),
        paid_amount: 0,
        status: 'PENDING',
        items: items && items.length > 0 ? {
          create: items.map(item => ({
            item_description: item.description || description || 'Manual Entry',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || subtotal,
            total_price: item.total || subtotal
          }))
        } : undefined
      },
      include: {
        items: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Payable created successfully',
      data: payable
    });
  } catch (error) {
    console.error('Error creating payable:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payable',
      error: error.message
    });
  }
};

// Bulk create payables from CSV
exports.bulkCreatePayables = async (req, res) => {
  try {
    const { payables } = req.body;

    if (!Array.isArray(payables) || payables.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payables data'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const item of payables) {
      try {
        // Check duplicate
        const existing = await prisma.payables.findFirst({
          where: {
            vendor_invoice_number: item.vendor_invoice_number,
            vendor_name: item.vendor_name
          }
        });

        if (existing) {
          results.failed.push({
            invoice: item.vendor_invoice_number,
            reason: 'Duplicate invoice'
          });
          continue;
        }

        const payable = await prisma.payables.create({
          data: {
            vendor_invoice_number: item.vendor_invoice_number,
            invoice_date: new Date(item.invoice_date),
            due_date: new Date(item.due_date),
            vendor_name: item.vendor_name,
            vendor_npwp: item.vendor_npwp || null,
            description: item.description || '',
            total_amount: Number(item.total_amount),
            currency: item.currency || 'IDR',
            status: 'PENDING'
          }
        });

        results.success.push(payable);
      } catch (error) {
        results.failed.push({
          invoice: item.vendor_invoice_number,
          reason: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Imported ${results.success.length} payables, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    console.error('Error bulk creating payables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk create payables',
      error: error.message
    });
  }
};

// Process payment for a payable
exports.processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      payment_date,
      amount,
      payment_method,
      reference_number,
      notes
    } = req.body;

    // Validation
    if (!payment_date || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment fields'
      });
    }

    // Get payable with payments
    const payable = await prisma.payables.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (!payable) {
      return res.status(404).json({
        success: false,
        message: 'Payable not found'
      });
    }

    // Calculate remaining amount
    const totalPaid = payable.payments.reduce((sum, p) => sum + Number(p.payment_amount), 0);
    const remainingAmount = Number(payable.total_amount) - totalPaid;

    if (Number(amount) > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining amount (${remainingAmount})`
      });
    }

    // Create payment record
    const payment = await prisma.payable_payments.create({
      data: {
        payable_id: id,
        payment_date: new Date(payment_date),
        payment_amount: Number(amount),
        payment_method,
        reference_number: reference_number || null,
        notes: notes || null
      }
    });

    // Update payable status
    const newTotalPaid = totalPaid + Number(amount);
    const newRemainingAmount = Number(payable.total_amount) - newTotalPaid;
    
    const newStatus = newRemainingAmount <= 0 ? 'PAID' : 'APPROVED';

    await prisma.payables.update({
      where: { id },
      data: { status: newStatus }
    });

    // Create journal entry for payment
    await createPaymentJournalEntry({
      payable,
      payment,
      newRemainingAmount
    });

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        payment,
        remaining_amount: newRemainingAmount,
        status: newStatus
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

// Update payable status (approve/reject)
exports.updatePayableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'APPROVED', 'PAID', 'OVERDUE', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const payable = await prisma.payables.update({
      where: { id },
      data: { status }
    });

    res.json({
      success: true,
      message: 'Payable status updated',
      data: payable
    });
  } catch (error) {
    console.error('Error updating payable status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payable status',
      error: error.message
    });
  }
};

// Get payable summary/statistics
exports.getPayableSummary = async (req, res) => {
  try {
    const allPayables = await prisma.payables.findMany({
      include: {
        payments: true
      }
    });

    let totalPayable = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let totalPaid = 0;

    allPayables.forEach(payable => {
      const paidAmount = payable.payments.reduce((sum, p) => sum + Number(p.payment_amount), 0);
      const remainingAmount = Number(payable.total_amount) - paidAmount;

      if (payable.status === 'PAID') {
        totalPaid += paidAmount;
      } else {
        totalPayable += remainingAmount;
        
        if (payable.status === 'PENDING') {
          totalPending += remainingAmount;
        }
        
        if (payable.status === 'OVERDUE' || new Date(payable.due_date) < new Date()) {
          totalOverdue += remainingAmount;
        }
      }
    });

    res.json({
      success: true,
      data: {
        total_payable: totalPayable,
        total_pending: totalPending,
        total_overdue: totalOverdue,
        total_paid: totalPaid,
        count: {
          total: allPayables.length,
          pending: allPayables.filter(p => p.status === 'PENDING').length,
          overdue: allPayables.filter(p => p.status === 'OVERDUE').length,
          paid: allPayables.filter(p => p.status === 'PAID').length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payable summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payable summary',
      error: error.message
    });
  }
};

// Helper: Create journal entry for payment
async function createPaymentJournalEntry({ payable, payment, newRemainingAmount }) {
  try {
    // Journal Entry for AP Payment:
    // DR: Accounts Payable (2100) - decrease liability
    // CR: Cash/Bank (1100) - decrease asset

    const entries = [
      {
        account_code: '2100',
        account_name: 'Accounts Payable',
        debit: Number(payment.payment_amount),
        credit: 0,
        description: `Payment to ${payable.vendor_name} - ${payable.vendor_invoice_number}`
      },
      {
        account_code: '1100',
        account_name: 'Cash/Bank',
        debit: 0,
        credit: Number(payment.payment_amount),
        description: `Payment to ${payable.vendor_name} - ${payment.payment_method}`
      }
    ];

    await prisma.journalEntry.create({
      data: {
        entry_date: payment.payment_date,
        reference_type: 'AP_PAYMENT',
        reference_id: payment.id,
        description: `Payment for ${payable.vendor_invoice_number}`,
        total_debit: Number(payment.payment_amount),
        total_credit: Number(payment.payment_amount),
        status: 'POSTED',
        details: {
          create: entries
        }
      }
    });
  } catch (error) {
    console.error('Error creating payment journal entry:', error);
    // Don't throw - payment still successful even if journal fails
  }
}

module.exports = exports;
