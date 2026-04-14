import express from "express";
import {
  getTaxRates,
  getTaxRateById,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
} from "../controllers/taxrates.controllers";
import { verifyToken } from "../middlewares/auth.middlewares";

const router = express.Router();

// Tax Rates routes
router.get("/tax-rates", verifyToken, getTaxRates);
router.get("/tax-rates/:id", verifyToken, getTaxRateById);
router.post("/tax-rates", verifyToken, createTaxRate);
router.put("/tax-rates/:id", verifyToken, updateTaxRate);
router.delete("/tax-rates/:id", verifyToken, deleteTaxRate);

export default router;
