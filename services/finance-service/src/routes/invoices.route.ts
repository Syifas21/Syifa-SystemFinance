import express from "express";
import { 
  getInvoices, 
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getARSummary,
  sendInvoice,
  recordPayment,
  sendInvoiceEmailController
} from "../controllers/invoices.controllers";

const router = express.Router();

// GET all invoices (dengan query params: status, customer_name, page, limit)
router.get("/", getInvoices);

// GET AR Summary - MUST BE BEFORE /:id to avoid conflict
router.get("/summary/ar", getARSummary);

// GET invoice by ID
router.get("/:id", getInvoiceById);

// POST create new invoice
router.post("/", createInvoice);

// POST send invoice via email
router.post("/send-email", sendInvoiceEmailController);

// PUT update invoice
router.put("/:id", updateInvoice);

// DELETE invoice
router.delete("/:id", deleteInvoice);

// PUT send invoice (change status to SENT, trigger journal)
router.put("/:id/send", sendInvoice);

// POST record payment
router.post("/:id/payments", recordPayment);

export default router;
