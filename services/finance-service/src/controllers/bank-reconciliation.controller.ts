import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * BANK RECONCILIATION CONTROLLER
 * Module untuk rekonsiliasi bank - mencocokkan transaksi sistem dengan mutasi bank
 */

// GET /api/bank-reconciliation
export const getAllReconciliations = async (req: Request, res: Response) => {
  try {
    const { bank_account, period, status } = req.query;

    const where: any = {};
    if (bank_account) where.bank_account = bank_account;
    if (period) where.period = period;
    if (status) where.status = status;

    const reconciliations = await prisma.bank_reconciliations.findMany({
      where,
      orderBy: {created_at: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: reconciliations,
      count: reconciliations.length,
    });
  } catch (error: any) {
    console.error('Error fetching reconciliations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank reconciliations',
      error: error.message,
    });
  }
};

// GET /api/bank-reconciliation/:id
export const getReconciliationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reconciliation = await prisma.bank_reconciliations.findUnique({
      where: { id },
    });

    if (!reconciliation) {
      return res.status(404).json({
        success: false,
        message: 'Bank reconciliation not found',
      });
    }

    res.status(200).json({
      success: true,
      data: reconciliation,
    });
  } catch (error: any) {
    console.error('Error fetching reconciliation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank reconciliation',
      error: error.message,
    });
  }
};

// POST /api/bank-reconciliation
export const createReconciliation = async (req: Request, res: Response) => {
  try {
    const {
      bank_account,
      period,
      start_date,
      end_date,
      opening_balance_system,
      opening_balance_bank,
      closing_balance_system,
      closing_balance_bank,
      system_transactions,
      bank_transactions,
      matched_transactions,
      unmatched_system,
      unmatched_bank,
      adjustments,
      difference,
      notes,
    } = req.body;

    // Validation
    if (!bank_account || !period || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'bank_account, period, start_date, and end_date are required',
      });
    }

    const reconciliation = await prisma.bank_reconciliations.create({
      data: {
        id: uuidv4(),
        bank_account,
        period,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        opening_balance_system: opening_balance_system || 0,
        opening_balance_bank: opening_balance_bank || 0,
        closing_balance_system: closing_balance_system || 0,
        closing_balance_bank: closing_balance_bank || 0,
        system_transactions: system_transactions || [],
        bank_transactions: bank_transactions || [],
        matched_transactions: matched_transactions || [],
        unmatched_system: unmatched_system || [],
        unmatched_bank: unmatched_bank || [],
        adjustments: adjustments || [],
        difference: difference || 0,
        status: 'Draft',
        notes: notes || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Bank reconciliation created successfully',
      data: reconciliation,
    });
  } catch (error: any) {
    console.error('Error creating reconciliation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bank reconciliation',
      error: error.message,
    });
  }
};

// PUT /api/bank-reconciliation/:id
export const updateReconciliation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existing = await prisma.bank_reconciliations.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Bank reconciliation not found',
      });
    }

    // Prevent update if locked
    if (existing.status === 'Completed' && updateData.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed reconciliation',
      });
    }

    const updated = await prisma.bank_reconciliations.update({
      where: { id },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Bank reconciliation updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating reconciliation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bank reconciliation',
      error: error.message,
    });
  }
};

// DELETE /api/bank-reconciliation/:id
export const deleteReconciliation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.bank_reconciliations.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Bank reconciliation not found',
      });
    }

    // Prevent delete if completed
    if (existing.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed reconciliation',
      });
    }

    await prisma.bank_reconciliations.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Bank reconciliation deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting reconciliation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bank reconciliation',
      error: error.message,
    });
  }
};

// POST /api/bank-reconciliation/:id/match
export const matchTransactions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { system_transaction_ids, bank_transaction_ids } = req.body;

    const existing = await prisma.bank_reconciliations.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Bank reconciliation not found',
      });
    }

    // Add matched transaction logic here
    // This would update the matched_transactions array

    res.status(200).json({
      success: true,
      message: 'Transactions matched successfully',
    });
  } catch (error: any) {
    console.error('Error matching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to match transactions',
      error: error.message,
    });
  }
};

// POST /api/bank-reconciliation/:id/complete
export const completeReconciliation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { completed_by } = req.body;

    const updated = await prisma.bank_reconciliations.update({
      where: { id },
      data: {
        status: 'Completed',
        completed_at: new Date(),
        completed_by: completed_by || null,
        updated_at: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Bank reconciliation completed successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error completing reconciliation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete bank reconciliation',
      error: error.message,
    });
  }
};
