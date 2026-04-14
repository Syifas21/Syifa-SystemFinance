import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface MarginPolicy {
  id: string;
  sbu: string;
  category: string;
  system: string | null;
  sub_system: string | null;
  component: string | null;
  min_gross_margin: number;
  max_gross_margin: number;
  default_markup?: number | null;
  is_active?: boolean;
  notes?: string | null;
  valid_from: Date;
  valid_to: Date;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface MarginPolicyLookup {
  sbu: string;
  category: string;
  system?: string | null;
  sub_system?: string | null;
  component?: string | null;
}

export interface MarginCalculationResult {
  policy: MarginPolicy | null;
  min_margin: number;
  max_margin: number;
  default_markup: number;
  calculated_selling_price?: number;
  fallback_level?: string;
}

export interface MarginValidationResult {
  is_valid: boolean;
  applied_margin: number;
  min_margin: number;
  max_margin: number;
  deviation_from_min: number;
  deviation_from_max: number;
  policy: MarginPolicy | null;
  fallback_level?: string;
  warnings: string[];
}

export interface ExceptionContext {
  is_tender?: boolean;
  is_strategic_customer?: boolean;
  is_bulk_order?: boolean;
  order_value?: number;
  customer_id?: string;
}

const BULK_ORDER_THRESHOLD = 5000000; // Rp 5M
const STRATEGIC_CUSTOMERS: string[] = []; // Load from config or database

/**
 * Find margin policy with 4-level fallback algorithm
 * Level 1: Exact match (SBU + Category + System + Sub-System + Component)
 * Level 2: SBU + Category + System + Sub-System
 * Level 3: SBU + Category + System
 * Level 4: SBU + Category (default)
 * Level 5: SBU Default or General Fallback
 */
export async function findMarginPolicy(
  lookup: MarginPolicyLookup,
  date: Date = new Date()
): Promise<MarginCalculationResult> {
  const { sbu, category, system, sub_system, component } = lookup;

  // Level 1: Exact match with component
  if (component && sub_system && system) {
    const policy = await prisma.margin_policies.findFirst({
      where: {
        sbu,
        category,
        system,
        sub_system,
        component,
        is_active: true,
        valid_from: { lte: date },
        valid_to: { gte: date },
      },
    });

    if (policy) {
      return createResult(policy, 'Level 1: Exact match (Component)');
    }
  }

  // Level 2: Match without component
  if (sub_system && system) {
    const policy = await prisma.margin_policies.findFirst({
      where: {
        sbu,
        category,
        system,
        sub_system,
        component: null,
        is_active: true,
        valid_from: { lte: date },
        valid_to: { gte: date },
      },
    });

    if (policy) {
      return createResult(policy, 'Level 2: Sub-System match');
    }
  }

  // Level 3: Match without sub-system
  if (system) {
    const policy = await prisma.margin_policies.findFirst({
      where: {
        sbu,
        category,
        system,
        sub_system: null,
        component: null,
        is_active: true,
        valid_from: { lte: date },
        valid_to: { gte: date },
      },
    });

    if (policy) {
      return createResult(policy, 'Level 3: System match');
    }
  }

  // Level 4: Category default
  const categoryPolicy = await prisma.margin_policies.findFirst({
    where: {
      sbu,
      category,
      system: null,
      sub_system: null,
      component: null,
      is_active: true,
      valid_from: { lte: date },
      valid_to: { gte: date },
    },
  });

  if (categoryPolicy) {
    return createResult(categoryPolicy, 'Level 4: Category default');
  }

  // Level 5: SBU default
  const sbuPolicy = await prisma.margin_policies.findFirst({
    where: {
      sbu,
      category: 'Default',
      system: null,
      sub_system: null,
      component: null,
      is_active: true,
      valid_from: { lte: date },
      valid_to: { gte: date },
    },
  });

  if (sbuPolicy) {
    return createResult(sbuPolicy, 'Level 5: SBU default');
  }

  // Level 6: General fallback
  const generalPolicy = await prisma.margin_policies.findFirst({
    where: {
      sbu: 'ALL',
      category: 'Default',
      system: null,
      sub_system: null,
      component: null,
      is_active: true,
      valid_from: { lte: date },
      valid_to: { gte: date },
    },
  });

  if (generalPolicy) {
    return createResult(generalPolicy, 'Level 6: General fallback');
  }

  // No policy found - return default conservative margins
  return {
    policy: null,
    min_margin: 25.0,
    max_margin: 35.0,
    default_markup: 33.33,
    fallback_level: 'No policy found - using default',
  };
}

function createResult(policy: any, fallback_level: string): MarginCalculationResult {
  const min_margin = parseFloat(policy.min_gross_margin) * 100; // Convert to percentage
  const max_margin = parseFloat(policy.max_gross_margin) * 100; // Convert to percentage
  const default_markup = policy.default_markup 
    ? parseFloat(policy.default_markup) * 100 
    : calculateMarkupFromMargin(min_margin);

  return {
    policy,
    min_margin,
    max_margin,
    default_markup,
    fallback_level,
  };
}

/**
 * Calculate markup from gross margin
 * Formula: Markup = (Margin / (100 - Margin)) * 100
 */
export function calculateMarkupFromMargin(grossMargin: number): number {
  if (grossMargin >= 100) return 999.99;
  if (grossMargin <= 0) return 0;
  return (grossMargin / (100 - grossMargin)) * 100;
}

/**
 * Calculate gross margin from cost and selling price
 * Formula: Margin = ((Selling Price - Cost) / Selling Price) * 100
 */
export function calculateGrossMargin(cost: number, sellingPrice: number): number {
  if (sellingPrice <= 0) return 0;
  return ((sellingPrice - cost) / sellingPrice) * 100;
}

/**
 * Calculate selling price from cost and margin
 * Formula: Selling Price = Cost / (1 - Margin/100)
 */
export function calculateSellingPriceFromMargin(cost: number, margin: number): number {
  if (margin >= 100) throw new Error('Margin cannot be >= 100%');
  return cost / (1 - margin / 100);
}

/**
 * Calculate selling price from cost and markup
 * Formula: Selling Price = Cost * (1 + Markup/100)
 */
export function calculateSellingPriceFromMarkup(cost: number, markup: number): number {
  return cost * (1 + markup / 100);
}

/**
 * Validate margin against policy with exception handling
 */
export async function validateMarginPolicy(
  lookup: MarginPolicyLookup,
  cost: number,
  sellingPrice: number,
  exceptions?: ExceptionContext,
  date: Date = new Date()
): Promise<MarginValidationResult> {
  const result = await findMarginPolicy(lookup, date);
  const appliedMargin = calculateGrossMargin(cost, sellingPrice);

  let min_margin = result.min_margin;
  let max_margin = result.max_margin;
  const warnings: string[] = [];

  // Apply exception rules
  if (exceptions) {
    if (exceptions.is_tender) {
      min_margin -= 5.0;
      warnings.push(`Tender exception: Min margin reduced by 5% (${result.min_margin}% → ${min_margin}%)`);
    }

    if (exceptions.is_strategic_customer) {
      const allowedReduction = 4.0;
      if (appliedMargin < result.min_margin && appliedMargin >= result.min_margin - allowedReduction) {
        min_margin = appliedMargin;
        warnings.push(`Strategic customer exception: Margin ${appliedMargin.toFixed(2)}% allowed (max -4% from policy)`);
      }
    }

    if (exceptions.is_bulk_order || (exceptions.order_value && exceptions.order_value > BULK_ORDER_THRESHOLD)) {
      max_margin += 3.0;
      warnings.push(`Bulk order exception: Max margin increased by 3% (${result.max_margin}% → ${max_margin}%)`);
    }
  }

  const deviation_from_min = appliedMargin - min_margin;
  const deviation_from_max = appliedMargin - max_margin;

  const is_valid = appliedMargin >= min_margin && appliedMargin <= max_margin;

  if (!is_valid) {
    if (appliedMargin < min_margin) {
      warnings.push(`⚠️ Margin ${appliedMargin.toFixed(2)}% is below minimum ${min_margin.toFixed(2)}% (deviation: ${deviation_from_min.toFixed(2)}%)`);
    } else {
      warnings.push(`⚠️ Margin ${appliedMargin.toFixed(2)}% exceeds maximum ${max_margin.toFixed(2)}% (deviation: ${deviation_from_max.toFixed(2)}%)`);
    }
  }

  return {
    is_valid,
    applied_margin: appliedMargin,
    min_margin,
    max_margin,
    deviation_from_min,
    deviation_from_max,
    policy: result.policy,
    fallback_level: result.fallback_level,
    warnings,
  };
}

/**
 * Log margin policy violation to audit trail
 */
export async function logMarginViolation(
  validation: MarginValidationResult,
  lookup: MarginPolicyLookup,
  cost: number,
  sellingPrice: number,
  context: {
    estimation_id?: string;
    boq_item_id?: string;
    exception_type?: string;
    exception_reason?: string;
    approved_by?: string;
    approved_at?: Date;
    created_by: string;
  }
): Promise<any> {
  return await prisma.margin_policy_violations.create({
    data: {
      policy_id: validation.policy?.id || null,
      estimation_id: context.estimation_id || null,
      boq_item_id: context.boq_item_id || null,
      sbu: lookup.sbu,
      category: lookup.category,
      system: lookup.system || null,
      sub_system: lookup.sub_system || null,
      component: lookup.component || null,
      cost_price: cost,
      selling_price: sellingPrice,
      applied_margin: validation.applied_margin,
      policy_min_margin: validation.min_margin,
      policy_max_margin: validation.max_margin,
      deviation_from_min: validation.deviation_from_min,
      deviation_from_max: validation.deviation_from_max,
      exception_type: context.exception_type || null,
      exception_reason: context.exception_reason || null,
      approved_by: context.approved_by || null,
      approved_at: context.approved_at || null,
      created_by: context.created_by,
    },
  });
}

/**
 * Get all margin policies with optional filters
 */
export async function getAllMarginPolicies(filters?: {
  sbu?: string;
  category?: string;
  system?: string;
  active_on?: Date;
}): Promise<MarginPolicy[]> {
  const where: any = {};

  if (filters?.sbu) where.sbu = filters.sbu;
  if (filters?.category) where.category = filters.category;
  if (filters?.system) where.system = filters.system;
  
  if (filters?.active_on) {
    where.valid_from = { lte: filters.active_on };
    where.valid_to = { gte: filters.active_on };
  }

  return await prisma.margin_policies.findMany({
    where,
    orderBy: [
      { sbu: 'asc' },
      { category: 'asc' },
      { system: 'asc' },
      { sub_system: 'asc' },
      { component: 'asc' },
    ],
  });
}

/**
 * Create new margin policy
 */
export async function createMarginPolicy(data: {
  sbu: string;
  category: string;
  system?: string | null;
  sub_system?: string | null;
  component?: string | null;
  min_gross_margin: number;
  max_gross_margin: number;
  valid_from?: Date;
  valid_to?: Date;
  created_by?: string;
}): Promise<MarginPolicy> {
  // Validate margin range
  if (data.min_gross_margin < 0 || data.min_gross_margin > 100) {
    throw new Error('Min gross margin must be between 0 and 100');
  }
  if (data.max_gross_margin < 0 || data.max_gross_margin > 100) {
    throw new Error('Max gross margin must be between 0 and 100');
  }
  if (data.max_gross_margin < data.min_gross_margin) {
    throw new Error('Max gross margin must be >= min gross margin');
  }

  return await prisma.margin_policies.create({
    data: {
      id: uuidv4(),
      sbu: data.sbu,
      category: data.category,
      system: data.system || null,
      sub_system: data.sub_system || null,
      component: data.component || null,
      min_gross_margin: data.min_gross_margin,
      max_gross_margin: data.max_gross_margin,
      valid_from: data.valid_from || new Date('2025-01-01'),
      valid_to: data.valid_to || new Date('2026-12-31'),
      created_by: data.created_by || 'SYSTEM',
    },
  });
}

/**
 * Update margin policy
 */
export async function updateMarginPolicy(
  id: string,
  data: {
    min_gross_margin?: number;
    max_gross_margin?: number;
    valid_from?: Date;
    valid_to?: Date;
    updated_by?: string;
  }
): Promise<MarginPolicy> {
  // Validate if both margins provided
  if (data.min_gross_margin !== undefined && data.max_gross_margin !== undefined) {
    if (data.max_gross_margin < data.min_gross_margin) {
      throw new Error('Max gross margin must be >= min gross margin');
    }
  }

  return await prisma.margin_policies.update({
    where: { id },
    data: {
      ...data,
      updated_at: new Date(),
    },
  });
}

/**
 * Delete margin policy
 */
export async function deleteMarginPolicy(id: string): Promise<void> {
  await prisma.margin_policies.delete({
    where: { id },
  });
}

/**
 * Get margin violations with filters
 */
export async function getMarginViolations(filters?: {
  estimation_id?: string;
  sbu?: string;
  from_date?: Date;
  to_date?: Date;
  limit?: number;
  approved_only?: boolean;
  pending_only?: boolean;
}): Promise<any[]> {
  const where: any = {};

  if (filters?.estimation_id) where.estimation_id = filters.estimation_id;
  if (filters?.sbu) where.sbu = filters.sbu;
  if (filters?.from_date || filters?.to_date) {
    where.violated_at = {};
    if (filters.from_date) where.violated_at.gte = filters.from_date;
    if (filters.to_date) where.violated_at.lte = filters.to_date;
  }

  // Filter by approval status
  if (filters?.pending_only) {
    where.approved_by = null;
  }
  if (filters?.approved_only) {
    where.NOT = { approved_by: null };
  }

  return await prisma.margin_policy_violations.findMany({
    where,
    include: {
      margin_policies: true,
    },
    orderBy: { violated_at: 'desc' },
    take: filters?.limit || 100,
  });
}

/**
 * Get single violation by ID
 */
export async function getMarginViolationById(id: string): Promise<any> {
  return await prisma.margin_policy_violations.findUnique({
    where: { id },
    include: {
      policy: true,
    },
  });
}

/**
 * Approve margin violation
 */
export async function approveMarginViolation(
  violationId: string,
  approvedBy: string,
  comment?: string
): Promise<any> {
  const violation = await prisma.margin_policy_violations.findUnique({
    where: { id: violationId },
  });

  if (!violation) {
    throw new Error(`Margin violation ${violationId} not found`);
  }

  if (violation.approved_by) {
    throw new Error(`Violation already approved by ${violation.approved_by}`);
  }

  return await prisma.margin_policy_violations.update({
    where: { id: violationId },
    data: {
      approved_by: approvedBy,
      approved_at: new Date(),
      exception_reason: comment || violation.exception_reason,
    },
    include: {
      policy: true,
    },
  });
}

/**
 * Reject margin violation
 */
export async function rejectMarginViolation(
  violationId: string,
  rejectedBy: string,
  rejectionReason: string
): Promise<any> {
  const violation = await prisma.margin_policy_violations.findUnique({
    where: { id: violationId },
  });

  if (!violation) {
    throw new Error(`Margin violation ${violationId} not found`);
  }

  if (violation.approved_by) {
    throw new Error(`Violation already approved by ${violation.approved_by}`);
  }

  // For rejection, we use approved_by with prefix "REJECTED_BY_"
  // This way rejection is also tracked
  return await prisma.margin_policy_violations.update({
    where: { id: violationId },
    data: {
      approved_by: `REJECTED_BY_${rejectedBy}`,
      approved_at: new Date(),
      exception_reason: rejectionReason,
    },
    include: {
      policy: true,
    },
  });
}
