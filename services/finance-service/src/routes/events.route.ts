import { Router, Request, Response } from 'express';
import { journalEvents } from '../services/journalEventListener';

/**
 * MIN-139 [FIN-12]
 * HTTP Endpoints untuk menerima events dari service lain
 * untuk trigger auto-journal entries
 */

const router = Router();

/**
 * POST /api/events/material-issued
 * Event dari Inventory Service saat material dikeluarkan
 */
router.post('/material-issued', (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.reference_id || !data.material_name || !data.quantity || !data.total_cost) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: reference_id, material_name, quantity, total_cost'
      });
    }

    // Emit event
    journalEvents.emit('material.issued', data);
    
    console.log(`📦 Material issued event received: ${data.material_name} - ${data.total_cost}`);
    
    res.json({
      success: true,
      message: 'Material issued event processed, journal entry will be created'
    });
  } catch (error: any) {
    console.error('❌ Error processing material.issued event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process event',
      error: error.message
    });
  }
});

/**
 * POST /api/events/invoice-sent
 * Event dari CRM/Sales Service saat invoice dikirim
 */
router.post('/invoice-sent', (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.invoice_id || !data.invoice_number || !data.total_amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: invoice_id, invoice_number, total_amount'
      });
    }

    // Emit event
    journalEvents.emit('invoice.sent', data);
    
    console.log(`📄 Invoice sent event received: ${data.invoice_number} - ${data.total_amount}`);
    
    res.json({
      success: true,
      message: 'Invoice sent event processed, journal entry will be created'
    });
  } catch (error: any) {
    console.error('❌ Error processing invoice.sent event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process event',
      error: error.message
    });
  }
});

/**
 * POST /api/events/purchase-approved
 * Event dari Procurement Service saat PO disetujui
 */
router.post('/purchase-approved', (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.po_id || !data.po_number || !data.total_amount || !data.purchase_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: po_id, po_number, total_amount, purchase_type'
      });
    }

    // Validate purchase_type
    if (!['INVENTORY', 'EXPENSE'].includes(data.purchase_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid purchase_type. Must be INVENTORY or EXPENSE'
      });
    }

    // Emit event
    journalEvents.emit('purchase.approved', data);
    
    console.log(`🛒 Purchase approved event received: ${data.po_number} - ${data.total_amount}`);
    
    res.json({
      success: true,
      message: 'Purchase approved event processed, journal entry will be created'
    });
  } catch (error: any) {
    console.error('❌ Error processing purchase.approved event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process event',
      error: error.message
    });
  }
});

/**
 * POST /api/events/expense-recorded
 * Event dari HR/Finance Service saat expense dicatat
 */
router.post('/expense-recorded', (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.expense_id || !data.description || !data.amount || !data.payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: expense_id, description, amount, payment_method'
      });
    }

    // Emit event
    journalEvents.emit('expense.recorded', data);
    
    console.log(`💸 Expense recorded event received: ${data.description} - ${data.amount}`);
    
    res.json({
      success: true,
      message: 'Expense recorded event processed, journal entry will be created'
    });
  } catch (error: any) {
    console.error('❌ Error processing expense.recorded event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process event',
      error: error.message
    });
  }
});

/**
 * GET /api/events/status
 * Check event listener status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Event listeners are active',
    events: [
      'material.issued',
      'invoice.sent',
      'payment.received (auto)',
      'purchase.approved',
      'expense.recorded'
    ],
    timestamp: new Date().toISOString()
  });
});

export default router;
