/**
 * Margin Integration Service
 *
 * This service is used by Finance/Estimation modules to:
 * 1. Validate pricing against margin policies
 * 2. Log violations automatically
 * 3. Create approval workflows
 *
 * Usage:
 * - When creating an estimation item (BOQ)
 * - When creating an invoice
 * - When approving a quotation
 */

import * as marginPolicyService from './margin-policies.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EstimationItem {
  id?: string;
  estimation_id: string;
  boq_item_id?: string;
  sbu: string;
  category: string;
  system?: string;
  sub_system?: string;
  component?: string;
  cost_price: number;
  selling_price: number;
  quantity?: number;
  description?: string;
}

export interface ValidatedEstimationItem extends EstimationItem {
  applied_margin: number;
  policy_min_margin: number;
  policy_max_margin: number;
  is_valid: boolean;
  violation_id?: string;
  needs_approval: boolean;
  reason?: string;
}

/**
 * Validate an estimation item against margin policies
 * If margin is below policy, automatically log a violation
 *
 * Returns:
 * - Item details with validation results
 * - violation_id if margin is below policy
 * - needs_approval = true if requires CEO approval
 */
export async function validateEstimationItem(
  item: EstimationItem,
  createdBy: string
): Promise<ValidatedEstimationItem> {
  try {
    // Validate margin against policy
    const validation = await marginPolicyService.validateMarginPolicy(
      {
        sbu: item.sbu,
        category: item.category,
        system: item.system || null,
        sub_system: item.sub_system || null,
        component: item.component || null,
      },
      item.cost_price,
      item.selling_price
    );

    const result: ValidatedEstimationItem = {
      ...item,
      applied_margin: validation.applied_margin,
      policy_min_margin: validation.min_margin,
      policy_max_margin: validation.max_margin,
      is_valid: validation.is_valid,
      needs_approval: !validation.is_valid,
    };

    // If invalid (below minimum or above maximum), log violation
    if (!validation.is_valid) {
      const violation = await marginPolicyService.logMarginViolation(
        validation,
        {
          sbu: item.sbu,
          category: item.category,
          system: item.system || null,
          sub_system: item.sub_system || null,
          component: item.component || null,
        },
        item.cost_price,
        item.selling_price,
        {
          estimation_id: item.estimation_id,
          boq_item_id: item.boq_item_id,
        exception_type: undefined,
          exception_reason: `Auto-logged from estimation item: ${item.description}`,
          created_by: createdBy,
        }
      );

      result.violation_id = violation.id;
      result.reason = `Margin ${validation.applied_margin.toFixed(2)}% is ${
        validation.applied_margin < validation.min_margin ? 'below' : 'above'
      } policy (${validation.min_margin.toFixed(2)}% - ${validation.max_margin.toFixed(2)}%)`;
    }

    return result;
  } catch (error: any) {
    console.error('Error validating estimation item:', error);
    throw error;
  }
}

/**
 * Validate multiple estimation items (BOQ items)
 * Returns array with validation results for each
 */
export async function validateEstimationItems(
  items: EstimationItem[],
  createdBy: string
): Promise<ValidatedEstimationItem[]> {
  const results = await Promise.all(
    items.map((item) => validateEstimationItem(item, createdBy))
  );
  return results;
}

/**
 * Check if estimation has any pending violations (needs CEO approval)
 */
export async function hasViolations(estimationId: string): Promise<boolean> {
  const violations = await prisma.margin_policy_violations.findMany({
    where: {
      estimation_id: estimationId,
      approved_by: null,
    },
  });

  return violations.length > 0;
}

/**
 * Get all violations for an estimation
 */
export async function getEstimationViolations(estimationId: string) {
  return await prisma.margin_policy_violations.findMany({
    where: { estimation_id: estimationId },
    orderBy: { violated_at: 'desc' },
  });
}

/**
 * Check if all violations for an estimation have been approved
 */
export async function areAllViolationsApproved(estimationId: string): Promise<boolean> {
  const pending = await prisma.margin_policy_violations.findMany({
    where: {
      estimation_id: estimationId,
      approved_by: null,
    },
  });

  return pending.length === 0;
}

/**
 * Get approval status for an estimation
 */
export async function getEstimationApprovalStatus(estimationId: string) {
  const violations = await getEstimationViolations(estimationId);

  const pending = violations.filter((v) => !v.approved_by);
  const approved = violations.filter(
    (v) => v.approved_by && !v.approved_by.startsWith('REJECTED_BY_')
  );
  const rejected = violations.filter((v) =>
    v.approved_by?.startsWith('REJECTED_BY_')
  );

  return {
    total_violations: violations.length,
    pending: pending.length,
    approved: approved.length,
    rejected: rejected.length,
    violations: violations,
    status:
      rejected.length > 0
        ? 'REJECTED'
        : pending.length === 0 && violations.length > 0
        ? 'ALL_APPROVED'
        : violations.length === 0
        ? 'NO_VIOLATIONS'
        : 'PENDING_APPROVAL',
  };
}

/**
 * Prevent proceeding with estimation if violations are pending
 * Use this before creating an invoice or finalizing an estimate
 */
export async function canProceedWithEstimation(
  estimationId: string
): Promise<{ canProceed: boolean; reason?: string }> {
  const status = await getEstimationApprovalStatus(estimationId);

  if (status.status === 'REJECTED') {
    return {
      canProceed: false,
      reason: `Cannot proceed: ${status.rejected} violation(s) have been rejected by CEO. Renegotiate pricing.`,
    };
  }

  if (status.status === 'PENDING_APPROVAL') {
    return {
      canProceed: false,
      reason: `Cannot proceed: ${status.pending} violation(s) pending CEO approval. Wait for approval or proceed at risk.`,
    };
  }

  return { canProceed: true };
}

/**
 * Integration example for Finance module:
 *
 * // In Finance API route (estimate creation):
 * async function createEstimation(req: Request, res: Response) {
 *   const { items, customer_id, description } = req.body;
 *   const userId = req.headers['x-user-id'];
 *
 *   try {
 *     // 1. Create estimation in DB
 *     const estimation = await estimationService.create({
 *       customer_id,
 *       description,
 *     });
 *
 *     // 2. Validate each item against margin policy
 *     const validatedItems = await marginIntegrationService.validateEstimationItems(
 *       items.map(i => ({
 *         estimation_id: estimation.id,
 *         ...i,
 *       })),
 *       userId
 *     );
 *
 *     // 3. Check if estimation can proceed
 *     const { canProceed, reason } = await marginIntegrationService.canProceedWithEstimation(
 *       estimation.id
 *     );
 *
 *     if (!canProceed) {
 *       return res.status(202).json({
 *         success: true,
 *         message: 'Estimation created but requires CEO approval',
 *         data: {
 *           estimation_id: estimation.id,
 *           status: 'PENDING_APPROVAL',
 *           reason,
 *           violations: validatedItems.filter(i => i.violation_id),
 *         },
 *       });
 *     }
 *
 *     // Proceed to create invoice, etc.
 *     return res.status(201).json({
 *       success: true,
 *       data: estimation,
 *     });
 *   } catch (error) {
 *     res.status(500).json({ success: false, error: error.message });
 *   }
 * }
 */
