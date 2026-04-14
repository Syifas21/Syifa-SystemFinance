// ============================================
// PROJECT FINANCE - Email Testing Routes
// ============================================

import { Router, Request, Response } from 'express';
import { emailService } from '../services/email-notification.service';
import { verifyToken } from '../middlewares/auth.middlewares';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// ============================================
// Test Email Configuration
// ============================================

router.post('/test', async (req: Request, res: Response) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email address (to) is required',
      });
    }

    const result = await emailService.sendTestEmail(to);

    res.json(result);
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
    });
  }
});

// ============================================
// Send Invoice Email
// ============================================

router.post('/invoice', async (req: Request, res: Response) => {
  try {
    const { to, invoiceNumber, customerName, amount, dueDate, invoiceUrl } = req.body;

    if (!to || !invoiceNumber || !customerName || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const result = await emailService.sendInvoiceEmail({
      to,
      invoiceNumber,
      customerName,
      amount: parseFloat(amount),
      dueDate,
      invoiceUrl,
    });

    res.json(result);
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice email',
    });
  }
});

// ============================================
// Send Payment Reminder
// ============================================

router.post('/reminder', async (req: Request, res: Response) => {
  try {
    const { to, invoiceNumber, customerName, amount, dueDate, daysOverdue } = req.body;

    if (!to || !invoiceNumber || !customerName || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const result = await emailService.sendPaymentReminder({
      to,
      invoiceNumber,
      customerName,
      amount: parseFloat(amount),
      dueDate,
      daysOverdue: daysOverdue ? parseInt(daysOverdue) : undefined,
    });

    res.json(result);
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment reminder',
    });
  }
});

// ============================================
// Send Payment Confirmation
// ============================================

router.post('/payment-confirmation', async (req: Request, res: Response) => {
  try {
    const { to, invoiceNumber, customerName, amount, paymentDate, paymentMethod } = req.body;

    if (!to || !invoiceNumber || !customerName || !amount || !paymentDate || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const result = await emailService.sendPaymentConfirmation({
      to,
      invoiceNumber,
      customerName,
      amount: parseFloat(amount),
      paymentDate,
      paymentMethod,
    });

    res.json(result);
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send payment confirmation',
    });
  }
});

// ============================================
// Check Email Configuration Status
// ============================================

router.get('/status', async (req: Request, res: Response) => {
  const isConfigured = emailService.isEmailConfigured();
  
  res.json({
    success: true,
    configured: isConfigured,
    message: isConfigured 
      ? 'Email service is configured and ready'
      : 'Email service not configured. Using simulation mode.',
  });
});

export default router;
