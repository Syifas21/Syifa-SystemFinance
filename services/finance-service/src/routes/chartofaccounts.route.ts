import express from "express";
import { 
  getChartOfAccounts, 
  createChartOfAccount, 
  updateChartOfAccount, 
  deleteChartOfAccount 
} from "../controllers/chartofaccounts.controllers";

const router = express.Router();

// Route endpoints for Chart of Accounts
router.get("/chartofaccounts", getChartOfAccounts);
router.post("/chartofaccounts", createChartOfAccount);
router.put("/chartofaccounts/:id", updateChartOfAccount);
router.delete("/chartofaccounts/:id", deleteChartOfAccount);

export default router;
