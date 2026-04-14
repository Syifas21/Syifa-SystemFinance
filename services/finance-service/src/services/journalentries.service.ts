// Journal Entries Service
import { prisma } from '../utils/prisma';

export interface CreateJournalEntryDto {
  transaction_date: string;
  description?: string;
  account_id: number;
  debit?: number;
  credit?: number;
  reference_id?: string;
  reference_type?: string;
  created_by?: string;
}

export interface UpdateJournalEntryDto {
  transaction_date?: string;
  description?: string;
  account_id?: number;
  debit?: number;
  credit?: number;
  reference_id?: string;
  reference_type?: string;
}

export interface JournalEntryFilters {
  account_id?: number;
  start_date?: string;
  end_date?: string;
}

// For General Journal Entry (multi-row form)
export interface GeneralJournalLineDto {
  account_id: number;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface CreateGeneralJournalDto {
  transaction_date: string;
  description: string;
  reference_type?: string;
  reference_id?: string; // Optional: Link to invoice, payment, etc.
  lines: GeneralJournalLineDto[];
  created_by?: string;
}

class JournalEntriesService {
  // Expose prisma for raw queries
  public prisma = prisma;

  /**
   * Get all journal entries with optional filters
   */
  async getAllJournalEntries(filters?: JournalEntryFilters) {
    try {
      let query = `
        SELECT je.*, ca.account_code, ca.account_name, ca.account_type
        FROM journal_entries je
        LEFT JOIN "ChartOfAccounts" ca ON je.account_id = ca.id
        WHERE 1=1
      `;
      
      const params: any[] = [];

      if (filters?.account_id) {
        params.push(filters.account_id);
        query += ` AND je.account_id = $${params.length}`;
      }

      if (filters?.start_date) {
        params.push(filters.start_date);
        query += ` AND je.transaction_date >= $${params.length}::date`;
      }

      if (filters?.end_date) {
        params.push(filters.end_date);
        query += ` AND je.transaction_date <= $${params.length}::date`;
      }

      query += ` ORDER BY je.transaction_date DESC`;

      const entries: any[] = await prisma.$queryRawUnsafe(query, ...params);

      return entries;
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }
  }

  /**
   * Get journal entries by account ID
   */
  async getByAccountId(accountId: number) {
    try {
      const entries: any[] = await prisma.$queryRawUnsafe(`
        SELECT je.*, ca.account_code, ca.account_name, ca.account_type
        FROM journal_entries je
        LEFT JOIN "ChartOfAccounts" ca ON je.account_id = ca.id
        WHERE je.account_id = $1
        ORDER BY je.transaction_date DESC
      `, accountId);

      return entries;
    } catch (error) {
      console.error('Error fetching journal entries by account:', error);
      throw error;
    }
  }

  /**
   * Get a single journal entry by ID
   */
  async getJournalEntryById(id: string) {
    try {
      const entries: any[] = await prisma.$queryRawUnsafe(`
        SELECT je.*, ca.account_code, ca.account_name, ca.account_type
        FROM journal_entries je
        LEFT JOIN "ChartOfAccounts" ca ON je.account_id = ca.id
        WHERE je.id = $1::bigint
      `, id);

      if (!entries || entries.length === 0) {
        throw new Error('Journal entry not found');
      }

      return entries[0];
    } catch (error) {
      console.error('Error fetching journal entry:', error);
      throw error;
    }
  }

  /**
   * Create a new journal entry
   */
  async createJournalEntry(data: CreateJournalEntryDto) {
    try {
      // Validate that either debit or credit is provided (but not both)
      if ((data.debit && data.credit) || (!data.debit && !data.credit)) {
        throw new Error('Either debit or credit must be provided (but not both)');
      }

      // Validate account exists
      const account = await prisma.chartOfAccounts.findUnique({
        where: { id: data.account_id },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // Build dynamic INSERT query based on whether reference_id exists
      let query: string;
      let params: any[];

      if (data.reference_id) {
        // Include reference_id with UUID cast
        query = `
          INSERT INTO journal_entries (
            transaction_date, description, account_id, debit, credit,
            reference_id, reference_type, created_by, created_at, updated_at
          ) VALUES (
            $1::date, $2, $3, $4, $5, $6::uuid, $7, $8, NOW(), NOW()
          ) RETURNING *
        `;
        params = [
          data.transaction_date,
          data.description || null,
          data.account_id,
          data.debit || null,
          data.credit || null,
          data.reference_id,
          data.reference_type || null,
          data.created_by || null
        ];
      } else {
        // Skip reference_id column
        query = `
          INSERT INTO journal_entries (
            transaction_date, description, account_id, debit, credit,
            reference_type, created_by, created_at, updated_at
          ) VALUES (
            $1::date, $2, $3, $4, $5, $6, $7, NOW(), NOW()
          ) RETURNING *
        `;
        params = [
          data.transaction_date,
          data.description || null,
          data.account_id,
          data.debit || null,
          data.credit || null,
          data.reference_type || null,
          data.created_by || null
        ];
      }

      const result: any[] = await prisma.$queryRawUnsafe(query, ...params);
      const entry = result[0];

      // Get account details
      const entryWithAccount: any[] = await prisma.$queryRawUnsafe(`
        SELECT je.*, ca.account_code, ca.account_name, ca.account_type
        FROM journal_entries je
        LEFT JOIN "ChartOfAccounts" ca ON je.account_id = ca.id
        WHERE je.id = $1::bigint
      `, entry.id);

      return entryWithAccount[0];
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  }

  /**
   * Update a journal entry
   */
  async updateJournalEntry(id: string, data: UpdateJournalEntryDto) {
    try {
      // Check if entry exists using raw SQL
      const existing: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM journal_entries WHERE id = $1::bigint',
        id
      );

      if (!existing || existing.length === 0) {
        throw new Error('Journal entry not found');
      }

      // Validate debit/credit if both are being updated
      if (data.debit !== undefined && data.credit !== undefined) {
        if ((data.debit && data.credit) || (!data.debit && !data.credit)) {
          throw new Error('Either debit or credit must be provided (but not both)');
        }
      }

      // Validate account if being updated
      if (data.account_id) {
        const account = await prisma.chartOfAccounts.findUnique({
          where: { id: data.account_id },
        });

        if (!account) {
          throw new Error('Account not found');
        }
      }

      // Build dynamic UPDATE query
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.transaction_date !== undefined) {
        updates.push(`transaction_date = $${paramIndex}::date`);
        values.push(data.transaction_date);
        paramIndex++;
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(data.description);
        paramIndex++;
      }
      if (data.account_id !== undefined) {
        updates.push(`account_id = $${paramIndex}`);
        values.push(data.account_id);
        paramIndex++;
      }
      if (data.debit !== undefined) {
        updates.push(`debit = $${paramIndex}`);
        values.push(data.debit);
        paramIndex++;
      }
      if (data.credit !== undefined) {
        updates.push(`credit = $${paramIndex}`);
        values.push(data.credit);
        paramIndex++;
      }
      if (data.reference_id !== undefined) {
        updates.push(`reference_id = $${paramIndex}`);
        values.push(data.reference_id);
        paramIndex++;
      }
      if (data.reference_type !== undefined) {
        updates.push(`reference_type = $${paramIndex}`);
        values.push(data.reference_type);
        paramIndex++;
      }

      updates.push('updated_at = NOW()');
      values.push(id);

      const query = `
        UPDATE journal_entries
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}::bigint
        RETURNING *
      `;

      const result: any[] = await prisma.$queryRawUnsafe(query, ...values);

      // Get entry with account details
      const entryWithAccount: any[] = await prisma.$queryRawUnsafe(`
        SELECT je.*, ca.account_code, ca.account_name, ca.account_type
        FROM journal_entries je
        LEFT JOIN "ChartOfAccounts" ca ON je.account_id = ca.id
        WHERE je.id = $1::bigint
      `, id);

      return entryWithAccount[0];
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  }

  /**
   * Delete a journal entry
   */
  async deleteJournalEntry(id: string) {
    try {
      // Check if entry exists using raw SQL
      const existing: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM journal_entries WHERE id = $1::bigint',
        id
      );

      if (!existing || existing.length === 0) {
        throw new Error('Journal entry not found');
      }

      // Delete using raw SQL
      await prisma.$queryRawUnsafe(
        'DELETE FROM journal_entries WHERE id = $1::bigint',
        id
      );

      return { message: 'Journal entry deleted successfully' };
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  /**
   * Get account balance summary
   */
  async getAccountBalance(accountId: number) {
    try {
      // Use raw SQL aggregation query
      const result: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          COALESCE(SUM(debit), 0) as total_debit,
          COALESCE(SUM(credit), 0) as total_credit,
          COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0) as balance
        FROM journal_entries
        WHERE account_id = $1
      `, accountId);

      const balance = result[0];

      return {
        account_id: accountId,
        total_debit: Number(balance.total_debit),
        total_credit: Number(balance.total_credit),
        balance: Number(balance.balance),
      };
    } catch (error) {
      console.error('Error calculating account balance:', error);
      throw error;
    }
  }

  /**
   * Create General Journal Entry (Multiple Lines with Balance Validation)
   * Per TSD FITUR 3.4.C - Jurnal Umum untuk transaksi non-proyek
   */
  async createGeneralJournal(data: CreateGeneralJournalDto) {
    try {
      // Validasi: Harus ada minimal 2 baris (debit dan credit)
      if (!data.lines || data.lines.length < 2) {
        throw new Error('General journal must have at least 2 lines (debit and credit)');
      }

      // Validasi: Hitung total debit dan credit
      let totalDebit = 0;
      let totalCredit = 0;
      
      for (const line of data.lines) {
        if (!line.debit && !line.credit) {
          throw new Error('Each line must have either debit or credit amount');
        }
        if (line.debit && line.credit) {
          throw new Error('Each line cannot have both debit and credit');
        }
        
        totalDebit += Number(line.debit || 0);
        totalCredit += Number(line.credit || 0);
      }

      // Validasi keseimbangan: Total Debit = Total Credit
      const difference = Math.abs(totalDebit - totalCredit);
      if (difference > 0.01) { // Toleransi pembulatan 1 sen
        throw new Error(`Journal not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}, Difference: ${difference}`);
      }

      // Validasi: Semua akun harus ada
      const accountIds = data.lines.map(line => line.account_id);
      const accounts = await prisma.chartOfAccounts.findMany({
        where: { id: { in: accountIds } }
      });

      if (accounts.length !== accountIds.length) {
        throw new Error('One or more accounts not found');
      }

      // Generate reference_id untuk grouping entry ini
      // Jika ada reference_id dari caller (e.g., invoiceId), gunakan itu
      // Jika tidak, generate UUID baru
      const { v4: uuidv4 } = await import('uuid');
      const referenceId = data.reference_id || uuidv4();

      // Gunakan transaksi database untuk memastikan atomicity
      const result = await prisma.$transaction(async (tx) => {
        const createdEntries = [];

        for (const line of data.lines) {
          const query = `
            INSERT INTO journal_entries (
              transaction_date, description, account_id, debit, credit,
              reference_id, reference_type, created_by, created_at, updated_at
            ) VALUES (
              $1::date, $2, $3, $4, $5, $6::uuid, $7, $8, NOW(), NOW()
            ) RETURNING *
          `;

          const params = [
            data.transaction_date,
            line.description || data.description,
            line.account_id,
            line.debit || null,
            line.credit || null,
            referenceId,
            data.reference_type || 'GENERAL_JOURNAL',
            data.created_by || 'system'
          ];

          const inserted: any[] = await tx.$queryRawUnsafe(query, ...params);
          createdEntries.push(inserted[0]);
        }

        return createdEntries;
      });

      // Ambil detail lengkap dengan account info
      const entriesWithAccounts: any[] = await prisma.$queryRawUnsafe(`
        SELECT je.*, ca.account_code, ca.account_name, ca.account_type
        FROM journal_entries je
        LEFT JOIN "ChartOfAccounts" ca ON je.account_id = ca.id
        WHERE je.reference_id = $1::uuid
        ORDER BY je.id
      `, referenceId);

      console.log(`✅ Created general journal with ${entriesWithAccounts.length} lines. Reference: ${referenceId}`);

      return {
        reference_id: referenceId,
        transaction_date: data.transaction_date,
        description: data.description,
        total_debit: totalDebit,
        total_credit: totalCredit,
        lines: entriesWithAccounts,
      };
    } catch (error) {
      console.error('Error creating general journal:', error);
      throw error;
    }
  }
}

export default new JournalEntriesService();
