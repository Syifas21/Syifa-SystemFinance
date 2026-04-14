import express from 'express';
import {
  getFinanceDashboard,
  getCashFlowChart,
  getProfitabilityChart,
} from '../controllers/dashboard.controllers';

const router = express.Router();

/**
 * Finance Dashboard Routes
 * Base path: /api/v1/dashboards
 */

// GET /api/v1/dashboards/finance - Comprehensive dashboard data
router.get('/finance', getFinanceDashboard);

// GET /api/v1/dashboards/cash-flow - Cash flow chart data
router.get('/cash-flow', getCashFlowChart);

// GET /api/v1/dashboards/profitability - Profitability chart data
router.get('/profitability', getProfitabilityChart);

export default router;
