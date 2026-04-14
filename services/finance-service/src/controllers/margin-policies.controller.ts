import { Request, Response } from 'express';
import * as marginPolicyService from '../services/margin-policies.service';

/**
 * GET /api/margin-policies
 * Get all margin policies with optional filters
 */
export async function getAllMarginPolicies(req: Request, res: Response) {
  try {
    const { sbu, category, system, active_on } = req.query;

    const filters: any = {};
    if (sbu) filters.sbu = sbu as string;
    if (category) filters.category = category as string;
    if (system) filters.system = system as string;
    if (active_on) filters.active_on = new Date(active_on as string);

    const policies = await marginPolicyService.getAllMarginPolicies(filters);

    res.status(200).json({
      success: true,
      data: policies,
      count: policies.length,
    });
  } catch (error: any) {
    console.error('Error fetching margin policies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch margin policies',
      error: error.message,
    });
  }
}

/**
 * POST /api/margin-policies
 * Create new margin policy
 */
export async function createMarginPolicy(req: Request, res: Response) {
  try {
    const {
      sbu,
      category,
      system,
      sub_system,
      component,
      min_gross_margin,
      max_gross_margin,
      valid_from,
      valid_to,
    } = req.body;

    // Validation
    if (!sbu || !category) {
      return res.status(400).json({
        success: false,
        message: 'SBU and Category are required',
      });
    }

    if (min_gross_margin === undefined || max_gross_margin === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Min and max gross margin are required',
      });
    }

    const created_by = req.headers['x-user-id'] as string || 'SYSTEM';

    const policy = await marginPolicyService.createMarginPolicy({
      sbu,
      category,
      system: system || null,
      sub_system: sub_system || null,
      component: component || null,
      min_gross_margin: parseFloat(min_gross_margin),
      max_gross_margin: parseFloat(max_gross_margin),
      valid_from: valid_from ? new Date(valid_from) : undefined,
      valid_to: valid_to ? new Date(valid_to) : undefined,
      created_by,
    });

    res.status(201).json({
      success: true,
      message: 'Margin policy created successfully',
      data: policy,
    });
  } catch (error: any) {
    console.error('Error creating margin policy:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Margin policy with this combination already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create margin policy',
      error: error.message,
    });
  }
}

/**
 * PUT /api/margin-policies/:id
 * Update margin policy
 */
export async function updateMarginPolicy(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { min_gross_margin, max_gross_margin, valid_from, valid_to } = req.body;

    const updated_by = req.headers['x-user-id'] as string || 'SYSTEM';

    const updateData: any = { updated_by };
    
    if (min_gross_margin !== undefined) updateData.min_gross_margin = parseFloat(min_gross_margin);
    if (max_gross_margin !== undefined) updateData.max_gross_margin = parseFloat(max_gross_margin);
    if (valid_from) updateData.valid_from = new Date(valid_from);
    if (valid_to) updateData.valid_to = new Date(valid_to);

    const policy = await marginPolicyService.updateMarginPolicy(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Margin policy updated successfully',
      data: policy,
    });
  } catch (error: any) {
    console.error('Error updating margin policy:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Margin policy not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update margin policy',
      error: error.message,
    });
  }
}

/**
 * DELETE /api/margin-policies/:id
 * Delete margin policy
 */
export async function deleteMarginPolicy(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await marginPolicyService.deleteMarginPolicy(id);

    res.status(200).json({
      success: true,
      message: 'Margin policy deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting margin policy:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Margin policy not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete margin policy',
      error: error.message,
    });
  }
}

/**
 * POST /api/margin-policies/find
 * Find margin policy with fallback algorithm
 */
export async function findMarginPolicy(req: Request, res: Response) {
  try {
    const { sbu, category, system, sub_system, component, date } = req.body;

    if (!sbu || !category) {
      return res.status(400).json({
        success: false,
        message: 'SBU and Category are required',
      });
    }

    const lookup = {
      sbu,
      category,
      system: system || null,
      sub_system: sub_system || null,
      component: component || null,
    };

    const effectiveDate = date ? new Date(date) : new Date();
    const result = await marginPolicyService.findMarginPolicy(lookup, effectiveDate);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error finding margin policy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find margin policy',
      error: error.message,
    });
  }
}

/**
 * POST /api/margin-policies/validate
 * Validate pricing against margin policy
 */
export async function validateMargin(req: Request, res: Response) {
  try {
    const {
      sbu,
      category,
      system,
      sub_system,
      component,
      cost,
      selling_price,
      exceptions,
      date,
    } = req.body;

    if (!sbu || !category || cost === undefined || selling_price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'SBU, Category, Cost, and Selling Price are required',
      });
    }

    const lookup = {
      sbu,
      category,
      system: system || null,
      sub_system: sub_system || null,
      component: component || null,
    };

    const effectiveDate = date ? new Date(date) : new Date();
    const validation = await marginPolicyService.validateMarginPolicy(
      lookup,
      parseFloat(cost),
      parseFloat(selling_price),
      exceptions,
      effectiveDate
    );

    res.status(200).json({
      success: true,
      data: validation,
    });
  } catch (error: any) {
    console.error('Error validating margin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate margin',
      error: error.message,
    });
  }
}

/**
 * POST /api/margin-policies/calculate-price
 * Calculate selling price from cost and margin
 */
export async function calculatePrice(req: Request, res: Response) {
  try {
    const { cost, margin, markup } = req.body;

    if (cost === undefined || (margin === undefined && markup === undefined)) {
      return res.status(400).json({
        success: false,
        message: 'Cost and either Margin or Markup are required',
      });
    }

    let sellingPrice: number;

    if (margin !== undefined) {
      sellingPrice = marginPolicyService.calculateSellingPriceFromMargin(
        parseFloat(cost),
        parseFloat(margin)
      );
    } else {
      sellingPrice = marginPolicyService.calculateSellingPriceFromMarkup(
        parseFloat(cost),
        parseFloat(markup)
      );
    }

    const actualMargin = marginPolicyService.calculateGrossMargin(
      parseFloat(cost),
      sellingPrice
    );

    const actualMarkup = marginPolicyService.calculateMarkupFromMargin(actualMargin);

    res.status(200).json({
      success: true,
      data: {
        cost: parseFloat(cost),
        selling_price: sellingPrice,
        gross_margin: actualMargin,
        markup: actualMarkup,
      },
    });
  } catch (error: any) {
    console.error('Error calculating price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate price',
      error: error.message,
    });
  }
}

/**
 * GET /api/margin-policies/violations
 * Get margin policy violations
 */
export async function getViolations(req: Request, res: Response) {
  try {
    const { estimation_id, sbu, from_date, to_date, limit } = req.query;

    const filters: any = {};
    if (estimation_id) filters.estimation_id = estimation_id as string;
    if (sbu) filters.sbu = sbu as string;
    if (from_date) filters.from_date = new Date(from_date as string);
    if (to_date) filters.to_date = new Date(to_date as string);
    if (limit) filters.limit = parseInt(limit as string);

    const violations = await marginPolicyService.getMarginViolations(filters);

    res.status(200).json({
      success: true,
      data: violations,
      count: violations.length,
    });
  } catch (error: any) {
    console.error('Error fetching violations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch violations',
      error: error.message,
    });
  }
}

/**
 * POST /api/margin-policies/log-violation
 * Log margin policy violation
 */
export async function logViolation(req: Request, res: Response) {
  try {
    const {
      sbu,
      category,
      system,
      sub_system,
      component,
      cost,
      selling_price,
      estimation_id,
      boq_item_id,
      exception_type,
      exception_reason,
      approved_by,
      approved_at,
    } = req.body;

    const created_by = req.headers['x-user-id'] as string || 'SYSTEM';

    // First validate the margin
    const lookup = { sbu, category, system, sub_system, component };
    const validation = await marginPolicyService.validateMarginPolicy(
      lookup,
      parseFloat(cost),
      parseFloat(selling_price)
    );

    // Log the violation
    const violation = await marginPolicyService.logMarginViolation(
      validation,
      lookup,
      parseFloat(cost),
      parseFloat(selling_price),
      {
        estimation_id,
        boq_item_id,
        exception_type,
        exception_reason,
        approved_by,
        approved_at: approved_at ? new Date(approved_at) : undefined,
        created_by,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Violation logged successfully',
      data: violation,
    });
  } catch (error: any) {
    console.error('Error logging violation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log violation',
      error: error.message,
    });
  }
}

/**
 * GET /api/margin-policies/violations/:id
 * Get single margin violation by ID
 */
export async function getViolationById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Violation ID is required',
      });
    }

    const violation = await marginPolicyService.getMarginViolationById(id);

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: 'Violation not found',
      });
    }

    res.status(200).json({
      success: true,
      data: violation,
    });
  } catch (error: any) {
    console.error('Error fetching violation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch violation',
      error: error.message,
    });
  }
}

/**
 * PUT /api/margin-policies/violations/:id/approve
 * CEO approves margin violation exception
 */
export async function approveViolation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Violation ID is required',
      });
    }

    const approvedBy = req.headers['x-user-id'] as string || 'UNKNOWN_CEO';

    const violation = await marginPolicyService.approveMarginViolation(
      id,
      approvedBy,
      comment
    );

    // TODO: Send notification to Finance team
    // await notificationService.notifyFinanceTeam({
    //   type: 'MARGIN_APPROVED',
    //   violation_id: id,
    //   approved_by: approvedBy,
    //   message: `Margin violation for ${violation.category} has been APPROVED`,
    // });

    res.status(200).json({
      success: true,
      message: 'Margin violation approved successfully',
      data: violation,
    });
  } catch (error: any) {
    console.error('Error approving violation:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('already approved')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to approve violation',
      error: error.message,
    });
  }
}

/**
 * PUT /api/margin-policies/violations/:id/reject
 * CEO rejects margin violation exception
 */
export async function rejectViolation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Violation ID is required',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const rejectedBy = req.headers['x-user-id'] as string || 'UNKNOWN_CEO';

    const violation = await marginPolicyService.rejectMarginViolation(
      id,
      rejectedBy,
      reason
    );

    // TODO: Send notification to Finance team
    // await notificationService.notifyFinanceTeam({
    //   type: 'MARGIN_REJECTED',
    //   violation_id: id,
    //   rejected_by: rejectedBy,
    //   reason: reason,
    //   message: `Margin violation for ${violation.category} has been REJECTED`,
    // });

    res.status(200).json({
      success: true,
      message: 'Margin violation rejected successfully',
      data: violation,
    });
  } catch (error: any) {
    console.error('Error rejecting violation:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('already approved')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to reject violation',
      error: error.message,
    });
  }
}

/**
 * GET /api/margin-policies/hierarchy
 * Get unique values for hierarchical filtering
 */
export async function getHierarchy(req: Request, res: Response) {
  try {
    const { level, sbu, category, system, sub_system } = req.query;

    let values: string[] = [];

    if (level === 'sbu') {
      const result = await marginPolicyService.getAllMarginPolicies();
      values = [...new Set(result.map((p) => p.sbu))].sort();
    } else if (level === 'category' && sbu) {
      const result = await marginPolicyService.getAllMarginPolicies({ sbu: sbu as string });
      values = [...new Set(result.map((p) => p.category))].sort();
    } else if (level === 'system' && sbu && category) {
      const result = await marginPolicyService.getAllMarginPolicies({
        sbu: sbu as string,
        category: category as string,
      });
      values = [...new Set(result.map((p) => p.system).filter((s) => s))].sort() as string[];
    } else if (level === 'sub_system' && sbu && category && system) {
      const result = await marginPolicyService.getAllMarginPolicies({
        sbu: sbu as string,
        category: category as string,
        system: system as string,
      });
      values = [...new Set(result.map((p) => p.sub_system).filter((s) => s))].sort() as string[];
    } else if (level === 'component' && sbu && category && system && sub_system) {
      const result = await marginPolicyService.getAllMarginPolicies({
        sbu: sbu as string,
        category: category as string,
        system: system as string,
      });
      const filtered = result.filter((p) => p.sub_system === sub_system);
      values = [...new Set(filtered.map((p) => p.component).filter((c) => c))].sort() as string[];
    }

    res.status(200).json({
      success: true,
      data: values,
    });
  } catch (error: any) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hierarchy',
      error: error.message,
    });
  }
}
