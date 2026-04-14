import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/v1/quick-actions/pending
 * Get pending items that require approval/action
 * Includes invoice details for each milestone to ensure data consistency
 */
export const getPendingQuickActions = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role; // Get role from auth middleware
    console.log(`📋 [Quick Actions] Fetching pending items for role: ${userRole}...`);

    let pendingMilestones: any[] = [];
    let pendingInvoices: any[] = [];

    // CEO: Strategic approvals (High-value milestones only)
    if (userRole === 'CEO' || userRole === 'ceo') {
      console.log('👑 CEO Mode - Filtering strategic items only');
      
      // CEO: Only high-value milestones (>50%)
      pendingMilestones = await prisma.invoice_milestones.findMany({
        where: {
          status: 'Pending',
          percentage: { gte: 50 },  // Only 50%+ milestones
        },
        include: {
          invoices: true,
        },
        orderBy: {
          percentage: 'desc',  // Highest % first
        },
        take: 20,
      });

      // CEO: Only high-value invoices (>100M)
      pendingInvoices = await prisma.invoices.findMany({
        where: {
          status: 'DRAFT',
          total_amount: { gte: 100000000 },  // Only 100M+
        },
        orderBy: {
          total_amount: 'desc',
        },
        take: 20,
      });
    } 
    // FINANCE_ADMIN: All operational items
    else {
      console.log('💼 Finance Admin Mode - All pending items');
      
      // Finance: ALL pending milestones
      pendingMilestones = await prisma.invoice_milestones.findMany({
        where: {
          status: 'Pending',
        },
        include: {
          invoices: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 50,
      });

      // Finance: ALL pending invoices
      pendingInvoices = await prisma.invoices.findMany({
        where: {
          status: 'DRAFT',
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 50,
      });
    }

    console.log(`✅ Found ${pendingMilestones.length} milestones for ${userRole}`);
    console.log(`✅ Found ${pendingInvoices.length} invoices for ${userRole}`);

    // Format milestone data with invoice context (INCLUDE ALL, even with null invoice)
    const formattedMilestones = pendingMilestones.map((m) => {
      const formatted = {
        id: m.id,
        milestone_type: m.milestone_type,
        milestone_name: m.milestone_name,
        percentage: m.percentage,
        expected_amount: m.expected_amount,
        expected_date: m.expected_date,
        created_at: m.created_at,
        invoice: m.invoices
          ? {
              id: m.invoices.id,
              invoice_number: m.invoices.invoice_number,
              customer_name: m.invoices.customer_name,
              total_amount: m.invoices.total_amount,
            }
          : null,
      };
      console.log(`   📝 Milestone: ${m.milestone_name || m.milestone_type} | Invoice: ${m.invoices?.customer_name || 'NO_INVOICE'}`);
      return formatted;
    });

    const quickActions = {
      pending_approvals: formattedMilestones.length,
      pending_invoices: pendingInvoices.length,
      pending_milestones: formattedMilestones,
      pending_invoices_list: pendingInvoices,
      total_pending: formattedMilestones.length + pendingInvoices.length,
      summary: {
        total_milestone_value: formattedMilestones.reduce((sum, m) => {
          return sum + (parseFloat(m.expected_amount as any) || 0);
        }, 0),
        total_invoice_value: pendingInvoices.reduce((sum, inv) => {
          return sum + parseFloat(inv.total_amount as any);
        }, 0),
      },
    };

    console.log(`✅ QUICK ACTIONS BREAKDOWN:`);
    console.log(`   Role: ${userRole}`);
    console.log(`   Milestones: ${formattedMilestones.length}`);
    console.log(`   Invoices: ${pendingInvoices.length}`);
    console.log(`   TOTAL: ${formattedMilestones.length + pendingInvoices.length}`);

    res.status(200).json({
      success: true,
      data: quickActions,
      user_role: userRole,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ [Quick Actions] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quick actions',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/v1/quick-actions/approve/:milestoneId
 * Approve a milestone (change status from Pending to Completed/Billed)
 * Returns full milestone + invoice details for notification
 */
export const approveMilestone = async (req: Request, res: Response) => {
  try {
    const { milestoneId } = req.params;
    const { status = 'Completed' } = req.body; // Default to Completed

    const validStatuses = ['InProgress', 'Completed', 'Billed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // First, check if milestone exists AND get its current data
    const milestone = await prisma.invoice_milestones.findUnique({
      where: { id: milestoneId },
      include: {
        invoices: {
          select: {
            id: true,
            invoice_number: true,
            customer_name: true,
            total_amount: true,
          },
        },
      },
    });

    if (!milestone) {
      console.warn(`⚠️ Milestone ${milestoneId} not found!`);
      return res.status(404).json({
        success: false,
        message: 'Milestone not found',
      });
    }

    if (milestone.status !== 'Pending') {
      console.warn(`⚠️ Milestone ${milestoneId} is already ${milestone.status}, cannot approve`);
      return res.status(400).json({
        success: false,
        message: `Milestone is already ${milestone.status}. Cannot approve.`,
      });
    }

    // Update milestone status
    const updated = await prisma.invoice_milestones.update({
      where: { id: milestoneId },
      data: {
        status: status as any,
        updated_at: new Date(),
      },
      include: {
        invoices: {
          select: {
            id: true,
            invoice_number: true,
            customer_name: true,
            total_amount: true,
          },
        },
      },
    });

    console.log(
      `✅ Milestone ${milestoneId} approved! Status: Pending → ${status}. Invoice: ${updated.invoices?.invoice_number}`
    );

    res.status(200).json({
      success: true,
      message: 'Milestone approved successfully',
      data: {
        milestone_id: updated.id,
        milestone_type: updated.milestone_type,
        milestone_name: updated.milestone_name,
        previous_status: 'Pending',
        new_status: updated.status,
        percentage: updated.percentage,
        expected_amount: updated.expected_amount,
        invoice: updated.invoices,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('❌ [Quick Actions] Approval Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve milestone',
      error: error.message,
    });
  }
};

/**
 * PATCH /api/v1/quick-actions/invoice/:invoiceId/approve
 * Approve/send an invoice (change status from DRAFT to SENT)
 * Returns full invoice details for notification
 */
export const approveInvoice = async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;

    // First, check if invoice exists
    const invoice = await prisma.invoices.findUnique({
      where: { id: invoiceId },
      include: {
        invoice_milestones: {
          select: {
            id: true,
            milestone_type: true,
            status: true,
          },
        },
      },
    });

    if (!invoice) {
      console.warn(`⚠️ Invoice ${invoiceId} not found!`);
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    if (invoice.status !== 'DRAFT') {
      console.warn(`⚠️ Invoice ${invoiceId} is already ${invoice.status}, cannot send`);
      return res.status(400).json({
        success: false,
        message: `Invoice is already ${invoice.status}. Cannot send.`,
      });
    }

    // Update invoice status to SENT
    const updated = await prisma.invoices.update({
      where: { id: invoiceId },
      data: {
        status: 'SENT',
        updated_at: new Date(),
      },
      include: {
        invoice_milestones: true,
      },
    });

    console.log(
      `✅ Invoice ${invoiceId} sent! Status: DRAFT → SENT. Invoice #: ${updated.invoice_number}, Customer: ${updated.customer_name}, Amount: Rp${updated.total_amount}`
    );

    res.status(200).json({
      success: true,
      message: 'Invoice sent successfully',
      data: {
        invoice_id: updated.id,
        invoice_number: updated.invoice_number,
        customer_name: updated.customer_name,
        total_amount: updated.total_amount,
        previous_status: 'DRAFT',
        new_status: updated.status,
        milestones_count: updated.invoice_milestones.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('❌ [Quick Actions] Invoice Approval Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve invoice',
      error: error.message,
    });
  }
};
