import { prisma } from '../lib/prisma';

/**
 * General Ledger Service
 * Menampilkan detail transaksi per account dengan running balance
 */

export interface GeneralLedgerEntry {
  id: bigint;
  transaction_date: Date;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  debit: number;
  credit: number;
  balance: number; // Running balance
  created_by: string | null;
}

export interface GeneralLedgerReport {
  account: {
    id: number;
    account_code: string;
    account_name: string;
    account_type: string;
  };
  opening_balance: number;
  entries: GeneralLedgerEntry[];
  closing_balance: number;
  total_debit: number;
  total_credit: number;
}

/**
 * Get General Ledger (Buku Besar) untuk specific account
 * @param accountId - ID account
 * @param startDate - Optional: Start date filter
 * @param endDate - Optional: End date filter
 * @returns General Ledger report dengan running balance
 */
export const getGeneralLedger = async (
  accountId: number,
  startDate?: Date,
  endDate?: Date
): Promise<GeneralLedgerReport | null> => {
  try {
    // Get account info
    const account = await prisma.chartOfAccounts.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return null;
    }

    // Calculate opening balance (before start date if provided)
    let openingBalance = 0;
    if (startDate) {
      const openingEntries = await prisma.journal_entries.findMany({
        where: {
          account_id: accountId,
          transaction_date: {
            lt: startDate,
          },
        },
        select: {
          debit: true,
          credit: true,
        },
      });

      const openingTotals = openingEntries.reduce(
        (acc: { debit: number; credit: number }, entry: any) => {
          const debit = entry.debit ? parseFloat(entry.debit.toString()) : 0;
          const credit = entry.credit ? parseFloat(entry.credit.toString()) : 0;
          return {
            debit: acc.debit + debit,
            credit: acc.credit + credit,
          };
        },
        { debit: 0, credit: 0 }
      );

      // Calculate opening balance based on account type
      if (['Asset', 'Expense', 'CostOfService'].includes(account.account_type)) {
        openingBalance = openingTotals.debit - openingTotals.credit;
      } else {
        openingBalance = openingTotals.credit - openingTotals.debit;
      }
    }

    // Build where clause for entries
    const whereClause: any = { account_id: accountId };
    if (startDate || endDate) {
      whereClause.transaction_date = {};
      if (startDate) {
        whereClause.transaction_date.gte = startDate;
      }
      if (endDate) {
        whereClause.transaction_date.lte = endDate;
      }
    }

    // Get journal entries
    const rawEntries = await prisma.journal_entries.findMany({
      where: whereClause,
      orderBy: [
        { transaction_date: 'asc' },
        { id: 'asc' },
      ],
    });

    // Calculate running balance
    let runningBalance = openingBalance;
    let totalDebit = 0;
    let totalCredit = 0;

    const entries: GeneralLedgerEntry[] = rawEntries.map((entry: any) => {
      const debit = entry.debit ? parseFloat(entry.debit.toString()) : 0;
      const credit = entry.credit ? parseFloat(entry.credit.toString()) : 0;

      totalDebit += debit;
      totalCredit += credit;

      // Update running balance based on account type
      if (['Asset', 'Expense', 'CostOfService'].includes(account.account_type)) {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      return {
        id: entry.id,
        transaction_date: entry.transaction_date,
        description: entry.description,
        reference_id: entry.reference_id,
        reference_type: entry.reference_type,
        debit: debit,
        credit: credit,
        balance: runningBalance,
        created_by: entry.created_by,
      };
    });

    return {
      account: {
        id: account.id,
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
      },
      opening_balance: openingBalance,
      entries: entries,
      closing_balance: runningBalance,
      total_debit: totalDebit,
      total_credit: totalCredit,
    };
  } catch (error) {
    console.error('Error in getGeneralLedger:', error);
    throw error;
  }
};

/**
 * Get General Ledger untuk multiple accounts sekaligus
 * Useful untuk export atau analisis bulk
 */
export const getGeneralLedgerBulk = async (
  accountIds: number[],
  startDate?: Date,
  endDate?: Date
): Promise<GeneralLedgerReport[]> => {
  try {
    const reports = await Promise.all(
      accountIds.map((accountId) =>
        getGeneralLedger(accountId, startDate, endDate)
      )
    );

    // Filter out null results (account not found)
    return reports.filter((report): report is GeneralLedgerReport => report !== null);
  } catch (error) {
    console.error('Error in getGeneralLedgerBulk:', error);
    throw error;
  }
};
