/**
 * Margin Policy Exception Handler
 * TDD-014: Exception handling for tender, strategic customers, and bulk orders
 */

export interface ExceptionContext {
  is_tender?: boolean;
  is_strategic_customer?: boolean;
  is_bulk_order?: boolean;
  order_value?: number;
  customer_id?: string;
  customer_name?: string;
}

export interface ExceptionResult {
  allowed: boolean;
  adjusted_min_margin: number;
  adjusted_max_margin: number;
  exception_type: string | null;
  tolerance_applied: number;
  notes: string[];
}

// Constants from TDD-014
const BULK_ORDER_THRESHOLD = 5_000_000; // Rp 5M
const TENDER_TOLERANCE = -5.0; // -5% from minimum
const STRATEGIC_CUSTOMER_TOLERANCE = -4.0; // -4% from minimum
const BULK_ORDER_BONUS = 3.0; // +3% above maximum

// Strategic customer whitelist (should be loaded from database in production)
const STRATEGIC_CUSTOMERS = [
  'TELKOM',
  'PLN',
  'PERTAMINA',
  'BUMN',
  'WIKA',
  'ADHI KARYA',
  'WASKITA',
];

/**
 * Validate margin with exception handling
 * Returns adjusted margins based on exception context
 */
export function applyMarginExceptions(
  base_min_margin: number,
  base_max_margin: number,
  applied_margin: number,
  context: ExceptionContext
): ExceptionResult {
  const result: ExceptionResult = {
    allowed: false,
    adjusted_min_margin: base_min_margin,
    adjusted_max_margin: base_max_margin,
    exception_type: null,
    tolerance_applied: 0,
    notes: [],
  };

  // Check tender exception (-5%)
  if (context.is_tender) {
    result.adjusted_min_margin = base_min_margin + TENDER_TOLERANCE;
    result.exception_type = 'TENDER';
    result.tolerance_applied = TENDER_TOLERANCE;
    result.notes.push(
      `Tender exception: Minimum margin reduced by 5% (from ${base_min_margin.toFixed(2)}% to ${result.adjusted_min_margin.toFixed(2)}%)`
    );
    result.notes.push('⚠️ CEO approval required for margins below standard minimum');
  }

  // Check strategic customer exception (-4%)
  if (context.is_strategic_customer || isStrategicCustomer(context.customer_name)) {
    const strategic_adjustment = Math.max(STRATEGIC_CUSTOMER_TOLERANCE, result.tolerance_applied);
    result.adjusted_min_margin = base_min_margin + strategic_adjustment;
    result.exception_type = result.exception_type ? 'TENDER_STRATEGIC' : 'STRATEGIC_CUSTOMER';
    result.tolerance_applied = strategic_adjustment;
    result.notes.push(
      `Strategic customer exception: Minimum margin reduced by 4% (from ${base_min_margin.toFixed(2)}% to ${result.adjusted_min_margin.toFixed(2)}%)`
    );
    result.notes.push(`Customer: ${context.customer_name || 'Strategic BUMN/SOE'}`);
  }

  // Check bulk order exception (+3% max)
  const order_value = context.order_value || 0;
  if (context.is_bulk_order || order_value >= BULK_ORDER_THRESHOLD) {
    result.adjusted_max_margin = base_max_margin + BULK_ORDER_BONUS;
    result.exception_type = result.exception_type
      ? result.exception_type + '_BULK'
      : 'BULK_ORDER';
    result.notes.push(
      `Bulk order bonus: Maximum margin increased by 3% (from ${base_max_margin.toFixed(2)}% to ${result.adjusted_max_margin.toFixed(2)}%)`
    );
    result.notes.push(
      `Order value: Rp ${(order_value / 1_000_000).toFixed(2)}M (threshold: Rp 5M)`
    );
  }

  // Validate applied margin against adjusted ranges
  if (applied_margin >= result.adjusted_min_margin && applied_margin <= result.adjusted_max_margin) {
    result.allowed = true;
    result.notes.push(
      `✅ Applied margin ${applied_margin.toFixed(2)}% is within adjusted range (${result.adjusted_min_margin.toFixed(2)}% - ${result.adjusted_max_margin.toFixed(2)}%)`
    );
  } else if (applied_margin < result.adjusted_min_margin) {
    result.allowed = false;
    const deviation = result.adjusted_min_margin - applied_margin;
    result.notes.push(
      `❌ Applied margin ${applied_margin.toFixed(2)}% is ${deviation.toFixed(2)}% below adjusted minimum (${result.adjusted_min_margin.toFixed(2)}%)`
    );
    result.notes.push('🚨 BLOCKED: Requires CEO approval to proceed');
  } else if (applied_margin > result.adjusted_max_margin) {
    result.allowed = false;
    const deviation = applied_margin - result.adjusted_max_margin;
    result.notes.push(
      `❌ Applied margin ${applied_margin.toFixed(2)}% is ${deviation.toFixed(2)}% above adjusted maximum (${result.adjusted_max_margin.toFixed(2)}%)`
    );
    result.notes.push('🚨 BLOCKED: Margin too high - may impact competitiveness');
  }

  return result;
}

/**
 * Check if customer is in strategic whitelist
 */
function isStrategicCustomer(customerName?: string): boolean {
  if (!customerName) return false;

  const normalized = customerName.toUpperCase().trim();

  return STRATEGIC_CUSTOMERS.some((strategic) =>
    normalized.includes(strategic)
  );
}

/**
 * Log margin violation with exception context
 */
export async function logMarginViolation(
  policyId: string | null,
  estimationId: string,
  boqItemId: string,
  sbu: string,
  category: string,
  system: string | null,
  subSystem: string | null,
  component: string | null,
  costPrice: number,
  sellingPrice: number,
  appliedMargin: number,
  policyMinMargin: number,
  policyMaxMargin: number,
  exceptionContext: ExceptionContext,
  exceptionResult: ExceptionResult,
  createdBy: string,
  prisma: any
): Promise<void> {
  const deviationFromMin = appliedMargin - policyMinMargin;
  const deviationFromMax = appliedMargin - policyMaxMargin;

  const exceptionReason = [
    ...exceptionResult.notes,
    exceptionContext.is_tender ? 'Tender project' : null,
    exceptionContext.is_strategic_customer ? `Strategic customer: ${exceptionContext.customer_name}` : null,
    exceptionContext.is_bulk_order ? `Bulk order: Rp ${(exceptionContext.order_value! / 1_000_000).toFixed(2)}M` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  await prisma.margin_policy_violations.create({
    data: {
      policy_id: policyId,
      estimation_id: estimationId,
      boq_item_id: boqItemId,
      sbu,
      category,
      system,
      sub_system: subSystem,
      component,
      cost_price: costPrice,
      selling_price: sellingPrice,
      applied_margin: appliedMargin / 100, // Store as decimal
      policy_min_margin: policyMinMargin / 100,
      policy_max_margin: policyMaxMargin / 100,
      deviation_from_min: deviationFromMin / 100,
      deviation_from_max: deviationFromMax / 100,
      exception_type: exceptionResult.exception_type,
      exception_reason: exceptionReason,
      approved_by: null, // Set when CEO approves
      approved_at: null,
      created_by: createdBy,
    },
  });
}

/**
 * Calculate contribution margin after freelance commission
 * Formula: Contribution Margin = Gross Margin - Freelance Commission
 */
export function calculateContributionMargin(
  grossMargin: number,
  freelanceCommission: number
): number {
  return grossMargin - freelanceCommission;
}

/**
 * Validate total project margin with -3% tolerance
 */
export function validateTotalProjectMargin(
  totalRevenue: number,
  totalCost: number,
  targetMargin: number
): {
  actual_margin: number;
  target_margin: number;
  deviation: number;
  is_valid: boolean;
  can_finalize: boolean;
  warnings: string[];
} {
  const actualMargin = ((totalRevenue - totalCost) / totalRevenue) * 100;
  const deviation = actualMargin - targetMargin;
  const TOLERANCE = -3.0; // -3% tolerance

  const warnings: string[] = [];

  const isValid = actualMargin >= targetMargin + TOLERANCE;
  const canFinalize = actualMargin >= targetMargin + TOLERANCE;

  if (!isValid) {
    warnings.push(
      `⚠️ Total margin ${actualMargin.toFixed(2)}% is ${Math.abs(deviation).toFixed(2)}% below target (${targetMargin.toFixed(2)}%)`
    );
  }

  if (deviation < TOLERANCE) {
    warnings.push(
      `🚨 CRITICAL: Margin is ${Math.abs(deviation).toFixed(2)}% below target (exceeds -3% tolerance)`
    );
    warnings.push('❌ Cannot finalize estimation - margin too low');
  } else if (deviation < 0 && deviation >= TOLERANCE) {
    warnings.push(
      `⚠️ WARNING: Margin is ${Math.abs(deviation).toFixed(2)}% below target (within -3% tolerance)`
    );
    warnings.push('✅ Can finalize but requires management review');
  }

  return {
    actual_margin: actualMargin,
    target_margin: targetMargin,
    deviation,
    is_valid: isValid,
    can_finalize: canFinalize,
    warnings,
  };
}

export default {
  applyMarginExceptions,
  isStrategicCustomer,
  logMarginViolation,
  calculateContributionMargin,
  validateTotalProjectMargin,
  BULK_ORDER_THRESHOLD,
  TENDER_TOLERANCE,
  STRATEGIC_CUSTOMER_TOLERANCE,
  BULK_ORDER_BONUS,
};
