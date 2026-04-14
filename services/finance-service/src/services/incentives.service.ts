// Incentive Simulation Service
// Handles calculation of various incentive schemes based on KPIs

export interface SimulationInput {
  employee_name?: string;
  role: string;
  metric: 'REVENUE' | 'PROFIT_MARGIN' | 'PROJECTS_COMPLETED' | 'CUSTOMER_SATISFACTION' | 'COST_SAVINGS';
  achieved_value: number;
  target_value: number;
  base_salary?: number;
  period: string; // e.g., "2025-11"
}

export interface SimulationResult {
  employee_name?: string;
  role: string;
  metric: string;
  achieved_value: number;
  target_value: number;
  achievement_percentage: number;
  incentive_amount: number;
  incentive_percentage: number;
  tier: string;
  calculation_details: {
    formula: string;
    breakdown: string;
  };
  period: string;
  simulated_at: string;
}

class IncentiveService {
  /**
   * Simulate incentive calculation based on achievement
   * Uses tiered calculation: 0-80% = 0%, 80-100% = 5%, 100-120% = 10%, 120%+ = 15%
   */
  simulateIncentive(input: SimulationInput): SimulationResult {
    console.log('🎯 [Incentive Service] Simulating incentive calculation:', input);

    // Calculate achievement percentage
    const achievementPercentage = (input.achieved_value / input.target_value) * 100;

    // Determine tier and incentive percentage
    let tier: string;
    let incentivePercentage: number;

    if (achievementPercentage < 80) {
      tier = 'Below Threshold';
      incentivePercentage = 0;
    } else if (achievementPercentage < 100) {
      tier = 'Good Performance';
      incentivePercentage = 5;
    } else if (achievementPercentage < 120) {
      tier = 'Excellent Performance';
      incentivePercentage = 10;
    } else {
      tier = 'Outstanding Performance';
      incentivePercentage = 15;
    }

    // Calculate incentive amount
    // If base_salary provided, calculate from salary; otherwise from achieved value
    let incentiveAmount: number;
    let formula: string;
    let breakdown: string;

    if (input.base_salary) {
      incentiveAmount = (input.base_salary * incentivePercentage) / 100;
      formula = `Incentive = Base Salary × Incentive %`;
      breakdown = `Rp ${input.base_salary.toLocaleString('id-ID')} × ${incentivePercentage}% = Rp ${incentiveAmount.toLocaleString('id-ID')}`;
    } else {
      // Calculate from achieved value (for revenue-based incentives)
      incentiveAmount = (input.achieved_value * incentivePercentage) / 100;
      formula = `Incentive = Achieved Value × Incentive %`;
      breakdown = `Rp ${input.achieved_value.toLocaleString('id-ID')} × ${incentivePercentage}% = Rp ${incentiveAmount.toLocaleString('id-ID')}`;
    }

    const result: SimulationResult = {
      employee_name: input.employee_name,
      role: input.role,
      metric: input.metric,
      achieved_value: input.achieved_value,
      target_value: input.target_value,
      achievement_percentage: Math.round(achievementPercentage * 100) / 100,
      incentive_amount: Math.round(incentiveAmount),
      incentive_percentage: incentivePercentage,
      tier,
      calculation_details: {
        formula,
        breakdown,
      },
      period: input.period,
      simulated_at: new Date().toISOString(),
    };

    console.log('✅ [Incentive Service] Simulation result:', result);

    return result;
  }

  /**
   * Batch simulate for multiple employees
   */
  batchSimulate(inputs: SimulationInput[]): SimulationResult[] {
    console.log(`🎯 [Incentive Service] Batch simulating ${inputs.length} incentives`);
    return inputs.map((input) => this.simulateIncentive(input));
  }

  /**
   * Get incentive plan details (reference data)
   */
  getIncentivePlans() {
    return [
      {
        plan_name: 'Sales Incentive Plan',
        applies_to_role: 'SALES',
        metric: 'REVENUE',
        tiers: [
          { min: 0, max: 80, incentive: '0%' },
          { min: 80, max: 100, incentive: '5%' },
          { min: 100, max: 120, incentive: '10%' },
          { min: 120, max: null, incentive: '15%' },
        ],
        description: 'Insentif berdasarkan pencapaian target revenue',
      },
      {
        plan_name: 'Project Manager Incentive',
        applies_to_role: 'PROJECT_MANAGER',
        metric: 'PROFIT_MARGIN',
        tiers: [
          { min: 0, max: 80, incentive: '0%' },
          { min: 80, max: 100, incentive: '5%' },
          { min: 100, max: 120, incentive: '10%' },
          { min: 120, max: null, incentive: '15%' },
        ],
        description: 'Insentif berdasarkan profit margin proyek',
      },
      {
        plan_name: 'Finance Team Incentive',
        applies_to_role: 'FINANCE_ADMIN',
        metric: 'COST_SAVINGS',
        tiers: [
          { min: 0, max: 80, incentive: '0%' },
          { min: 80, max: 100, incentive: '5%' },
          { min: 100, max: 120, incentive: '10%' },
          { min: 120, max: null, incentive: '15%' },
        ],
        description: 'Insentif berdasarkan cost savings yang dicapai',
      },
    ];
  }

  /**
   * Get available metrics
   */
  getMetrics() {
    return [
      { value: 'REVENUE', label: 'Revenue (Pendapatan)', unit: 'IDR' },
      { value: 'PROFIT_MARGIN', label: 'Profit Margin', unit: '%' },
      { value: 'PROJECTS_COMPLETED', label: 'Projects Completed', unit: 'projects' },
      { value: 'CUSTOMER_SATISFACTION', label: 'Customer Satisfaction', unit: 'score' },
      { value: 'COST_SAVINGS', label: 'Cost Savings', unit: 'IDR' },
    ];
  }
}

export const incentiveService = new IncentiveService();
