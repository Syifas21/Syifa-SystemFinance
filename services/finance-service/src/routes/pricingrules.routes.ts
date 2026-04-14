import express from 'express';
import {
  getAllPricingRules,
  getPricingRuleById,
  getPricingRuleByCategory,
  createPricingRule,
  updatePricingRule,
  deletePricingRule
} from '../controllers/pricingrules.controllers';

const router = express.Router();

// GET all pricing rules
router.get('/', getAllPricingRules);

// GET pricing rule by ID
router.get('/:id', getPricingRuleById);

// GET pricing rule by category
router.get('/category/:category', getPricingRuleByCategory);

// POST create new pricing rule
router.post('/', createPricingRule);

// PUT update pricing rule
router.put('/:id', updatePricingRule);

// DELETE pricing rule
router.delete('/:id', deletePricingRule);

export default router;
