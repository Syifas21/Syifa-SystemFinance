// ============================================
// PROJECT FINANCE - Bank Reconciliation Routes
// ============================================

import { Router, Request, Response } from 'express';
import { bankReconciliationService } from '../services/bank-reconciliation.service';
import { verifyToken } from '../middlewares/auth.middlewares';
import {
  getAllReconciliations,
  getReconciliationById,
  createReconciliation,
  updateReconciliation,
  deleteReconciliation,
  matchTransactions,
  completeReconciliation,
} from '../controllers/bank-reconciliation.controller';

const router = Router();

// All routes require authentication
// router.use(verifyToken);

// CRUD Routes
router.get('/', getAllReconciliations);
router.get('/:id', getReconciliationById);
router.post('/', createReconciliation);
router.put('/:id', updateReconciliation);
router.delete('/:id', deleteReconciliation);

// Action Routes
router.post('/:id/match', matchTransactions);
router.post('/:id/complete', completeReconciliation);

// ============================================
// Get Bank Statement (Simulated)
// ============================================

router.post('/bank-statement', async (req: Request, res: Response) => {
  try {
    const { account_number, start_date, end_date } = req.body;

    if (!account_number || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'account_number, start_date, and end_date are required',
      });
    }

    const statement = await bankReconciliationService.getBankStatement({
      account_number,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
    });

    res.json({
      success: true,
      data: statement,
    });
  } catch (error) {
    console.error('Error fetching bank statement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank statement',
    });
  }
});

// ============================================
// Create Reconciliation Report
// ============================================

router.post('/reconciliation-report', async (req: Request, res: Response) => {
  try {
    const { account_number, start_date, end_date } = req.body;

    if (!account_number || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'account_number, start_date, and end_date are required',
      });
    }

    const report = await bankReconciliationService.createReconciliationReport({
      account_number,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error creating reconciliation report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reconciliation report',
    });
  }
});

// ============================================
// Test Bank Connection (Simulated)
// ============================================

router.post('/test-connection', async (req: Request, res: Response) => {
  try {
    const { bank_code } = req.body;

    if (!bank_code) {
      return res.status(400).json({
        success: false,
        message: 'bank_code is required',
      });
    }

    const result = await bankReconciliationService.testBankConnection(bank_code);

    res.json(result);
  } catch (error) {
    console.error('Error testing bank connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test bank connection',
    });
  }
});

// ============================================
// Get Supported Banks
// ============================================

router.get('/supported-banks', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { code: 'MANDIRI', name: 'Bank Mandiri', logo: '🏦' },
      { code: 'BCA', name: 'Bank Central Asia', logo: '🏦' },
      { code: 'BNI', name: 'Bank Negara Indonesia', logo: '🏦' },
      { code: 'BRI', name: 'Bank Rakyat Indonesia', logo: '🏦' },
      { code: 'CIMB', name: 'CIMB Niaga', logo: '🏦' },
    ],
  });
});

export default router;
