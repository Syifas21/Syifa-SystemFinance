// Journal Entries Controller
import { Request, Response } from 'express';
import journalEntriesService from '../services/journalentries.service';

class JournalEntriesController {
  /**
   * GET /api/finance/journal-entries
   * Get all journal entries with optional filters
   */
  async getAllJournalEntries(req: Request, res: Response) {
    try {
      const { account_id, start_date, end_date } = req.query;

      console.log('📊 Getting journal entries with filters:', { account_id, start_date, end_date });

      // Use raw query instead of model (temporary workaround)
      let query = `SELECT je.*, ca.account_code, ca.account_name, ca.account_type 
                   FROM journal_entries je 
                   LEFT JOIN "ChartOfAccounts" ca ON je.account_id = ca.id 
                   WHERE 1=1`;
      
      const params: any[] = [];
      
      if (account_id) {
        params.push(parseInt(account_id as string));
        query += ` AND je.account_id = $${params.length}`;
      }
      
      if (start_date) {
        params.push(start_date);
        query += ` AND je.transaction_date >= $${params.length}::date`;
      }
      
      if (end_date) {
        params.push(end_date);
        query += ` AND je.transaction_date <= $${params.length}::date`;
      }
      
      query += ` ORDER BY je.transaction_date DESC`;

      const entries: any[] = await journalEntriesService.prisma.$queryRawUnsafe(query, ...params);

      console.log(`✅ Found ${entries.length} journal entries from database`);

      // Serialize for JSON
      const serializedEntries = entries.map((entry: any) => ({
        id: entry.id.toString(),
        transaction_date: entry.transaction_date,
        description: entry.description,
        account_id: entry.account_id,
        debit: entry.debit ? entry.debit.toString() : null,
        credit: entry.credit ? entry.credit.toString() : null,
        reference_id: entry.reference_id,
        reference_type: entry.reference_type,
        created_by: entry.created_by,
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        account: entry.account_code ? {
          id: entry.account_id,
          account_code: entry.account_code,
          account_name: entry.account_name,
          account_type: entry.account_type,
        } : null,
      }));

      res.status(200).json({
        success: true,
        message: 'Journal entries retrieved successfully from database',
        data: serializedEntries,
      });
    } catch (error: any) {
      console.error('❌ Error in getAllJournalEntries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve journal entries',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/finance/journal-entries/account/:accountId
   * Get journal entries by account ID
   */
  async getByAccountId(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const entries = await journalEntriesService.getByAccountId(parseInt(accountId));

      const serializedEntries = entries.map((entry) => ({
        ...entry,
        id: entry.id.toString(),
        debit: entry.debit ? entry.debit.toString() : null,
        credit: entry.credit ? entry.credit.toString() : null,
      }));

      res.status(200).json({
        success: true,
        message: 'Journal entries retrieved successfully',
        data: serializedEntries,
      });
    } catch (error: any) {
      console.error('Error in getByAccountId:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve journal entries',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/finance/journal-entries/:id
   * Get a single journal entry by ID
   */
  async getJournalEntryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const entry = await journalEntriesService.getJournalEntryById(id);

      const serializedEntry = {
        ...entry,
        id: entry.id.toString(),
        debit: entry.debit ? entry.debit.toString() : null,
        credit: entry.credit ? entry.credit.toString() : null,
      };

      res.status(200).json({
        success: true,
        message: 'Journal entry retrieved successfully',
        data: serializedEntry,
      });
    } catch (error: any) {
      console.error('Error in getJournalEntryById:', error);
      const statusCode = error.message === 'Journal entry not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve journal entry',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/finance/journal-entries
   * Create a new journal entry
   */
  async createJournalEntry(req: Request, res: Response) {
    try {
      const data = req.body;

      // Validate required fields
      if (!data.transaction_date || !data.account_id) {
        return res.status(400).json({
          success: false,
          message: 'transaction_date and account_id are required',
        });
      }

      const entry = await journalEntriesService.createJournalEntry(data);

      const serializedEntry = {
        ...entry,
        id: entry.id.toString(),
        debit: entry.debit ? entry.debit.toString() : null,
        credit: entry.credit ? entry.credit.toString() : null,
      };

      res.status(201).json({
        success: true,
        message: 'Journal entry created successfully',
        data: serializedEntry,
      });
    } catch (error: any) {
      console.error('Error in createJournalEntry:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create journal entry',
        error: error.message,
      });
    }
  }

  /**
   * PUT /api/finance/journal-entries/:id
   * Update a journal entry
   */
  async updateJournalEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      const entry = await journalEntriesService.updateJournalEntry(id, data);

      const serializedEntry = {
        ...entry,
        id: entry.id.toString(),
        debit: entry.debit ? entry.debit.toString() : null,
        credit: entry.credit ? entry.credit.toString() : null,
      };

      res.status(200).json({
        success: true,
        message: 'Journal entry updated successfully',
        data: serializedEntry,
      });
    } catch (error: any) {
      console.error('Error in updateJournalEntry:', error);
      const statusCode = error.message === 'Journal entry not found' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update journal entry',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /api/finance/journal-entries/:id
   * Delete a journal entry
   */
  async deleteJournalEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await journalEntriesService.deleteJournalEntry(id);

      res.status(200).json({
        success: true,
        message: 'Journal entry deleted successfully',
      });
    } catch (error: any) {
      console.error('Error in deleteJournalEntry:', error);
      const statusCode = error.message === 'Journal entry not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete journal entry',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/finance/journal-entries/account/:accountId/balance
   * Get account balance summary
   */
  async getAccountBalance(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      const balance = await journalEntriesService.getAccountBalance(parseInt(accountId));

      res.status(200).json({
        success: true,
        message: 'Account balance retrieved successfully',
        data: balance,
      });
    } catch (error: any) {
      console.error('Error in getAccountBalance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve account balance',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/finance/journal-entries/general
   * Create a General Journal Entry with multiple lines
   * Per TSD FITUR 3.4.C - Form input manual untuk transaksi non-proyek
   */
  async createGeneralJournal(req: Request, res: Response) {
    try {
      const data = req.body;

      console.log('📝 Creating general journal entry:', {
        date: data.transaction_date,
        description: data.description,
        lines: data.lines?.length
      });

      // Validasi required fields
      if (!data.transaction_date || !data.description || !data.lines) {
        return res.status(400).json({
          success: false,
          message: 'transaction_date, description, and lines are required',
        });
      }

      // Validasi balance (Total Debit = Total Credit)
      const totalDebit = data.lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
      const totalCredit = data.lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({
          success: false,
          message: `Total Debit dan Kredit harus seimbang. Debit: ${totalDebit}, Kredit: ${totalCredit}`,
        });
      }

      try {
        const result = await journalEntriesService.createGeneralJournal(data);

        // Serialize BigInt dan Decimal untuk JSON
        const serializedResult = {
          ...result,
          lines: result.lines.map((line: any) => ({
            ...line,
            id: line.id.toString(),
            debit: line.debit ? line.debit.toString() : null,
            credit: line.credit ? line.credit.toString() : null,
          })),
        };

        console.log(`✅ General journal created successfully. Reference ID: ${result.reference_id}`);

        res.status(201).json({
          success: true,
          message: 'General journal entry created successfully from database',
          data: serializedResult,
        });
      } catch (dbError: any) {
        console.error('❌ Database error when creating general journal:', dbError);
        res.status(500).json({
          success: false,
          message: 'Failed to create general journal entry',
          error: dbError.message,
        });
      }
    } catch (error: any) {
      console.error('❌ Error in createGeneralJournal:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create general journal entry',
        error: error.message,
      });
    }
  }
}

export default new JournalEntriesController();
