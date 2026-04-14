import { Request, Response } from "express";
import { prisma } from '../lib/prisma';
import { mockExchangeRates } from '../utils/mockData';

// Controller untuk ambil daftar exchange rates
export const getExchangeRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { is_active } = req.query;
    
    const whereClause = is_active !== undefined 
      ? { is_active: is_active === 'true' }
      : {};

    const exchangeRates = await prisma.exchange_rates.findMany({
      where: whereClause,
      select: {
        id: true,
        currency_from: true,
        currency_to: true,
        rate: true,
        effective_date: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { currency_from: "asc" },
    });

    res.status(200).json({
      success: true,
      message: "Daftar Exchange Rates berhasil diambil dari database",
      data: exchangeRates,
    });
  } catch (error) {
    console.error("⚠️ Database error, using mock data:", error);

    // Fallback to mock data
    res.status(200).json({
      success: true,
      message: "Daftar Exchange Rates (Mock Data for Development)",
      data: mockExchangeRates,
    });
  }
};

// Controller untuk ambil exchange rate berdasarkan ID
export const getExchangeRateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const rateId = Number.parseInt(id);

    if (Number.isNaN(rateId)) {
      res.status(400).json({
        success: false,
        message: "ID harus berupa angka",
      });
      return;
    }

    const exchangeRate = await prisma.exchange_rates.findUnique({
      where: { id: rateId },
      select: {
        id: true,
        currency_from: true,
        currency_to: true,
        rate: true,
        effective_date: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!exchangeRate) {
      res.status(404).json({
        success: false,
        message: "Exchange Rate tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Exchange Rate berhasil diambil dari database",
      data: exchangeRate,
    });
  } catch (error) {
    console.error("Error mengambil Exchange Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil data Exchange Rate",
      error: errMsg,
    });
  }
};

// Controller untuk membuat exchange rate baru
export const createExchangeRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currency_from, currency_to, rate, effective_date, is_active } = req.body;

    // Validasi input
    if (!currency_from || !currency_to || rate === undefined || rate === null || !effective_date) {
      res.status(400).json({
        success: false,
        message: "Currency from, currency to, rate, dan effective date harus diisi",
      });
      return;
    }

    if (currency_from.length !== 3 || currency_to.length !== 3) {
      res.status(400).json({
        success: false,
        message: "Currency code harus berupa 3 karakter",
      });
      return;
    }

    if (typeof rate !== 'number' || rate <= 0) {
      res.status(400).json({
        success: false,
        message: "Rate harus berupa angka positif",
      });
      return;
    }

    const newExchangeRate = await prisma.exchange_rates.create({
      data: {
        currency_from: currency_from.toUpperCase(),
        currency_to: currency_to.toUpperCase(),
        rate,
        effective_date: new Date(effective_date),
        is_active: is_active !== undefined ? is_active : true,
      },
      select: {
        id: true,
        currency_from: true,
        currency_to: true,
        rate: true,
        effective_date: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Exchange Rate berhasil dibuat",
      data: newExchangeRate,
    });
  } catch (error) {
    console.error("Error membuat Exchange Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    // Handle unique constraint violation
    if (errMsg.includes('Unique constraint')) {
      res.status(409).json({
        success: false,
        message: "Currency code sudah ada",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat membuat Exchange Rate",
      error: errMsg,
    });
  }
};

// Controller untuk update exchange rate
export const updateExchangeRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { currency_from, currency_to, rate, effective_date, is_active } = req.body;
    
    const rateId = Number.parseInt(id);

    if (Number.isNaN(rateId)) {
      res.status(400).json({
        success: false,
        message: "ID harus berupa angka",
      });
      return;
    }

    // Cek apakah exchange rate ada
    const existing = await prisma.exchange_rates.findUnique({
      where: { id: rateId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: "Exchange Rate tidak ditemukan",
      });
      return;
    }

    // Validasi input
    if (rate !== undefined && (typeof rate !== 'number' || rate <= 0)) {
      res.status(400).json({
        success: false,
        message: "Rate harus berupa angka positif",
      });
      return;
    }

    const updateData: any = {};
    if (currency_from !== undefined) updateData.currency_from = currency_from.toUpperCase();
    if (currency_to !== undefined) updateData.currency_to = currency_to.toUpperCase();
    if (rate !== undefined) updateData.rate = rate;
    if (effective_date !== undefined) updateData.effective_date = new Date(effective_date);
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedExchangeRate = await prisma.exchange_rates.update({
      where: { id: rateId },
      data: updateData,
      select: {
        id: true,
        currency_from: true,
        currency_to: true,
        rate: true,
        effective_date: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Exchange Rate berhasil diupdate",
      data: updatedExchangeRate,
    });
  } catch (error) {
    console.error("Error update Exchange Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    // Handle record not found
    if (errMsg.includes('Record to update not found')) {
      res.status(404).json({
        success: false,
        message: "Exchange Rate tidak ditemukan",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat update Exchange Rate",
      error: errMsg,
    });
  }
};

// Controller untuk delete exchange rate
export const deleteExchangeRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const rateId = Number.parseInt(id);

    if (Number.isNaN(rateId)) {
      res.status(400).json({
        success: false,
        message: "ID harus berupa angka",
      });
      return;
    }

    // Cek apakah exchange rate ada
    const existing = await prisma.exchange_rates.findUnique({
      where: { id: rateId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: "Exchange Rate tidak ditemukan",
      });
      return;
    }

    await prisma.exchange_rates.delete({
      where: { id: rateId },
    });

    res.status(200).json({
      success: true,
      message: "Exchange Rate berhasil dihapus",
    });
  } catch (error) {
    console.error("Error delete Exchange Rate:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat delete Exchange Rate",
      error: errMsg,
    });
  }
};

// Controller untuk bulk update exchange rates
export const bulkUpdateExchangeRates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rates } = req.body;

    if (!Array.isArray(rates) || rates.length === 0) {
      res.status(400).json({
        success: false,
        message: "Rates harus berupa array yang tidak kosong",
      });
      return;
    }

    // Validasi setiap rate
    for (const rate of rates) {
      if (!rate.currency_code || rate.currency_code.length !== 3) {
        res.status(400).json({
          success: false,
          message: "Currency code harus berupa 3 karakter",
        });
        return;
      }
      if (typeof rate.rate_to_idr !== 'number' || rate.rate_to_idr <= 0) {
        res.status(400).json({
          success: false,
          message: "Rate to IDR harus berupa angka positif",
        });
        return;
      }
    }

    // Update atau create setiap rate
    const results = [];
    for (const rate of rates) {
      const result = await prisma.exchange_rates.upsert({
        where: { 
          currency_from_currency_to_effective_date: {
            currency_from: rate.currency_code.toUpperCase(),
            currency_to: 'IDR',
            effective_date: new Date()
          }
        },
        update: { 
          rate: rate.rate_to_idr,
          is_active: true
        },
        create: {
          currency_from: rate.currency_code.toUpperCase(),
          currency_to: 'IDR',
          rate: rate.rate_to_idr,
          effective_date: new Date(),
          is_active: true,
        },
        select: {
          currency_from: true,
          currency_to: true,
          rate: true,
          effective_date: true,
          updated_at: true,
        },
      });
      results.push(result);
    }

    res.status(200).json({
      success: true,
      message: "Exchange Rates berhasil diupdate secara bulk",
      data: results,
    });
  } catch (error) {
    console.error("Error bulk update Exchange Rates:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat bulk update Exchange Rates",
      error: errMsg,
    });
  }
};
