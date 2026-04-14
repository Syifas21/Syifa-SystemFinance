import { prisma } from '../lib/prisma';
import { getAllAccountBalances } from './reports.balance.service';

/**
 * Trial Balance Service
 * Menghasilkan Trial Balance (Neraca Saldo) untuk validasi double-entry
 */

export interface TrialBalanceEntry {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalanceReport {
  as_of_date: Date | null;
  entries: TrialBalanceEntry[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  difference: number;
}

/**
 * Generate Trial Balance Report
 * @param asOfDate - Optional: Calculate balance as of specific date
 * @returns Trial Balance report dengan validation
 */
export const getTrialBalance = async (
  asOfDate?: Date
): Promise<TrialBalanceReport> => {
  try {
    // Get all account balances - using total_debit and total_credit from journal entries
    const balances = await getAllAccountBalances(asOfDate);

    // Transform to trial balance format
    // Trial Balance shows ACTUAL total debit and credit from journal entries
    const entries: TrialBalanceEntry[] = balances.map((balance) => {
      return {
        account_id: balance.account_id,
        account_code: balance.account_code,
        account_name: balance.account_name,
        account_type: balance.account_type,
        debit: balance.total_debit,      // Actual total debit from journals
        credit: balance.total_credit,    // Actual total credit from journals
        balance: balance.balance,        // Net balance
      };
    });

    // Calculate totals - sum of ALL debits and ALL credits from journal entries
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01; // Allow for rounding errors

    return {
      as_of_date: asOfDate || null,
      entries: entries,
      total_debit: totalDebit,
      total_credit: totalCredit,
      is_balanced: isBalanced,
      difference: difference,
    };
  } catch (error) {
    console.error('Error in getTrialBalance:', error);
    throw error;
  }
};

/**
 * Get Trial Balance by Account Type
 * Useful untuk summary view
 */
export const getTrialBalanceByType = async (
  asOfDate?: Date
): Promise<Record<string, { debit: number; credit: number; balance: number }>> => {
  try {
    const trialBalance = await getTrialBalance(asOfDate);

    // Group by account type
    const byType = trialBalance.entries.reduce((acc, entry) => {
      if (!acc[entry.account_type]) {
        acc[entry.account_type] = { debit: 0, credit: 0, balance: 0 };
      }
      acc[entry.account_type].debit += entry.debit;
      acc[entry.account_type].credit += entry.credit;
      acc[entry.account_type].balance += entry.balance;
      return acc;
    }, {} as Record<string, { debit: number; credit: number; balance: number }>);

    return byType;
  } catch (error) {
    console.error('Error in getTrialBalanceByType:', error);
    throw error;
  }
};
