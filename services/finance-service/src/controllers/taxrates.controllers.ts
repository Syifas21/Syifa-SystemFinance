import { Request, Response } from "express";
import { prisma } from '../lib/prisma';
import { mockTaxRates } from '../utils/mockData';

// Controller untuk ambil daftar tax rates
export const getTaxRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const taxRates = await prisma.tax_rates.findMany({
      select: {
        id: true,
        tax_name: true,
        tax_code: true,
        rate: true,
        description: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { id: "asc" },
    });

    res.status(200).json({
      success: true,
      message: "Daftar Tax Rates berhasil diambil dari database",
      data: taxRates,
    });
  } catch (error) {
    console.error("❌ Database error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data tax rates dari database",
      error: errMsg,
    });
  }
};

// Controller untuk ambil tax rate berdasarkan ID
export const getTaxRateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const taxRateId = Number.parseInt(id);

    if (Number.isNaN(taxRateId)) {
      res.status(400).json({
        success: false,
        message: "ID harus berupa angka",
      });
      return;
    }

    const taxRate = await prisma.tax_rates.findUnique({
      where: { id: taxRateId },
      select: {
        id: true,
        tax_name: true,
        rate: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!taxRate) {
      res.status(404).json({
        success: false,
        message: "Tax Rate tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Tax Rate berhasil diambil dari database",
      data: taxRate,
    });
  } catch (error) {
    console.error("Error mengambil Tax Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil data Tax Rate",
      error: errMsg,
    });
  }
};

// Controller untuk membuat tax rate baru
export const createTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tax_name, tax_code, rate, description, is_active } = req.body;
    
    console.log('📝 Creating tax rate with data:', { tax_name, tax_code, rate, description, is_active });

    // Validasi input
    if (!tax_name || rate === undefined || rate === null) {
      res.status(400).json({
        success: false,
        message: "Tax name dan rate harus diisi",
      });
      return;
    }

    if (typeof rate !== 'number' || rate < 0 || rate > 100) {
      res.status(400).json({
        success: false,
        message: "Rate harus berupa angka antara 0-100",
      });
      return;
    }

    const newTaxRate = await prisma.tax_rates.create({
      data: {
        tax_name,
        tax_code: tax_code || tax_name.toUpperCase().replace(/\s+/g, '_'),
        rate,
        description: description || null,
        is_active: is_active !== undefined ? is_active : true,
      },
      select: {
        id: true,
        tax_name: true,
        tax_code: true,
        rate: true,
        description: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    console.log('✅ Tax rate created successfully:', newTaxRate);

    res.status(201).json({
      success: true,
      message: "Tax Rate berhasil dibuat",
      data: newTaxRate,
    });
  } catch (error) {
    console.error("❌ Error membuat Tax Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    // Handle unique constraint violation - Prisma error
    if (errMsg.includes('Unique constraint') || errMsg.includes('unique constraint') || errMsg.includes('duplicate key')) {
      res.status(409).json({
        success: false,
        message: "Data sudah ada! Nama pajak atau kode pajak tersebut sudah terdaftar.",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat membuat Tax Rate",
      error: errMsg,
    });
  }
};

// Controller untuk update tax rate
export const updateTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { tax_name, tax_code, rate, description, is_active } = req.body;
    const taxRateId = Number.parseInt(id);

    if (Number.isNaN(taxRateId)) {
      res.status(400).json({
        success: false,
        message: "ID harus berupa angka",
      });
      return;
    }

    // Validasi input
    if (rate !== undefined && (typeof rate !== 'number' || rate < 0 || rate > 100)) {
      res.status(400).json({
        success: false,
        message: "Rate harus berupa angka antara 0-100",
      });
      return;
    }

    const updateData: any = {};
    if (tax_name !== undefined) updateData.tax_name = tax_name;
    if (tax_code !== undefined) updateData.tax_code = tax_code;
    if (rate !== undefined) updateData.rate = rate;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedTaxRate = await prisma.tax_rates.update({
      where: { id: taxRateId },
      data: updateData,
      select: {
        id: true,
        tax_name: true,
        tax_code: true,
        rate: true,
        description: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Tax Rate berhasil diupdate",
      data: updatedTaxRate,
    });
  } catch (error) {
    console.error("Error update Tax Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    // Handle unique constraint violation
    if (errMsg.includes('Unique constraint')) {
      res.status(409).json({
        success: false,
        message: "Tax name atau tax code sudah ada",
      });
      return;
    }

    // Handle record not found
    if (errMsg.includes('Record to update not found')) {
      res.status(404).json({
        success: false,
        message: "Tax Rate tidak ditemukan",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat update Tax Rate",
      error: errMsg,
    });
  }
};

// Controller untuk delete tax rate
export const deleteTaxRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const taxRateId = Number.parseInt(id);

    if (Number.isNaN(taxRateId)) {
      res.status(400).json({
        success: false,
        message: "ID harus berupa angka",
      });
      return;
    }

    await prisma.tax_rates.delete({
      where: { id: taxRateId },
    });

    res.status(200).json({
      success: true,
      message: "Tax Rate berhasil dihapus",
    });
  } catch (error) {
    console.error("Error delete Tax Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    // Handle record not found
    if (errMsg.includes('Record to delete does not exist')) {
      res.status(404).json({
        success: false,
        message: "Tax Rate tidak ditemukan",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat delete Tax Rate",
      error: errMsg,
    });
  }
};
