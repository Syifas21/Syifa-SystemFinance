import { Router } from 'express';
import * as reportsControllers from '../controllers/reports.controllers';

const router = Router();

/**
 * Financial Reports Routes
 * Base path: /api/reports
 */

// General Ledger (Buku Besar)
router.get('/general-ledger/:accountId', reportsControllers.getGeneralLedger);
router.get('/general-ledger-bulk', reportsControllers.getGeneralLedgerBulk);

// Trial Balance (Neraca Saldo)
router.get('/trial-balance', reportsControllers.getTrialBalance);
router.get('/trial-balance-by-type', reportsControllers.getTrialBalanceByType);

// Balance Sheet (Neraca)
router.get('/balance-sheet', reportsControllers.getBalanceSheet);
router.get('/balance-sheet-summary', reportsControllers.getBalanceSheetSummary);

// Income Statement (Laporan Laba Rugi)
router.get('/income-statement', reportsControllers.getIncomeStatement);
router.get('/income-statement-summary', reportsControllers.getIncomeStatementSummary);

// Universal Financial Report - Per TSD FITUR 3.4.D
router.get('/financial', reportsControllers.getFinancialReport);

export default router;
