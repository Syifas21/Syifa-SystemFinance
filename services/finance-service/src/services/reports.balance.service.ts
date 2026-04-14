import { prisma } from '../lib/prisma';

/**
 * Balance Service
 * Foundation service untuk menghitung balance account secara real-time dari journal entries
 */

export interface AccountBalance {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  total_debit: number;
  total_credit: number;
  balance: number;
}

/**
 * Get balance untuk satu account specific
 * @param accountId - ID dari account
 * @param asOfDate - Optional: Calculate balance as of specific date
 * @returns Account balance dengan total debit, credit, dan balance
 */
export const getAccountBalance = async (
  accountId: number,
  asOfDate?: Date
): Promise<AccountBalance | null> => {
  try {
    // Get account info
    const account = await prisma.chartOfAccounts.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return null;
    }

    // Build where clause untuk date filter
    const whereClause: any = { account_id: accountId };
    if (asOfDate) {
      whereClause.transaction_date = {
        lte: asOfDate,
      };
    }

    // Calculate balance from journal entries
    const journalEntries = await prisma.journal_entries.findMany({
      where: whereClause,
      select: {
        debit: true,
        credit: true,
      },
    });

    // Sum debit and credit
    const totals = journalEntries.reduce(
      (acc: { total_debit: number; total_credit: number }, entry: any) => {
        const debit = entry.debit ? parseFloat(entry.debit.toString()) : 0;
        const credit = entry.credit ? parseFloat(entry.credit.toString()) : 0;
        return {
          total_debit: acc.total_debit + debit,
          total_credit: acc.total_credit + credit,
        };
      },
      { total_debit: 0, total_credit: 0 }
    );

    // Calculate balance based on account type
    // Asset & Expense & CostOfService: Debit increases balance (Debit - Credit)
    // Liability, Equity, Revenue: Credit increases balance (Credit - Debit)
    let balance = 0;
    if (['Asset', 'Expense', 'CostOfService'].includes(account.account_type)) {
      balance = totals.total_debit - totals.total_credit;
    } else {
      // Liability, Equity, Revenue
      balance = totals.total_credit - totals.total_debit;
    }

    return {
      account_id: account.id,
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      total_debit: totals.total_debit,
      total_credit: totals.total_credit,
      balance: balance,
    };
  } catch (error) {
    console.error('Error in getAccountBalance:', error);
    throw error;
  }
};

/**
 * Get balance untuk semua accounts
 * @param asOfDate - Optional: Calculate balance as of specific date
 * @returns Array of all account balances
 */
export const getAllAccountBalances = async (
  asOfDate?: Date
): Promise<AccountBalance[]> => {
  try {
    // Get all accounts
    const accounts = await prisma.chartOfAccounts.findMany({
      orderBy: { account_code: 'asc' },
    });

    // Calculate balance for each account
    const balances = await Promise.all(
      accounts.map(async (account) => {
        // Build where clause
        const whereClause: any = { account_id: account.id };
        if (asOfDate) {
          whereClause.transaction_date = {
            lte: asOfDate,
          };
        }

        // Get journal entries for this account
        const journalEntries = await prisma.journal_entries.findMany({
          where: whereClause,
          select: {
            debit: true,
            credit: true,
          },
        });

        // Sum debit and credit
        const totals = journalEntries.reduce(
          (acc: { total_debit: number; total_credit: number }, entry: any) => {
            const debit = entry.debit ? parseFloat(entry.debit.toString()) : 0;
            const credit = entry.credit ? parseFloat(entry.credit.toString()) : 0;
            return {
              total_debit: acc.total_debit + debit,
              total_credit: acc.total_credit + credit,
            };
          },
          { total_debit: 0, total_credit: 0 }
        );

        // Calculate balance based on account type
        let balance = 0;
        if (['Asset', 'Expense', 'CostOfService'].includes(account.account_type)) {
          balance = totals.total_debit - totals.total_credit;
        } else {
          balance = totals.total_credit - totals.total_debit;
        }

        return {
          account_id: account.id,
          account_code: account.account_code,
          account_name: account.account_name,
          account_type: account.account_type,
          total_debit: totals.total_debit,
          total_credit: totals.total_credit,
          balance: balance,
        };
      })
    );

    return balances;
  } catch (error) {
    console.error('Error in getAllAccountBalances:', error);
    throw error;
  }
};

/**
 * Get balance summary by account type
 * Useful untuk balance sheet calculation
 */
export const getBalanceSummaryByType = async (
  asOfDate?: Date
): Promise<Record<string, number>> => {
  try {
    const balances = await getAllAccountBalances(asOfDate);

    // Group by account type
    const summary = balances.reduce((acc, item) => {
      if (!acc[item.account_type]) {
        acc[item.account_type] = 0;
      }
      acc[item.account_type] += item.balance;
      return acc;
    }, {} as Record<string, number>);

    return summary;
  } catch (error) {
    console.error('Error in getBalanceSummaryByType:', error);
    throw error;
  }
};
