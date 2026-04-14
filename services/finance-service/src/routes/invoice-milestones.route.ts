import { Router } from 'express';
import {
  getAllInvoiceMilestones,
  getInvoiceMilestoneById,
  createInvoiceMilestone,
  updateInvoiceMilestone,
  deleteInvoiceMilestone,
  triggerInvoiceGeneration,
  getMilestonesByProject,
} from '../controllers/invoice-milestones.controller';

const router = Router();

// TDD-016: Invoice Milestones Routes

router.get('/', getAllInvoiceMilestones);
router.get('/project/:project_id', getMilestonesByProject);
router.get('/:id', getInvoiceMilestoneById);
router.post('/', createInvoiceMilestone);
router.put('/:id', updateInvoiceMilestone);
router.delete('/:id', deleteInvoiceMilestone);
router.post('/:id/trigger', triggerInvoiceGeneration);

export default router;
