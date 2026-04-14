// ============================================
// PROJECT FINANCE - Bank Reconciliation Service
// Simulated Bank Integration
// ============================================

import { prisma } from '../utils/prisma';

export interface BankTransaction {
  id: string;
  transaction_date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
  status: 'PENDING' | 'MATCHED' | 'UNMATCHED';
}

export interface BankStatement {
  bank_name: string;
  account_number: string;
  statement_date: Date;
  opening_balance: number;
  closing_balance: number;
  transactions: BankTransaction[];
}

class BankReconciliationService {
  // ============================================
  // SIMULATE: Get Bank Statement
  // In production, this would call real bank API
  // ============================================
  
  async getBankStatement(params: {
    account_number: string;
    start_date: Date;
    end_date: Date;
  }): Promise<BankStatement> {
    console.log('🏦 [SIMULATED] Fetching bank statement from bank API...');
    
    // Simulate API delay
    await this.delay(1000);

    // Generate mock bank transactions
    const mockTransactions = this.generateMockBankTransactions(
      params.start_date,
      params.end_date
    );

    const openingBalance = 50000000; // IDR 50 juta
    let runningBalance = openingBalance;

    const transactions: BankTransaction[] = mockTransactions.map((txn, idx) => {
      runningBalance += (txn.credit - txn.debit);
      return {
        id: `BANK-${Date.now()}-${idx}`,
        transaction_date: txn.date,
        description: txn.description,
        debit: txn.debit,
        credit: txn.credit,
        balance: runningBalance,
        reference: txn.reference,
        status: 'PENDING',
      };
    });

    return {
      bank_name: 'Bank Mandiri (Simulated)',
      account_number: params.account_number,
      statement_date: new Date(),
      opening_balance: openingBalance,
      closing_balance: runningBalance,
      transactions,
    };
  }

  // ============================================
  // Generate Mock Bank Transactions
  // ============================================
  
  private generateMockBankTransactions(startDate: Date, endDate: Date) {
    const transactions = [
      {
        date: this.randomDate(startDate, endDate),
        description: 'Transfer from PT. ABC Indonesia',
        debit: 0,
        credit: 25000000,
        reference: 'TRF202601240001',
      },
      {
        date: this.randomDate(startDate, endDate),
        description: 'Payment to Supplier - PT. XYZ',
        debit: 15000000,
        credit: 0,
        reference: 'PMT202601240002',
      },
      {
        date: this.randomDate(startDate, endDate),
        description: 'Salary Payment - January 2026',
        debit: 30000000,
        credit: 0,
        reference: 'SAL202601240003',
      },
      {
        date: this.randomDate(startDate, endDate),
        description: 'Customer Payment - INV-001',
        debit: 0,
        credit: 18500000,
        reference: 'INV202601240004',
      },
      {
        date: this.randomDate(startDate, endDate),
        description: 'Office Rent - January',
        debit: 12000000,
        credit: 0,
        reference: 'RENT202601240005',
      },
      {
        date: this.randomDate(startDate, endDate),
        description: 'Electricity Bill',
        debit: 2500000,
        credit: 0,
        reference: 'UTIL202601240006',
      },
      {
        date: this.randomDate(startDate, endDate),
        description: 'Service Revenue - Project A',
        debit: 0,
        credit: 45000000,
        reference: 'REV202601240007',
      },
      {
        date: this.randomDate(startDate, endDate),
        description: 'Bank Admin Fee',
        debit: 50000,
        credit: 0,
        reference: 'FEE202601240008',
      },
      {
        date: this.randomDate(startDate, endDate),
        description: 'Interest Income',
        debit: 0,
        credit: 125000,
        reference: 'INT202601240009',
      },
      {
        date: this.randomDate(startDate, endDate),
        description: 'Equipment Purchase',
        debit: 8500000,
        credit: 0,
        reference: 'PUR202601240010',
      },
    ];

    return transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // ============================================
  // Auto-Match Transactions
  // ============================================
  
  async autoMatchTransactions(bankStatement: BankStatement) {
    console.log('🔄 Auto-matching bank transactions with journal entries...');
    
    const matchedTransactions = [];
    const unmatchedTransactions = [];

    for (const bankTxn of bankStatement.transactions) {
      // Try to find matching journal entry
      // In real implementation, would query journal_entries table
      const match = await this.findMatchingJournalEntry(bankTxn);
      
      if (match) {
        matchedTransactions.push({
          ...bankTxn,
          status: 'MATCHED',
          matched_journal_id: match.id,
        });
      } else {
        unmatchedTransactions.push({
          ...bankTxn,
          status: 'UNMATCHED',
        });
      }
    }

    return {
      matched: matchedTransactions,
      unmatched: unmatchedTransactions,
      match_rate: (matchedTransactions.length / bankStatement.transactions.length) * 100,
    };
  }

  // ============================================
  // Find Matching Journal Entry
  // Improved: Also check description similarity
  // ============================================
  
  private async findMatchingJournalEntry(bankTxn: BankTransaction) {
    try {
      // Search for journal entry with matching amount and date
      const amount = bankTxn.debit > 0 ? bankTxn.debit : bankTxn.credit;
      const txnDate = new Date(bankTxn.transaction_date);
      
      // Try exact amount match first
      let match = await prisma.journal_entries.findFirst({
        where: {
          OR: [
            { debit: amount },
            { credit: amount },
          ],
          transaction_date: {
            gte: new Date(txnDate.setHours(0, 0, 0, 0)),
            lte: new Date(txnDate.setHours(23, 59, 59, 999)),
          },
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

      // If no exact match, try within 1% tolerance
      if (!match) {
        const tolerance = amount * 0.01; // 1% tolerance
        match = await prisma.journal_entries.findFirst({
          where: {
            OR: [
              {
                debit: {
                  gte: amount - tolerance,
                  lte: amount + tolerance
                }
              },
              {
                credit: {
                  gte: amount - tolerance,
                  lte: amount + tolerance
                }
              }
            ],
            transaction_date: {
              gte: new Date(txnDate.getTime() - 2 * 24 * 60 * 60 * 1000), // ±2 days
              lte: new Date(txnDate.getTime() + 2 * 24 * 60 * 60 * 1000),
            },
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
      }

      return match;
    } catch (error) {
      console.error('Error finding matching journal entry:', error);
      return null;
    }
  }

  // ============================================
  // Create Reconciliation Report
  // ============================================
  
  async createReconciliationReport(data: {
    account_number: string;
    start_date: Date;
    end_date: Date;
  }) {
    console.log('📊 Generating bank reconciliation report...');

    // Get bank statement (simulated)
    const bankStatement = await this.getBankStatement(data);

    // Auto-match transactions
    const matchingResult = await this.autoMatchTransactions(bankStatement);

    // Calculate variances
    const bankBalance = bankStatement.closing_balance;
    const bookBalance = await this.getBookBalance(data.account_number, data.end_date);
    const variance = bankBalance - bookBalance;

    return {
      statement: bankStatement,
      matching: matchingResult,
      reconciliation: {
        bank_balance: bankBalance,
        book_balance: bookBalance,
        variance: variance,
        variance_percentage: bookBalance !== 0 ? (variance / bookBalance) * 100 : 0,
        is_reconciled: Math.abs(variance) < 1000, // Variance < IDR 1,000
      },
      generated_at: new Date(),
    };
  }

  // ============================================
  // Get Book Balance (from Journal Entries)
  // Improved: Handle multiple bank accounts
  // ============================================
  
  private async getBookBalance(accountNumber: string, asOfDate: Date): Promise<number> {
    try {
      // Find Cash/Bank account in COA (match by account number in description or notes)
      const cashAccounts = await prisma.chartOfAccounts.findMany({
        where: {
          account_type: 'Asset',
          OR: [
            { account_name: { contains: 'Bank', mode: 'insensitive' } },
            { account_name: { contains: 'Cash', mode: 'insensitive' } },
            { account_name: { contains: 'Kas', mode: 'insensitive' } },
            { account_code: { startsWith: '11' } } // Asset accounts
          ]
        },
      });

      if (cashAccounts.length === 0) {
        console.warn('⚠️ No cash/bank accounts found in COA');
        return 50000000; // Default if no account found
      }

      // Sum all journal entries for all cash/bank accounts up to date
      let totalBalance = 0;
      
      for (const cashAccount of cashAccounts) {
        const entries = await prisma.journal_entries.findMany({
          where: {
            account_id: cashAccount.id,
            transaction_date: {
              lte: asOfDate,
            },
          },
        });

        const accountBalance = entries.reduce((sum, entry) => {
          return sum + (Number(entry.debit) || 0) - (Number(entry.credit) || 0);
        }, 0);

        console.log(`💰 ${cashAccount.account_name} (${cashAccount.account_code}): ${accountBalance.toLocaleString('id-ID')}`);
        totalBalance += accountBalance;
      }

      return totalBalance;
    } catch (error) {
      console.error('Error calculating book balance:', error);
      return 50000000; // Default
    }
  }

  // ============================================
  // Import Bank Statement (CSV/Excel)
  // ============================================
  
  async importBankStatement(file: Express.Multer.File) {
    console.log('📥 Importing bank statement file...');
    
    // Simulate file processing
    await this.delay(2000);
    
    // In real implementation, would parse CSV/Excel file
    // For now, return mock data
    return {
      success: true,
      message: 'Bank statement imported successfully',
      transactions_count: 10,
      file_name: file.originalname,
    };
  }

  // ============================================
  // Helper: Delay (for simulation)
  // ============================================
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // Helper: Random Date between range
  // ============================================
  
  private randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  // ============================================
  // SIMULATION: Check Bank API Connection
  // ============================================
  
  async testBankConnection(bankCode: string): Promise<{ success: boolean; message: string }> {
    console.log(`🏦 [SIMULATED] Testing connection to ${bankCode}...`);
    
    await this.delay(1500);
    
    const banks = ['MANDIRI', 'BCA', 'BNI', 'BRI', 'CIMB'];
    
    if (banks.includes(bankCode.toUpperCase())) {
      return {
        success: true,
        message: `Successfully connected to ${bankCode} (Simulated)`,
      };
    } else {
      return {
        success: false,
        message: `Bank ${bankCode} not supported in simulation`,
      };
    }
  }
}

// Export singleton
export const bankReconciliationService = new BankReconciliationService();
export default bankReconciliationService;
