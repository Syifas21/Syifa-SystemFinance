import { prisma } from '../lib/prisma';

/**
 * Income Statement Service
 * Menghasilkan Laporan Laba Rugi: Revenue - COGS - Expense = Net Profit
 */

export interface IncomeStatementAccount {
  account_code: string;
  account_name: string;
  amount: number;
}

export interface IncomeStatementSection {
  accounts: IncomeStatementAccount[];
  total: number;
}

export interface IncomeStatementReport {
  period: {
    start_date: Date | null;
    end_date: Date | null;
  };
  revenue: IncomeStatementSection;
  cost_of_service: IncomeStatementSection;
  gross_profit: number;
  expenses: IncomeStatementSection;
  net_profit: number;
  gross_profit_margin: number; // Percentage
  net_profit_margin: number; // Percentage
}

/**
 * Generate Income Statement Report (Laporan Laba Rugi)
 * @param startDate - Optional: Start date of period
 * @param endDate - Optional: End date of period
 * @returns Income Statement report
 */
export const getIncomeStatement = async (
  startDate?: Date,
  endDate?: Date
): Promise<IncomeStatementReport> => {
  try {
    // Get all accounts
    const accounts = await prisma.chartOfAccounts.findMany({
      orderBy: { account_code: 'asc' },
    });

    // Initialize sections
    const revenueAccounts: IncomeStatementAccount[] = [];
    const cogsAccounts: IncomeStatementAccount[] = [];
    const expenseAccounts: IncomeStatementAccount[] = [];

    // Calculate for each account
    for (const account of accounts) {
      // Only process Revenue, CostOfService, and Expense accounts
      if (!['Revenue', 'CostOfService', 'Expense'].includes(account.account_type)) {
        continue;
      }

      // Build where clause
      const whereClause: any = { account_id: account.id };
      if (startDate || endDate) {
        whereClause.transaction_date = {};
        if (startDate) {
          whereClause.transaction_date.gte = startDate;
        }
        if (endDate) {
          whereClause.transaction_date.lte = endDate;
        }
      }

      // Get journal entries for period
      const entries = await prisma.journal_entries.findMany({
        where: whereClause,
        select: { debit: true, credit: true },
      });

      // Calculate amount
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

      // For P&L: Revenue is Credit - Debit, Expense/COGS is Debit - Credit
      let amount = 0;
      if (account.account_type === 'Revenue') {
        amount = totals.credit - totals.debit;
      } else {
        // CostOfService, Expense
        amount = totals.debit - totals.credit;
      }

      // Skip zero amounts
      if (Math.abs(amount) < 0.01) {
        continue;
      }

      const accountData: IncomeStatementAccount = {
        account_code: account.account_code,
        account_name: account.account_name,
        amount: amount,
      };

      // Categorize
      if (account.account_type === 'Revenue') {
        revenueAccounts.push(accountData);
      } else if (account.account_type === 'CostOfService') {
        cogsAccounts.push(accountData);
      } else if (account.account_type === 'Expense') {
        expenseAccounts.push(accountData);
      }
    }

    // Calculate totals
    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.amount, 0);
    const totalCOGS = cogsAccounts.reduce((sum, acc) => sum + acc.amount, 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + acc.amount, 0);

    // Calculate profits
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;

    // Calculate margins
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      period: {
        start_date: startDate || null,
        end_date: endDate || null,
      },
      revenue: {
        accounts: revenueAccounts,
        total: totalRevenue,
      },
      cost_of_service: {
        accounts: cogsAccounts,
        total: totalCOGS,
      },
      gross_profit: grossProfit,
      expenses: {
        accounts: expenseAccounts,
        total: totalExpenses,
      },
      net_profit: netProfit,
      gross_profit_margin: grossProfitMargin,
      net_profit_margin: netProfitMargin,
    };
  } catch (error) {
    console.error('Error in getIncomeStatement:', error);
    throw error;
  }
};

/**
 * Get Income Statement Summary (totals only)
 */
export const getIncomeStatementSummary = async (
  startDate?: Date,
  endDate?: Date
): Promise<{
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  total_expenses: number;
  net_profit: number;
  gross_profit_margin: number;
  net_profit_margin: number;
}> => {
  try {
    const statement = await getIncomeStatement(startDate, endDate);

    return {
      total_revenue: statement.revenue.total,
      total_cogs: statement.cost_of_service.total,
      gross_profit: statement.gross_profit,
      total_expenses: statement.expenses.total,
      net_profit: statement.net_profit,
      gross_profit_margin: statement.gross_profit_margin,
      net_profit_margin: statement.net_profit_margin,
    };
  } catch (error) {
    console.error('Error in getIncomeStatementSummary:', error);
    throw error;
  }
};
