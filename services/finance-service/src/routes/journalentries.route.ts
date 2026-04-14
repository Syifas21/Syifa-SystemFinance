// Journal Entries Routes
import { Router } from 'express';
import journalEntriesController from '../controllers/journalentries.controllers';

const router = Router();

/**
 * @route   GET /api/finance/journal-entries
 * @desc    Get all journal entries with optional filters
 * @query   account_id, start_date, end_date
 */
router.get('/', journalEntriesController.getAllJournalEntries);

/**
 * @route   GET /api/finance/journal-entries/account/:accountId
 * @desc    Get journal entries by account ID
 */
router.get('/account/:accountId', journalEntriesController.getByAccountId);

/**
 * @route   GET /api/finance/journal-entries/account/:accountId/balance
 * @desc    Get account balance summary
 */
router.get('/account/:accountId/balance', journalEntriesController.getAccountBalance);

/**
 * @route   GET /api/finance/journal-entries/:id
 * @desc    Get a single journal entry by ID
 */
router.get('/:id', journalEntriesController.getJournalEntryById);

/**
 * @route   POST /api/finance/journal-entries
 * @desc    Create a new journal entry
 */
router.post('/', journalEntriesController.createJournalEntry);

/**
 * @route   PUT /api/finance/journal-entries/:id
 * @desc    Update a journal entry
 */
router.put('/:id', journalEntriesController.updateJournalEntry);

/**
 * @route   DELETE /api/finance/journal-entries/:id
 * @desc    Delete a journal entry
 */
router.delete('/:id', journalEntriesController.deleteJournalEntry);

/**
 * @route   POST /api/finance/journal-entries/general
 * @desc    Create a general journal entry with multiple lines (double-entry)
 * @access  Finance Admin
 */
router.post('/general', journalEntriesController.createGeneralJournal);

export default router;
