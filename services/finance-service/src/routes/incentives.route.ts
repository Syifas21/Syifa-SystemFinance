import express from 'express';
import {
  simulateIncentive,
  batchSimulateIncentive,
  getIncentivePlans,
  getMetrics,
} from '../controllers/incentives.controllers';

const router = express.Router();

/**
 * Incentive Simulation Routes
 * Base path: /api/v1/incentives
 */

// POST /api/v1/incentives/simulate - Single incentive simulation
router.post('/simulate', simulateIncentive);

// POST /api/v1/incentives/simulate/batch - Batch simulation
router.post('/simulate/batch', batchSimulateIncentive);

// GET /api/v1/incentives/plans - Get incentive plan details
router.get('/plans', getIncentivePlans);

// GET /api/v1/incentives/metrics - Get available metrics
router.get('/metrics', getMetrics);

export default router;
