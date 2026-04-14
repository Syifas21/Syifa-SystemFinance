// AR (Accounts Receivable) Routes
import { Router } from 'express';
import arController from '../controllers/ar.controller';

const router = Router();

/**
 * @route   GET /api/finance/ar/summary
 * @desc    Get comprehensive AR summary with real-time data
 * @access  Finance Team
 */
router.get('/summary', arController.getARSummary);

/**
 * @route   GET /api/finance/ar/aging
 * @desc    Get AR aging report (breakdown by age buckets)
 * @access  Finance Team
 */
router.get('/aging', arController.getAgingReport);

/**
 * @route   GET /api/finance/ar/top-customers
 * @desc    Get top customers by outstanding amount
 * @query   limit (default: 10)
 * @access  Finance Team
 */
router.get('/top-customers', arController.getTopCustomers);

export default router;
