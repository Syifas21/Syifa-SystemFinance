/**
 * Routes for Milestone Invoice Generation
 * Manual triggers and preview endpoints
 * Per TSD FITUR 3.4.A - FIN-09
 */

import express, { Request, Response } from 'express';
import milestoneInvoiceService from '../services/milestone-invoice.service';
import { triggerMilestoneInvoiceGeneration } from '../cron/finance-cron';

const router = express.Router();

/**
 * GET /api/milestone-invoices/ready
 * Get list of milestones ready for invoicing (preview)
 */
router.get('/ready', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📋 Getting milestones ready for invoicing...');
    
    const milestones = await milestoneInvoiceService.getReadyMilestones();
    
    res.status(200).json({
      success: true,
      message: 'Daftar milestone siap untuk di-invoice',
      count: milestones.length,
      data: milestones,
    });
  } catch (error: any) {
    console.error('Error getting ready milestones:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data milestone',
      error: error.message,
    });
  }
});

/**
 * POST /api/milestone-invoices/generate
 * Manual trigger for auto-generation (run CRON job manually)
 */
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔧 Manual trigger: Generating invoices from milestones...');
    
    const result = await triggerMilestoneInvoiceGeneration();
    
    res.status(200).json({
      success: result.success,
      message: result.success 
        ? `Berhasil generate ${result.invoicesGenerated} invoice dari milestone` 
        : 'Proses selesai dengan error',
      data: {
        invoicesGenerated: result.invoicesGenerated,
        invoices: result.invoices,
        errors: result.errors,
      },
    });
  } catch (error: any) {
    console.error('Error generating invoices from milestones:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat generate invoice',
      error: error.message,
    });
  }
});

/**
 * POST /api/milestone-invoices/generate/:milestoneId
 * Generate invoice for specific milestone (manual single generation)
 */
router.post('/generate/:milestoneId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { milestoneId } = req.params;
    
    console.log(`🔧 Manual trigger: Generating invoice for milestone ${milestoneId}...`);
    
    const result = await milestoneInvoiceService.generateInvoiceForMilestone(milestoneId);
    
    res.status(201).json({
      success: true,
      message: 'Invoice berhasil dibuat dari milestone',
      data: result,
    });
  } catch (error: any) {
    console.error('Error generating invoice for milestone:', error);
    
    const statusCode = 
      error.message.includes('not found') ? 404 :
      error.message.includes('already generated') ? 409 :
      error.message.includes('value is not set') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: error.message,
    });
  }
});

export default router;
