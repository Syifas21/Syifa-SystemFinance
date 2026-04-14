import express from 'express';
import {
  getAllDiscountPolicies,
  getDiscountPolicyById,
  getDiscountPolicyByRole,
  createDiscountPolicy,
  updateDiscountPolicy,
  deleteDiscountPolicy
} from '../controllers/discountpolicies.controllers';

const router = express.Router();

// GET all discount policies
router.get('/', getAllDiscountPolicies);

// GET discount policy by ID
router.get('/:id', getDiscountPolicyById);

// GET discount policy by role
router.get('/role/:role', getDiscountPolicyByRole);

// POST create new discount policy
router.post('/', createDiscountPolicy);

// PUT update discount policy
router.put('/:id', updateDiscountPolicy);

// DELETE discount policy
router.delete('/:id', deleteDiscountPolicy);

export default router;
