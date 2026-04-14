import { Request, Response } from "express";
import { prisma } from '../lib/prisma';

// GET - Ambil semua Chart of Accounts dengan summary saldo
export const getChartOfAccounts = async (req: Request, res: Response): Promise<void> => {
  console.log("🔍 getChartOfAccounts called");
  try {
    console.log("🔍 Calling prisma.chartOfAccounts.findMany...");
    const chartOfAccounts = await prisma.chartOfAccounts.findMany({
      select: {
        id: true,
        account_code: true,
        account_name: true,
        account_type: true,
        description: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { account_code: "asc" },
    });
    console.log(`🔍 Found ${chartOfAccounts.length} accounts`);

    // Calculate balance summary per account type
    const summary = {
      total: chartOfAccounts.length,
      Asset: 0,
      Liability: 0,
      Equity: 0,
      Revenue: 0,
      Expense: 0,
      CostOfService: 0,
    };

    // Get all journal entries with account info
    const journalEntries = await prisma.journal_entries.findMany({
      select: {
        account_id: true,
        debit: true,
        credit: true,
      },
    });

    // Calculate balance per account (safe Decimal -> number conversion)
    const accountBalances = new Map<number, number>();
    const safeNumber = (v: any) => {
      if (v === null || v === undefined) return 0;
      if (typeof v === 'number') return v;
      try {
        // Prisma Decimal objects implement toString()
        return Number(v.toString());
      } catch (e) {
        return 0;
      }
    };

    journalEntries.forEach((entry: any) => {
      const currentBalance = accountBalances.get(entry.account_id) || 0;
      const debit = safeNumber(entry.debit);
      const credit = safeNumber(entry.credit);
      accountBalances.set(entry.account_id, currentBalance + (debit - credit));
    });

    // Sum balances by account type
    chartOfAccounts.forEach(account => {
      const balance = accountBalances.get(account.id) || 0;
      const type = account.account_type;
      
      if (type === 'Asset') {
        summary.Asset += balance;
      } else if (type === 'Liability') {
        summary.Liability += Math.abs(balance); // Show positive value
      } else if (type === 'Equity') {
        summary.Equity += Math.abs(balance);
      } else if (type === 'Revenue') {
        summary.Revenue += Math.abs(balance);
      } else if (type === 'Expense') {
        summary.Expense += balance;
      } else if (type === 'CostOfService') {
        summary.CostOfService += balance;
      }
    });

    res.status(200).json({
      success: true,
      message: "Daftar Chart of Accounts berhasil diambil dari database",
      data: chartOfAccounts,
      summary: summary,
    });
  } catch (error) {
    console.error("❌ Database error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data Chart of Accounts dari database",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Controller untuk membuat akun baru
export const createChartOfAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { account_code, account_name, account_type, description } = req.body;

    // Validasi input
    if (!account_code || !account_name || !account_type) {
      res.status(400).json({
        success: false,
        message: "account_code, account_name, dan account_type wajib diisi",
      });
      return;
    }

    try {
      // Try database first
      const existingAccount = await prisma.chartOfAccounts.findUnique({
        where: { account_code },
      });

      if (existingAccount) {
        res.status(409).json({
          success: false,
          message: "Account code sudah digunakan",
        });
        return;
      }

      const newAccount = await prisma.chartOfAccounts.create({
        data: {
          account_code,
          account_name,
          account_type,
          description,
          updated_at: new Date(),
        },
      });

      res.status(201).json({
        success: true,
        message: "Chart of Account berhasil dibuat",
        data: newAccount,
      });
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
      const errMsg = dbError instanceof Error ? dbError.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Gagal membuat Chart of Account",
        error: errMsg,
      });
    }
  } catch (error) {
    console.error("❌ Error creating Chart of Account:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat membuat Chart of Account",
      error: errMsg,
    });
  }
};

// Controller untuk update akun
export const updateChartOfAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { account_code, account_name, account_type, description } = req.body;

    try {
      // Try database first
      const existingAccount = await prisma.chartOfAccounts.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingAccount) {
        res.status(404).json({
          success: false,
          message: "Chart of Account tidak ditemukan",
        });
        return;
      }

      // Jika account_code diubah, cek apakah kode baru sudah digunakan
      if (account_code && account_code !== existingAccount.account_code) {
        const duplicateAccount = await prisma.chartOfAccounts.findUnique({
          where: { account_code },
        });

        if (duplicateAccount) {
          res.status(409).json({
            success: false,
            message: "Account code sudah digunakan",
          });
          return;
        }
      }

      const updatedAccount = await prisma.chartOfAccounts.update({
        where: { id: parseInt(id) },
        data: {
          ...(account_code && { account_code }),
          ...(account_name && { account_name }),
          ...(account_type && { account_type }),
          ...(description !== undefined && { description }),
        },
      });

      res.status(200).json({
        success: true,
        message: "Chart of Account berhasil diperbarui",
        data: updatedAccount,
      });
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
      const errMsg = dbError instanceof Error ? dbError.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Gagal update Chart of Account",
        error: errMsg,
      });
    }
  } catch (error) {
    console.error("❌ Error update Chart of Account:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat update Chart of Account",
      error: errMsg,
    });
  }
};

// Controller untuk delete akun
export const deleteChartOfAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    try {
      // Try database first.
      // Accept either numeric primary `id` or `account_code` passed in URL.
      const idNum = Number.isNaN(Number(id)) ? NaN : parseInt(id);

      let existingAccount = null;

      if (!Number.isNaN(idNum)) {
        existingAccount = await prisma.chartOfAccounts.findUnique({ where: { id: idNum } });
      }

      // If not found by numeric id, try lookup by account_code
      if (!existingAccount) {
        existingAccount = await prisma.chartOfAccounts.findUnique({ where: { account_code: id } as any });
      }

      if (!existingAccount) {
        res.status(404).json({ success: false, message: "Chart of Account tidak ditemukan" });
        return;
      }

      // Attempt to delete; prefer deleting by primary id
      try {
        await prisma.chartOfAccounts.delete({ where: { id: existingAccount.id } });
      } catch (deleteErr: any) {
        // Likely foreign key constraint (journal entries exist) or other DB restriction
        console.error('❌ Error deleting ChartOfAccount:', deleteErr);
        if (deleteErr.code === 'P2014' || /foreign key|constraint/i.test(String(deleteErr.message))) {
          res.status(400).json({
            success: false,
            message: 'Tidak dapat menghapus akun karena terdapat transaksi terkait (journal entries). Hapus atau pindahkan transaksi terlebih dahulu.',
            error: String(deleteErr.message),
          });
          return;
        }
        throw deleteErr;
      }

      res.status(200).json({ success: true, message: "Chart of Account berhasil dihapus" });
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
      const errMsg = dbError instanceof Error ? dbError.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Gagal hapus Chart of Account",
        error: errMsg,
      });
    }
  } catch (error) {
    console.error("❌ Error delete Chart of Account:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat hapus Chart of Account",
      error: errMsg,
    });
  }
};
