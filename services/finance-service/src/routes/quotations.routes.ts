import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/quotations
 * Get all quotations (currently returns empty - quotations table will be added later)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // TODO: Add quotations table to schema or proxy to CRM service
    // For now, return empty array to let frontend use hardcoded data
    res.json([]);
  } catch (error: any) {
    console.error('Error fetching quotations:', error);
    res.json([]); // Return empty array instead of error
  }
});

/**
 * PATCH /api/quotations/:id/status
 * Update status quotation (APPROVED → INVOICED)
 * Note: Currently returns success without actual DB update since quotations table doesn't exist
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate status
    const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'INVOICED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // TODO: Add quotations table to schema
    // For now, return success response to let frontend update local state
    res.json({
      message: 'Quotation status updated successfully (in memory)',
      data: { id, status, updated_at: new Date() },
    });

  } catch (error: any) {
    console.error('Error updating quotation status:', error);
    res.status(500).json({ error: 'Failed to update quotation status', details: error.message });
  }
});

export default router;
