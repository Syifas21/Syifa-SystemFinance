import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

/**
 * FITUR 3.4.C: General Journal Entry
 * Pencatatan Transaksi Umum (Jurnal Umum)
 * 
 * For transactions that don't come from other modules:
 * - Office purchases (air galon, ATK) from petty cash
 * - Routine bill payments (electricity, internet, rent)
 * - Non-project revenue (e.g., bank interest)
 * - Month-end adjustments/corrections
 */

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/journal-entries/general
 * Create general journal entry with double-entry validation
 */
router.post('/general', async (req: Request, res: Response) => {
  try {
    const {
      transaction_date,
      description,
      document_url,
      entries,
      created_by
    } = req.body;

    // 1. Validate Input
    if (!transaction_date || !description || !entries || !Array.isArray(entries)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: transaction_date, description, entries'
      });
    }

    if (entries.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 journal entries are required (debit and credit)'
      });
    }

    // 2. Validate Balance (CRUCIAL!)
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      // Validate account exists
      const account = await prisma.chartOfAccounts.findUnique({
        where: { id: entry.account_id }
      });

      if (!account) {
        return res.status(400).json({
          success: false,
          message: `Invalid account ID: ${entry.account_id}`
        });
      }

      const debit = parseFloat(entry.debit || 0);
      const credit = parseFloat(entry.credit || 0);

      totalDebit += debit;
      totalCredit += credit;
    }

    // Check balance
    if (totalDebit !== totalCredit) {
      return res.status(400).json({
        success: false,
        message: `Debit (${totalDebit}) and Credit (${totalCredit}) must be balanced!`,
        totalDebit,
        totalCredit,
        difference: Math.abs(totalDebit - totalCredit)
      });
    }

    if (totalDebit === 0 || totalCredit === 0) {
      return res.status(400).json({
        success: false,
        message: 'Total Debit and Credit cannot be zero'
      });
    }

    // 3. Process in Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction header for grouping
      const transactionHeader = await tx.journal_entries.create({
        data: {
          transaction_date: new Date(transaction_date),
          description: `[HEADER] ${description}`,
          account_id: entries[0].account_id, // Use first account as reference
          debit: 0,
          credit: 0,
          reference_type: 'GENERAL_JOURNAL_HEADER',
          created_by: created_by || 'system'
        }
      });

      const transactionId = transactionHeader.id;

      // Create all journal entries with same transaction ID
      const journalEntries = [];
      for (const entry of entries) {
        const journalEntry = await tx.journal_entries.create({
          data: {
            transaction_date: new Date(transaction_date),
            description,
            account_id: entry.account_id,
            debit: parseFloat(entry.debit || 0),
            credit: parseFloat(entry.credit || 0),
            reference_id: String(transactionId),
            reference_type: 'GENERAL_JOURNAL',
            created_by: created_by || 'system'
          },
          include: {
            ChartOfAccounts: {
              select: {
                account_code: true,
                account_name: true
              }
            }
          }
        });

        journalEntries.push(journalEntry);
      }

      return { transactionHeader, journalEntries };
    });

    console.log(`✅ General journal entry created: ${result.transactionHeader.id} with ${result.journalEntries.length} entries`);

    res.status(201).json({
      success: true,
      message: 'General journal entry posted successfully',
      data: {
        transaction_id: result.transactionHeader.id,
        status: 'Posted',
        total_debit: totalDebit,
        total_credit: totalCredit,
        entries_count: result.journalEntries.length,
        entries: result.journalEntries
      }
    });

  } catch (error: any) {
    console.error('❌ Error creating general journal entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create general journal entry',
      error: error.message
    });
  }
});

/**
 * GET /api/journal-entries/general
 * Get list of general journal entries
 */
router.get('/general', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, limit = 50 } = req.query;

    const where: any = {
      reference_type: 'GENERAL_JOURNAL'
    };

    if (start_date && end_date) {
      where.transaction_date = {
        gte: new Date(start_date as string),
        lte: new Date(end_date as string)
      };
    }

    const entries = await prisma.journal_entries.findMany({
      where,
      include: {
        account: {
          select: {
            account_code: true,
            account_name: true,
            account_type: true
          }
        }
      },
      orderBy: {
        transaction_date: 'desc'
      },
      take: parseInt(limit as string)
    });

    // Group by reference_id (transaction ID)
    const grouped: any = {};
    entries.forEach(entry => {
      const refId = entry.reference_id || entry.id;
      if (!grouped[refId]) {
        grouped[refId] = {
          transaction_id: refId,
          transaction_date: entry.transaction_date,
          description: entry.description,
          entries: [],
          total_debit: 0,
          total_credit: 0
        };
      }
      grouped[refId].entries.push(entry);
      grouped[refId].total_debit += parseFloat(entry.debit?.toString() || '0');
      grouped[refId].total_credit += parseFloat(entry.credit?.toString() || '0');
    });

    const transactions = Object.values(grouped);

    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });

  } catch (error: any) {
    console.error('❌ Error fetching general journal entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch general journal entries',
      error: error.message
    });
  }
});

/**
 * GET /api/accounts/search
 * Search chart of accounts for autocomplete
 */
router.get('/accounts/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" is required'
      });
    }

    const accounts = await prisma.chartOfAccounts.findMany({
      where: {
        OR: [
          { account_code: { contains: q, mode: 'insensitive' } },
          { account_name: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        account_code: true,
        account_name: true,
        account_type: true
      },
      take: 20,
      orderBy: {
        account_code: 'asc'
      }
    });

    res.json({
      success: true,
      data: accounts,
      count: accounts.length
    });

  } catch (error: any) {
    console.error('❌ Error searching accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search accounts',
      error: error.message
    });
  }
});

export default router;
