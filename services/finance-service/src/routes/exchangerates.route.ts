import express from "express";
import {
  getExchangeRates,
  getExchangeRateById,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate,
} from "../controllers/exchangerates.controllers";
import { verifyToken } from "../middlewares/auth.middlewares";

const router = express.Router();

// Exchange Rates routes
router.get("/exchange-rates", verifyToken, getExchangeRates);
router.get("/exchange-rates/:id", verifyToken, getExchangeRateById);
router.post("/exchange-rates", verifyToken, createExchangeRate);
router.put("/exchange-rates/:id", verifyToken, updateExchangeRate);
router.delete("/exchange-rates/:id", verifyToken, deleteExchangeRate);

export default router;
