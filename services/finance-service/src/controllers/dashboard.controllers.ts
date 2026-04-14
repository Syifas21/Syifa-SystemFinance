import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

/**
 * Get comprehensive finance dashboard data
 * GET /api/v1/dashboards/finance?period=month
 */
export const getFinanceDashboard = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as 'month' | 'quarter' | 'year') || 'month';

    console.log(`📊 [Dashboard Controller] Fetching dashboard for period: ${period}`);

    const dashboardData = await dashboardService.getFinanceDashboard(period);

    // Serialize BigInt values
    const serialized = JSON.parse(
      JSON.stringify(dashboardData, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    res.status(200).json({
      success: true,
      data: serialized,
      period,
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ [Dashboard Controller] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard',
      error: error.message,
    });
  }
};

/**
 * Get cash flow chart data only
 * GET /api/v1/dashboards/cash-flow?period=month
 */
export const getCashFlowChart = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as 'month' | 'quarter' | 'year') || 'month';

    const dashboardData = await dashboardService.getFinanceDashboard(period);

    res.status(200).json({
      success: true,
      data: dashboardData.cash_flow,
      period,
    });
  } catch (error: any) {
    console.error('❌ [Dashboard Controller] Cash Flow Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cash flow data',
      error: error.message,
    });
  }
};

/**
 * Get profitability chart data only
 * GET /api/v1/dashboards/profitability?period=month
 */
export const getProfitabilityChart = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as 'month' | 'quarter' | 'year') || 'month';

    const dashboardData = await dashboardService.getFinanceDashboard(period);

    res.status(200).json({
      success: true,
      data: dashboardData.profitability,
      period,
    });
  } catch (error: any) {
    console.error('❌ [Dashboard Controller] Profitability Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profitability data',
      error: error.message,
    });
  }
};
