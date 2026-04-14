// Payables Controllers - Per TSD FITUR 3.4.B
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import payablesService from '../services/payables.service';

// Configure multer for payment proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payment-proofs/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadPaymentProof = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

/**
 * GET /api/finance/payables
 * Get all payables with filters
 */
export const getPayables = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, vendor_name, page, limit } = req.query;

    console.log('📊 Getting payables with filters:', { status, vendor_name, page, limit });

    const result = await payablesService.getAllPayables({
      status: status as string,
      vendor_name: vendor_name as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.status(200).json({
      success: true,
      message: 'Payables retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('❌ Error getting payables:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payables',
      error: error.message,
    });
  }
};

/**
 * GET /api/finance/payables/summary/ap
 * Get AP summary metrics
 */
export const getAPSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📊 Getting AP Summary...');
    const summary = await payablesService.getAPSummary();

    res.status(200).json({
      success: true,
      message: 'AP Summary retrieved successfully',
      data: summary,
    });
  } catch (error: any) {
    console.error('❌ Error getting AP Summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AP Summary',
      error: error.message,
    });
  }
};

/**
 * GET /api/finance/payables/aging
 * Get AP aging report (breakdown by age buckets)
 * SYNCHRONIZED WITH AR AGING CALCULATION
 */
export const getPayablesAging = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📊 Getting AP Aging Report...');
    const agingData = await payablesService.getAgingReport();

    res.status(200).json({
      success: true,
      message: 'AP aging report retrieved successfully',
      data: agingData,
    });
  } catch (error: any) {
    console.error('❌ Error getting AP aging report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AP aging report',
      error: error.message,
    });
  }
};

/**
 * POST /api/finance/payables
 * Create new payable (record vendor bill with 3-way matching)
 */
export const createPayable = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;

    console.log('📝 Creating payable:', data);

    // Validate required fields
    if (!data.vendor_invoice_number || !data.vendor_name || !data.invoice_date || !data.due_date || !data.total_amount) {
      res.status(400).json({
        success: false,
        message: 'vendor_invoice_number, vendor_name, invoice_date, due_date, and total_amount are required',
      });
      return;
    }

    // For manual entry without items, create default item
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      const subtotal = Number(data.total_amount) / 1.11;
      data.items = [{
        description: data.description || 'Manual Entry',
        quantity: 1,
        unit_price: subtotal,
        total: subtotal
      }];
    }

    // Set po_id to null or generate placeholder if not provided
    if (!data.po_id) {
      data.po_id = null;
    }

    const payable = await payablesService.createPayable(data);

    res.status(201).json({
      success: true,
      message: 'Payable created successfully',
      data: payable,
    });
  } catch (error: any) {
    console.error('❌ Error creating payable:', error);
    // Map known service errors to appropriate HTTP codes
    let statusCode = 500;
    if (error?.message?.includes('3-way matching')) statusCode = 400;
    if (error?.message?.includes('DUPLICATE_VENDOR_INVOICE') || /already exists|duplicate/i.test(error?.message || '')) statusCode = 409;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to create payable',
      error: error.message,
    });
  }
};

/**
 * POST /api/finance/payables/:id/payments
 * Record payment for payable with file upload
 */
export const recordPayablePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const paymentData = req.body;
    const uploadedFile = (req as any).file;

    console.log(`💰 Recording payment for payable ${id}:`, paymentData);
    console.log(`📎 Uploaded file:`, uploadedFile);

    // Validate required fields
    if (!paymentData.payment_date || !paymentData.amount) {
      res.status(400).json({
        success: false,
        message: 'payment_date and amount are required',
      });
      return;
    }

    // Add file info to payment data
    if (uploadedFile) {
      paymentData.payment_proof_url = uploadedFile.path;
      paymentData.payment_proof_filename = uploadedFile.originalname;
    }

    const result = await payablesService.recordPayment(id, paymentData);

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Error recording payment:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to record payment',
      error: error.message,
    });
  }
};
