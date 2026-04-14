import { Router } from 'express';
import * as marginPolicyController from '../controllers/margin-policies.controller';

const router = Router();

// GET /api/margin-policies - Get all margin policies
router.get('/', marginPolicyController.getAllMarginPolicies);

// GET /api/margin-policies/hierarchy - Get hierarchical filter values
router.get('/hierarchy', marginPolicyController.getHierarchy);

// GET /api/margin-policies/violations - Get margin violations
router.get('/violations', marginPolicyController.getViolations);

// GET /api/margin-policies/violations/:id - Get single violation
router.get('/violations/:id', marginPolicyController.getViolationById);

// POST /api/margin-policies - Create new margin policy
router.post('/', marginPolicyController.createMarginPolicy);

// POST /api/margin-policies/find - Find margin policy with fallback
router.post('/find', marginPolicyController.findMarginPolicy);

// POST /api/margin-policies/validate - Validate pricing against policy
router.post('/validate', marginPolicyController.validateMargin);

// POST /api/margin-policies/calculate-price - Calculate selling price
router.post('/calculate-price', marginPolicyController.calculatePrice);

// POST /api/margin-policies/log-violation - Log margin violation
router.post('/log-violation', marginPolicyController.logViolation);

// PUT /api/margin-policies/:id - Update margin policy
router.put('/:id', marginPolicyController.updateMarginPolicy);

// PUT /api/margin-policies/violations/:id/approve - CEO approves violation
router.put('/violations/:id/approve', marginPolicyController.approveViolation);

// PUT /api/margin-policies/violations/:id/reject - CEO rejects violation
router.put('/violations/:id/reject', marginPolicyController.rejectViolation);

// DELETE /api/margin-policies/:id - Delete margin policy
router.delete('/:id', marginPolicyController.deleteMarginPolicy);

export default router;
