import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * TDD-016: Invoice Otomatis dari Milestone
 * Auto-generate invoices from project milestones (30%, 70%, Handover)
 */

// GET /api/invoice-milestones
export const getAllInvoiceMilestones = async (req: Request, res: Response) => {
  try {
    const { project_id, invoice_id, status, milestone_type } = req.query;

    const where: any = {};
    if (project_id) where.project_id = project_id;
    if (invoice_id) where.invoice_id = invoice_id;
    if (status) where.status = status;
    if (milestone_type) where.milestone_type = milestone_type;

    const milestones = await prisma.invoice_milestones.findMany({
      where,
      include: {
        invoices: {
          select: {
            invoice_number: true,
            total_amount: true,
            status: true,
          },
        },
      },
      orderBy: [
        { created_at: 'desc' },
      ],
    });

    // Map to include invoice_number at root level
    const mapped = milestones.map(m => ({
      ...m,
      invoice_number: m.invoices?.invoice_number || null,
      invoice_amount: m.invoices?.total_amount || null,
      invoice_status: m.invoices?.status || null,
    }));

    res.status(200).json({
      success: true,
      data: mapped,
      count: mapped.length,
    });
  } catch (error: any) {
    console.error('Error fetching invoice milestones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice milestones',
      error: error.message,
    });
  }
};

// GET /api/invoice-milestones/:id
export const getInvoiceMilestoneById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const milestone = await prisma.invoice_milestones.findUnique({
      where: { id },
      include: {
        invoices: true,
      },
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Invoice milestone not found',
      });
    }

    res.status(200).json({
      success: true,
      data: milestone,
    });
  } catch (error: any) {
    console.error('Error fetching invoice milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoice milestone',
      error: error.message,
    });
  }
};

// POST /api/invoice-milestones
export const createInvoiceMilestone = async (req: Request, res: Response) => {
  try {
    const { 
      invoice_id, 
      project_id, 
      milestone_type, 
      milestone_name,
      percentage, 
      expected_amount,
      expected_date,
      notes 
    } = req.body;

    // Validation
    if (!invoice_id || !invoice_id.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'invoice_id is required',
      });
    }
    if (!milestone_type || !milestone_type.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'milestone_type is required',
      });
    }
    if (percentage === undefined || percentage === null || isNaN(Number(percentage))) {
      return res.status(400).json({
        success: false,
        message: 'percentage is required',
      });
    }

    // Check valid milestone type
    const validTypes = ['Progress30', 'Progress70', 'Handover', 'Retention', 'Custom'];
    if (!validTypes.includes(milestone_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid milestone_type. Must be: Progress30, Progress70, Handover, Retention, or Custom',
      });
    }

    // Check percentage range (0-100)
    const pct = Number(percentage);
    if (pct < 0 || pct > 100) {
      return res.status(400).json({
        success: false,
        message: 'Percentage must be between 0 and 100',
      });
    }

    const milestone = await prisma.invoice_milestones.create({
      data: {
        id: uuidv4(),
        invoice_id,
        project_id: project_id || null,
        milestone_type,
        milestone_name: milestone_name || milestone_type,
        percentage: pct,
        expected_amount: expected_amount ? Number(expected_amount) : 0,
        expected_date: expected_date ? new Date(expected_date) : null,
        actual_date: null,
        status: 'Pending',
        notes: notes || null,
        updated_at: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Invoice milestone created successfully',
      data: milestone,
    });
  } catch (error: any) {
    console.error('Error creating invoice milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create invoice milestone',
      error: error.message,
    });
  }
};

// PUT /api/invoice-milestones/:id
export const updateInvoiceMilestone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      invoice_id,
      project_id,
      milestone_type,
      milestone_name,
      percentage,
      expected_amount,
      expected_date,
      actual_date,
      status,
      notes,
    } = req.body;

    const existing = await prisma.invoice_milestones.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Invoice milestone not found',
      });
    }

    // Prevent update if already billed
    if (existing.status === 'Billed' && status !== 'Billed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update milestone that has been billed',
      });
    }

    const data: any = {};
    if (invoice_id !== undefined) {
      if (!invoice_id || !invoice_id.toString().trim()) {
        return res.status(400).json({
          success: false,
          message: 'invoice_id is required',
        });
      }
      data.invoice_id = invoice_id;
    }
    if (project_id !== undefined) data.project_id = project_id || null;
    if (milestone_type !== undefined) {
      if (!milestone_type || !milestone_type.toString().trim()) {
        return res.status(400).json({
          success: false,
          message: 'milestone_type is required',
        });
      }
      // Check valid milestone type
      const validTypes = ['Progress30', 'Progress70', 'Handover', 'Retention', 'Custom'];
      if (!validTypes.includes(milestone_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid milestone_type. Must be: Progress30, Progress70, Handover, Retention, or Custom',
        });
      }
      data.milestone_type = milestone_type;
    }
    if (milestone_name !== undefined) data.milestone_name = milestone_name;
    if (percentage !== undefined) {
      const pct = Number(percentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({
          success: false,
          message: 'Percentage must be between 0 and 100',
        });
      }
      data.percentage = pct;
    }
    if (expected_amount !== undefined) data.expected_amount = Number(expected_amount);
    if (expected_date !== undefined) data.expected_date = expected_date ? new Date(expected_date) : null;
    if (actual_date !== undefined) data.actual_date = actual_date ? new Date(actual_date) : null;
    if (status) {
      data.status = status;
      // Auto-set actual_date when completing
      if (status === 'Completed' && !data.actual_date) {
        data.actual_date = new Date();
      }
    }
    if (notes !== undefined) data.notes = notes;

    const updated = await prisma.invoice_milestones.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      message: 'Invoice milestone updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating invoice milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice milestone',
      error: error.message,
    });
  }
};

// DELETE /api/invoice-milestones/:id
export const deleteInvoiceMilestone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.invoice_milestones.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Invoice milestone not found',
      });
    }

    // Prevent delete if already billed
    if (existing.status === 'Billed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete milestone that has been billed',
      });
    }

    await prisma.invoice_milestones.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Invoice milestone deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting invoice milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete invoice milestone',
      error: error.message,
    });
  }
};

// POST /api/invoice-milestones/:id/trigger
export const triggerInvoiceGeneration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const milestone = await prisma.invoice_milestones.findUnique({
      where: { id },
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Invoice milestone not found',
      });
    }

    if (milestone.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot trigger milestone with status: ${milestone.status}`,
      });
    }

    // TODO: Implement actual invoice generation logic
    // 1. Fetch project details from engineering service
    // 2. Calculate invoice amount (project value * percentage)
    // 3. Generate invoice with auto-number
    // 4. Generate PDF + e-Faktur XML
    // 5. Send email to customer + CC finance
    // 6. Update milestone status to Triggered → Invoiced

    // For now, just mark as InProgress
    const updated = await prisma.invoice_milestones.update({
      where: { id },
      data: {
        status: 'InProgress',
        triggered_at: new Date(),
        updated_at: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Invoice generation triggered successfully',
      data: updated,
      note: 'Invoice generation logic will be implemented in next sprint',
    });
  } catch (error: any) {
    console.error('Error triggering invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger invoice generation',
      error: error.message,
    });
  }
};

// GET /api/invoice-milestones/project/:project_id
export const getMilestonesByProject = async (req: Request, res: Response) => {
  try {
    const { project_id } = req.params;

    const milestones = await prisma.invoice_milestones.findMany({
      where: { project_id },
      include: {
        invoices: {
          select: {
            invoice_number: true,
            total_amount: true,
            status: true,
          },
        },
      },
      orderBy: { milestone_type: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: milestones,
      count: milestones.length,
    });
  } catch (error: any) {
    console.error('Error fetching project milestones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project milestones',
      error: error.message,
    });
  }
};
