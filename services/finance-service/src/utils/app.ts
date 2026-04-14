// src/utils/app.ts
import express from "express";
import cors from "cors";
import authRoutes from "../routes/auth.route";
import bankReconciliationRoutes from "../routes/bank-reconciliation.route";
import emailTestRoutes from "../routes/email-test.route";
import chartOfAccountsRoutes from "../routes/chartofaccounts.route";
import journalEntriesRoutes from "../routes/journalentries.route";
import generalJournalRoutes from "../routes/general-journal.route";
import taxRatesRoutes from "../routes/taxrates.route";
import exchangeRatesRoutes from "../routes/exchangerates.route";
import pricingRulesRoutes from "../routes/pricingrules.routes";
// import overheadAllocationsRoutes from "../routes/overheadallocations.routes"; // DISABLED - Model not in schema
import discountPoliciesRoutes from "../routes/discountpolicies.routes";
import marginPoliciesRoutes from "../routes/margin-policies.route";
// import paymentTermsRoutes from "../routes/paymentterms.routes"; // DISABLED - Model not in schema
// import expenseClaimPoliciesRoutes from "../routes/expenseclaimpolicies.routes"; // DISABLED - Model not in schema
// import expenseClaimsRoutes from "../routes/expense-claims.route"; // DISABLED - Model not in schema
// import expenseApprovalsRoutes from "../routes/expense-approvals.route"; // DISABLED - Model not in schema
// import expenseCategoriesRoutes from "../routes/expense-categories.route"; // DISABLED - Model not in schema
import invoicesRoutes from "../routes/invoices.route";
import paymentsRoutes from "../routes/payments.routes";
import reportsRoutes from "../routes/reports.route";
import dashboardRoutes from "../routes/dashboard.route";
import payablesRoutes from "../routes/payables.route";
import incentivesRoutes from "../routes/incentives.route";
// import assetsRoutes from "../routes/assets.route"; // DISABLED - Model not in schema
import quotationsRoutes from "../routes/quotations.routes";
import arRoutes from "../routes/ar.route";
import milestoneInvoicesRoutes from "../routes/milestone-invoices.route";
import invoiceMilestonesRoutes from "../routes/invoice-milestones.route";
import eventsRoutes from "../routes/events.route";
import healthRoutes from "../routes/health.route";
import quickActionsRoutes from "../routes/quick-actions.route";
// import { journalEvents } from "../services/journalEventListener"; // DISABLED - causes crashes

const app = express();

// Initialize journal event listeners (MIN-139) - TEMPORARILY DISABLED (causes crashes)
// console.log('🎧 Initializing journal event listeners...');
// journalEvents; // This triggers the constructor and setupListeners()

// CORS Configuration - Allow frontend to access API
app.use(cors({
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl, Postman, or local HTML files)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3012',
      'http://localhost:3013', 
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4003',
      'http://127.0.0.1:3012',
      'null' // For local file:// protocol
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin === 'null') {
      callback(null, true);
    } else {
      console.log('⚠️ CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma'],
}));

// Middleware bawaan Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (payment proofs, receipts, etc.)
app.use('/uploads', express.static('uploads'));

// Routes utama (finance) - FULL KOKPIT FINANSIAL
console.log("📍 Loading ALL finance routes for Project Finance...");
app.use("/api/auth", authRoutes);                            // Authentication Routes 🔐
app.use("/api/bank-reconciliation", bankReconciliationRoutes); // Bank Reconciliation (NEW) 🏦
app.use("/api/email", emailTestRoutes);                      // Email Testing & Notifications (NEW) 📧
app.use("/api", chartOfAccountsRoutes);                      // Chart of Accounts
app.use("/api/journal-entries", journalEntriesRoutes);       // Journal Entries (FITUR 3.4.C)
app.use("/api/journal-entries", generalJournalRoutes);       // General Journal Entry (FITUR 3.4.C) 📝
app.use("/api", taxRatesRoutes);                             // Tax Rates (FITUR 3.4.F - Kokpit) ✅
app.use("/api", exchangeRatesRoutes);                        // Exchange Rates (FITUR 3.4.F - Kokpit) ✅
app.use("/api/pricing-rules", pricingRulesRoutes);           // Pricing Rules (FITUR 3.4.F - Kokpit)
// app.use("/api/overhead-allocations", overheadAllocationsRoutes); // DISABLED - Model not in schema
app.use("/api/discount-policies", discountPoliciesRoutes);   // Discount Policies (FITUR 3.4.F - Kokpit)
app.use("/api/margin-policies", marginPoliciesRoutes);       // Margin Policies (TDD-014 - Pricing Control) 📊
// app.use("/api", paymentTermsRoutes);                         // DISABLED - Model not in schema
// app.use("/api", expenseClaimPoliciesRoutes);                 // DISABLED - Model not in schema
// app.use("/api/expense-claims", expenseClaimsRoutes);         // DISABLED - Model not in schema
// app.use("/api/expense-approvals", expenseApprovalsRoutes);   // DISABLED - Model not in schema
// app.use("/api/expense-categories", expenseCategoriesRoutes); // DISABLED - Model not in schema
app.use("/api/invoices", invoicesRoutes);                    // Invoices (FITUR 3.4.A & B)
app.use("/api/invoices", paymentsRoutes);                    // Invoice Payments (MIN-137 FIN-11) 💳
app.use("/api/quotations", quotationsRoutes);                // Quotations - Update status dari CRM
app.use("/api/payables", payablesRoutes);                    // Accounts Payable (AP) - Vendor Bills & Payments 💼
app.use("/api/reports", reportsRoutes);                      // Financial Reports (FITUR 3.4.D - Automation) ⭐
app.use("/api/dashboards", dashboardRoutes);                 // Finance Dashboard (FITUR 3.4.G - Analytics) 📊
app.use("/api/incentives", incentivesRoutes);                // Incentive Simulation (FITUR 3.4.H - Incentives) 🎯
// app.use("/api/assets", assetsRoutes);                        // DISABLED - Model not in schema
app.use("/api/ar", arRoutes);                                // Accounts Receivable Dashboard (Real-time AR Data) 💰
app.use("/api/milestone-invoices", milestoneInvoicesRoutes); // Auto-generate Invoice dari Milestone (FITUR 3.4.A - FIN-09) 🔄
app.use("/api/invoice-milestones", invoiceMilestonesRoutes); // Invoice Milestones Management (TDD-016) 📄
app.use("/api/quick-actions", quickActionsRoutes);           // Quick Actions - Pending Approvals (NEW) ⚡
app.use("/api/events", eventsRoutes);                        // Event Listener for Auto-Journal (MIN-139 FIN-12) 🎧
app.use("/api/health", healthRoutes);                        // Health Check & Monitoring 🏥
console.log("✅ Finance Service Active: AR ✅ AP ✅ Auto-Journal 📝 Bank Recon 🏦 Dashboard 📊 Invoices 💰");

// Default route untuk test server
app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).json({
    success: true,
    message: "Finance Service API is running 🚀",
  });
});

// 404 handler - pastikan mengembalikan JSON (HARUS SETELAH SEMUA ROUTES)
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler - HARUS PALING AKHIR dengan 4 parameters
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err);
  
  // Pastikan response adalah JSON
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;
