import { Router } from 'express';
import {
  getPendingQuickActions,
  approveMilestone,
  approveInvoice,
} from '../controllers/quick-actions.controller';
import { verifyToken } from '../middlewares/auth.middlewares';

const router = Router();

/**
 * Quick Actions Routes
 * Base path: /api/quick-actions
 * All routes require authentication
 */

// GET /api/quick-actions/pending - Get all pending items (filtered by user role)
router.get('/pending', verifyToken, getPendingQuickActions);

// PATCH /api/quick-actions/approve/:milestoneId - Approve a milestone
router.patch('/approve/:milestoneId', verifyToken, approveMilestone);

// PATCH /api/quick-actions/invoice/:invoiceId/approve - Approve an invoice
router.patch('/invoice/:invoiceId/approve', verifyToken, approveInvoice);

export default router;
