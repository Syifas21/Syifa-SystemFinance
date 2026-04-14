import { Request, Response } from 'express';
import { incentiveService, SimulationInput } from '../services/incentives.service';

/**
 * Simulate incentive calculation
 * POST /api/v1/incentives/simulate
 */
export const simulateIncentive = async (req: Request, res: Response) => {
  try {
    const input: SimulationInput = req.body;

    console.log('🎯 [Incentive Controller] Simulating incentive:', input);

    // Validate required fields
    if (!input.role || !input.metric || input.achieved_value === undefined || input.target_value === undefined || !input.period) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: role, metric, achieved_value, target_value, period',
      });
    }

    // Validate target value is not zero
    if (input.target_value === 0) {
      return res.status(400).json({
        success: false,
        message: 'Target value cannot be zero',
      });
    }

    const result = incentiveService.simulateIncentive(input);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Simulation completed successfully',
    });
  } catch (error: any) {
    console.error('❌ [Incentive Controller] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to simulate incentive',
      error: error.message,
    });
  }
};

/**
 * Batch simulate multiple incentives
 * POST /api/v1/incentives/simulate/batch
 */
export const batchSimulateIncentive = async (req: Request, res: Response) => {
  try {
    const inputs: SimulationInput[] = req.body.simulations;

    console.log(`🎯 [Incentive Controller] Batch simulating ${inputs?.length || 0} incentives`);

    if (!Array.isArray(inputs) || inputs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: expected array of simulations',
      });
    }

    const results = incentiveService.batchSimulate(inputs);

    res.status(200).json({
      success: true,
      data: results,
      count: results.length,
      message: 'Batch simulation completed successfully',
    });
  } catch (error: any) {
    console.error('❌ [Incentive Controller] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to batch simulate incentives',
      error: error.message,
    });
  }
};

/**
 * Get incentive plan details
 * GET /api/v1/incentives/plans
 */
export const getIncentivePlans = async (req: Request, res: Response) => {
  try {
    const plans = incentiveService.getIncentivePlans();

    res.status(200).json({
      success: true,
      data: plans,
      count: plans.length,
    });
  } catch (error: any) {
    console.error('❌ [Incentive Controller] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incentive plans',
      error: error.message,
    });
  }
};

/**
 * Get available metrics
 * GET /api/v1/incentives/metrics
 */
export const getMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = incentiveService.getMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  } catch (error: any) {
    console.error('❌ [Incentive Controller] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics',
      error: error.message,
    });
  }
};
