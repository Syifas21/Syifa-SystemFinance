/**
 * AR (Accounts Receivable) Controller
 */

import { Request, Response } from 'express';
import arService from '../services/ar.service';

class ARController {
  /**
   * GET /api/finance/ar/summary
   * Get comprehensive AR summary
   */
  async getARSummary(req: Request, res: Response) {
    try {
      const summary = await arService.getARSummary();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Error in getARSummary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get AR summary',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/finance/ar/aging
   * Get AR aging report
   */
  async getAgingReport(req: Request, res: Response) {
    try {
      console.log('📊 [AR Controller] Executing getAgingReport endpoint');
      const report = await arService.getAgingReport();
      
      // Validate response
      if (!Array.isArray(report)) {
        console.warn('⚠️ [AR Controller] getAgingReport returned non-array:', typeof report);
        return res.status(200).json({
          success: true,
          data: Array.isArray(report) ? report : [],
          warning: 'Response was not an array, converted to empty array',
        });
      }

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('❌ [AR Controller] Error in getAgingReport:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get aging report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { meta: error.meta }),
      });
    }
  }

  /**
   * GET /api/finance/ar/top-customers
   * Get top customers by outstanding amount
   */
  async getTopCustomers(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const customers = await arService.getTopCustomers(limit);
      res.status(200).json({
        success: true,
        data: customers,
      });
    } catch (error: any) {
      console.error('Error in getTopCustomers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get top customers',
        error: error.message,
      });
    }
  }
}

export default new ARController();
