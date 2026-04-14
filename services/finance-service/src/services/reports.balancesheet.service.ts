import { prisma } from '../lib/prisma';
import { getBalanceSummaryByType } from './reports.balance.service';

/**
 * Balance Sheet Service
 * Menghasilkan Laporan Neraca (Balance Sheet): Assets = Liabilities + Equity
 */

export interface BalanceSheetAccount {
  account_code: string;
  account_name: string;
  balance: number;
}

export interface BalanceSheetSection {
  accounts: BalanceSheetAccount[];
  total: number;
}

export interface BalanceSheetReport {
  as_of_date: Date | null;
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: BalanceSheetSection;
  total_assets: number;
  total_liabilities_and_equity: number;
  is_balanced: boolean;
  difference: number;
}

/**
 * Generate Balance Sheet Report
 * @param asOfDate - Optional: Calculate balance as of specific date
 * @returns Balance Sheet report
 */
export const getBalanceSheet = async (
  asOfDate?: Date
): Promise<BalanceSheetReport> => {
  try {
    // Get all accounts with balances
    const accounts = await prisma.chartOfAccounts.findMany({
      orderBy: { account_code: 'asc' },
    });

    // Get balances for all accounts
    const balanceSummary = await getBalanceSummaryByType(asOfDate);

    // Initialize sections
    const assetAccounts: BalanceSheetAccount[] = [];
    const liabilityAccounts: BalanceSheetAccount[] = [];
    const equityAccounts: BalanceSheetAccount[] = [];

    // Calculate individual account balances
    for (const account of accounts) {
      // Build where clause
      const whereClause: any = { account_id: account.id };
      if (asOfDate) {
        whereClause.transaction_date = { lte: asOfDate };
      }

      // Get journal entries
      const entries = await prisma.journal_entries.findMany({
        where: whereClause,
        select: { debit: true, credit: true },
      });

      // Calculate balance
      const totals = entries.reduce(
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

      let balance = 0;
      if (['Asset', 'Expense', 'CostOfService'].includes(account.account_type)) {
        balance = totals.debit - totals.credit;
      } else {
        balance = totals.credit - totals.debit;
      }

      // Skip zero balances
      if (Math.abs(balance) < 0.01) {
        continue;
      }

      const accountData: BalanceSheetAccount = {
        account_code: account.account_code,
        account_name: account.account_name,
        balance: balance,
      };

      // Categorize
      if (account.account_type === 'Asset') {
        assetAccounts.push(accountData);
      } else if (account.account_type === 'Liability') {
        liabilityAccounts.push(accountData);
      } else if (account.account_type === 'Equity') {
        equityAccounts.push(accountData);
      }
    }

    // Calculate section totals
    const assetsTotal = assetAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const liabilitiesTotal = liabilityAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    let equityTotal = equityAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Calculate Retained Earnings (Net Income) from Revenue and Expense accounts
    // This is crucial for Balance Sheet equation: Assets = Liabilities + Equity + Retained Earnings
    let retainedEarnings = 0;
    
    for (const account of accounts) {
      if (!['Revenue', 'Expense', 'CostOfService'].includes(account.account_type)) {
        continue;
      }

      const whereClause: any = { account_id: account.id };
      if (asOfDate) {
        whereClause.transaction_date = { lte: asOfDate };
      }

      const entries = await prisma.journal_entries.findMany({
        where: whereClause,
        select: { debit: true, credit: true },
      });

      const totals = entries.reduce(
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

      // Revenue increases retained earnings (Credit - Debit)
      // Expense/COGS decreases retained earnings (Debit - Credit)
      if (account.account_type === 'Revenue') {
        retainedEarnings += (totals.credit - totals.debit);
      } else {
        retainedEarnings -= (totals.debit - totals.credit);
      }
    }

    // Add retained earnings to equity if significant
    if (Math.abs(retainedEarnings) >= 0.01) {
      equityAccounts.push({
        account_code: '3100',
        account_name: 'Laba Ditahan (Retained Earnings)',
        balance: retainedEarnings,
      });
      equityTotal += retainedEarnings;
    }

    const totalLiabilitiesAndEquity = liabilitiesTotal + equityTotal;
    const difference = Math.abs(assetsTotal - totalLiabilitiesAndEquity);
    const isBalanced = difference < 0.01;

    return {
      as_of_date: asOfDate || null,
      assets: {
        accounts: assetAccounts,
        total: assetsTotal,
      },
      liabilities: {
        accounts: liabilityAccounts,
        total: liabilitiesTotal,
      },
      equity: {
        accounts: equityAccounts,
        total: equityTotal,
      },
      total_assets: assetsTotal,
      total_liabilities_and_equity: totalLiabilitiesAndEquity,
      is_balanced: isBalanced,
      difference: difference,
    };
  } catch (error) {
    console.error('Error in getBalanceSheet:', error);
    throw error;
  }
};

/**
 * Get simplified Balance Sheet (summary only)
 */
export const getBalanceSheetSummary = async (
  asOfDate?: Date
): Promise<{
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  is_balanced: boolean;
}> => {
  try {
    const summary = await getBalanceSummaryByType(asOfDate);

    const totalAssets = summary['Asset'] || 0;
    const totalLiabilities = summary['Liability'] || 0;
    const totalEquity = summary['Equity'] || 0;

    const difference = Math.abs(totalAssets - (totalLiabilities + totalEquity));

    return {
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      total_equity: totalEquity,
      is_balanced: difference < 0.01,
    };
  } catch (error) {
    console.error('Error in getBalanceSheetSummary:', error);
    throw error;
  }
};
