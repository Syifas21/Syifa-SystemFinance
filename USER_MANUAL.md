# 📖 PROJECT FINANCE SYSTEM - USER MANUAL
## Comprehensive Guide for Finance Management

---

## Table of Contents
1. System Overview
2. Getting Started
3. User Roles & Permissions
4. Main Modules
5. Workflows & Procedures
6. Troubleshooting
7. FAQ

---

## 1. System Overview

### What is Project Finance System?

**Project Finance System** adalah platform manajemen keuangan terintegrasi yang dirancang untuk:
- ✅ Mengelola piutang dagang (Invoice/AR)
- ✅ Mengelola utang dagang (Payables/AP)
- ✅ Menghasilkan laporan keuangan (Financial Reports)
- ✅ Memastikan kepatuhan kebijakan (Policy Enforcement)
- ✅ Melacak dan menyetujui pengeluaran

**Key Features:**
| Feature | Description |
|---------|-------------|
| **Invoice Management** | Create, track, approve, and record payments for customer invoices |
| **Payables Management** | Record vendor invoices, schedule payments, track aging |
| **Financial Reporting** | Generate GL, trial balance, balance sheet, income statement |
| **Policy Management** | Define and enforce margin, discount, and tax policies |
| **Document Management** | Attach and organize supporting documents |
| **Multi-User Access** | Role-based access for CEO and Finance Admin |
| **Real-time Notifications** | Instant alerts for approvals and actions |
| **Mobile Responsive** | Works on desktop, tablet, and mobile devices |

**Technology Stack:**
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL
- Authentication: JWT + bcrypt

---

## 2. Getting Started

### System Access

**URL:**
```
Development: http://localhost:5173
Production: [Your domain]
```

**Supported Browsers:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Login Process

**Step 1: Navigate to Login Page**
- Open browser, go to system URL
- Login page displays with "Project Finance" title

```
┌─────────────────────────────────────┐
│         PROJECT FINANCE             │
│    Sistem Manajemen Keuangan        │
├─────────────────────────────────────┤
│                                     │
│ Alamat Email:  [____________]       │
│ Kata Sandi:    [____________] 👁️   │
│                                     │
│ ☐ Ingat saya  | Lupa password?      │
│                                     │
│        [ MASUK ]                    │
│                                     │
│        Atau sebagai:                │
│  [ 👔 CEO ]  [ 💼 Admin Keuangan ]  │
│                                     │
└─────────────────────────────────────┘
```

**Step 2: Enter Credentials**
- Email: Your login email
- Password: Your secure password

**Step 3: Click Masuk (Login)**
- Wait for authentication
- If successful: Dashboard loads
- If failed: Error message displays (check email/password)

**Step 4: Dashboard Display**
- After login, you'll see the dashboard based on your role
- Menu on left sidebar
- Quick actions panel (top right)

**Session Management:**
- Login valid for 24 hours
- Token auto-refreshes with activity
- Logout clears session
- Inactive sessions expire (auto-logout)

---

## 3. User Roles & Permissions

### Role 1: CEO (Chief Executive Officer)

**Access Level:** FULL

**Dashboard View:**
```
CEO Dashboard
├─ Quick Actions (5 items)
│  ├─ Pending Approvals
│  ├─ Margin Violations
│  ├─ Overdue Invoices
│  ├─ Due Payments
│  └─ Pending Payables
├─ Financial Metrics
│  ├─ Total AR
│  ├─ Total AP
│  └─ Cash Position
└─ Key Reports
```

**Menu Access:**
- ✅ Dashboard (full)
- ✅ Invoices (create, approve, view all)
- ✅ Payables (view, approve payments)
- ✅ Accounts Receivable (aging, analytics)
- ✅ Reports (all financial reports)
- ✅ Policies (manage all policies)
- ✅ Settings (system configuration)

**Key Capabilities:**
- Create and approve invoices
- Approve payments
- Manage pricing policies
- Set discount limits
- Review financial reports
- Approve policy exceptions
- Manage user accounts

---

### Role 2: Finance Admin

**Access Level:** LIMITED

**Dashboard View:**
```
Finance Admin Dashboard
├─ Quick Actions (4 items)
│  ├─ New Invoices to Record
│  ├─ Pending Payables
│  ├─ Due Payments (This Week)
│  └─ Aging Items
├─ Summary Metrics
│  ├─ This Month Transactions
│  ├─ Payment Status
│  └─ Aging Breakdown
└─ My Documents
```

**Menu Access:**
- ✅ Dashboard (limited view)
- ✅ Invoices (record, view, NO approval)
- ✅ Payables (record, track, NO approval)
- ✅ Accounts Receivable (aging, tracking)
- ✅ Accounting (journal entries, GL)
- ✅ Reports (read-only, basic reports)
- ❌ Settings (no access)
- ❌ Policy Management (view only)

**Key Capabilities:**
- Record customer invoices
- Record vendor invoices
- Track payments
- Generate aging reports
- Post journal entries
- View general ledger
- Upload supporting documents
- Export data (CSV/PDF)

---

## 4. Main Modules

### MODULE 1: INVOICES (ACCOUNTS RECEIVABLE)

#### 4.1.1 View Invoice List

**Location:** Invoices → Invoice List

**Steps:**
1. Click **Invoices** menu on left sidebar
2. Click **Invoice List** (or it's default tab)
3. Table displays all invoices with columns:
   - Invoice Number
   - Customer Name
   - Invoice Date
   - Due Date
   - Amount
   - Status (DRAFT, SENT, PAID, OVERDUE)

**Filtering & Searching:**
```
Search Box:        Type invoice # or customer name
Filter by Status:  DRAFT | SENT | PAID | OVERDUE | CANCELLED
Sort by:           Date (ascending/descending)
Date Range:        Pick start/end date
```

**How to Read Status:**
- 🟦 **DRAFT**: Not approved yet, editable by creator
- 🟩 **SENT**: Approved, sent to customer, awaiting payment
- 🟪 **PAID**: Fully paid by customer
- 🟥 **OVERDUE**: Due date passed, not yet paid
- ⚪ **CANCELLED**: Cancelled/void invoice

---

#### 4.1.2 Create New Invoice

**Location:** Invoices → New Invoice or [+] Button

**Step-by-Step:**

**Step 1: Start New Invoice**
- Click **New Invoice** button
- Form opens with empty fields

**Step 2: Fill Customer Information**
```
Invoice Number:    [Auto-generated: INV-0001]
Invoice Date:      [Today by default] ← Click to change
Due Date:          [30 days out by default] ← Click to change
Customer Name:     [Type or select from dropdown]
Customer Address:  [Pre-filled if customer exists]
Customer Email:    [Pre-filled if customer exists]
Payment Terms:     [NET 30 / NET 60 / etc]
```

**Step 3: Add Line Items**
- Click **Add Item** button
- Table row appears

```
Description          Qty    Unit Price    Amount
─────────────────────────────────────────────────
Service A            1      1,000,000     1,000,000
Product B            2      500,000       1,000,000
```

**For each line item:**
- **Description**: What is being billed (e.g., "Professional Services")
- **Quantity**: Number of units
- **Unit Price**: Price per unit
- **Amount**: Automatically calculated (Qty × Unit Price)

**Add more items:**
- Click **Add Another Item** button
- Repeat as needed

**Step 4: System Auto-Calculates**
```
Subtotal:        2,000,000      (Sum of all Amount)
Tax (10%):         200,000      (Based on tax rate)
Discount:              0         (If applicable)
────────────────────────────────
TOTAL:           2,200,000
```

**Step 5: Add Notes (Optional)**
```
Internal Notes:  [Type notes for internal use only]
Example: "Project Alpha Phase 2 - Final billing"
```

**Step 6: Attach Documents (Optional)**
- Click **Attach Document**
- Upload purchase order, contract, etc
- Max file size: 10MB
- Supported formats: PDF, Doc, Excel, Image

**Step 7: Review Before Submit**
- Check all information is correct
- Review line items and totals
- Click **Preview Invoice** to see formatted version

**Step 8: Save Invoice**
```
[Cancel]  [Save as Draft]  [Submit]
```

- **Cancel**: Discard all changes, back to list
- **Save as Draft**: Keep for editing later
  - Status = DRAFT
  - Can be edited anytime
- **Submit**: Send for approval
  - Status = PENDING_APPROVAL
  - Requires CEO approval before sending

**Result:**
- ✅ Toast notification: "Invoice created successfully!"
- Invoice appears in list with DRAFT status
- Creator can edit
- Only approver (CEO) can send to customer

---

#### 4.1.3 Approve Invoice (CEO Only)

**Location:** Invoices → Pending Approvals or List (filter DRAFT)

**Steps:**

**Step 1: Find Invoice to Approve**
- Go to Invoices menu
- Filter by Status = **DRAFT**
- Or go to Quick Actions → Pending Approvals
- Click on invoice to open

**Step 2: Review Invoice**
- Check customer details
- Verify line items and amounts
- Confirm totals and tax
- Check due date and payment terms
- Review attached documents

**Step 3: Approve Decision**
```
[Reject]  [Request Revision]  [Approve]
```

**Option A: Approve**
1. Click **Approve** button
2. Add approval notes (optional)
3. Click **Confirm Approval**
4. Toast: "Invoice approved!"
5. Status → SENT
6. Invoice sent to customer (email)
7. Customer can view and makes payment

**Option B: Reject**
1. Click **Reject** button
2. Reason for rejection: (required)
3. Click **Confirm Rejection**
4. Status → REJECTED
5. Notify creator to revise
6. Creator edits and resubmits

**Option C: Request Revision**
1. Click **Request Revision**
2. Type specific changes needed
3. Click **Send Back**
4. Creator gets notification
5. Status → AWAITING_REVISION
6. Creator makes changes and resubmits

**Result:**
- Invoice moves to SENT status
- Customer is notified
- System awaits payment receipt

---

#### 4.1.4 Record Payment

**Location:** Invoices → Select Invoice → Record Payment

**Steps:**

**Step 1: Find Invoice**
- Status = SENT or OVERDUE
- Click on invoice row
- Click **Record Payment** button

**Step 2: Enter Payment Details**
```
Payment Date:          [Today] ← Change if needed
Payment Amount:        [10,000,000]
Payment Method:        [Bank Transfer / Cash / Check]
Reference Number:      [Bank Transfer ID or Check #]
Bank Name:            [Name of receiving bank]
Payment Notes:        [Optional notes]
```

**Step 3: Attach Payment Proof**
- Click **Attach Proof of Payment**
- Upload bank receipt, check image, etc
- Formats: PDF, JPG, PNG (max 5MB)

**Step 4: Review Payment**
- Confirm amount matches invoice
- Check date is correct
- Review all details

**Step 5: Record Payment**
- Click **Record Payment**
- System checks:
  - Amount ≤ Invoice total
  - Date is valid
  - Reference number is unique

**Results:**
- ✅ Toast: "Payment recorded successfully!"
- Payment entry created in database
- GL transaction auto-created:
  - DR: Cash/Bank Account
  - CR: Accounts Receivable
- Invoice status automatic:
  - If fully paid → PAID
  - If partial → PARTIAL_PAID
- Email sent to customer confirmation

**Partial Payments:**
- System allows multiple payments per invoice
- Each payment recorded separately
- Total monitored to invoice amount
- Final payment marks invoice PAID

---

#### 4.1.5 View Aging Report

**Location:** Reports → Aging Reports or Invoices → Aging

**Steps:**

**Step 1: Open Aging Report**
- Click **Reports** menu
- Click **Aging Reports**
- Select **Customer Aging** or **Invoice Aging**

**Step 2: Choose Report Options**
```
Report Type:       Customer Aging / Invoice Aging
As of Date:        [Today by default]
Show:             • All invoices
                  • Overdue only
                  • Pending payment only
Grouping:         By Customer / By Date Range
```

**Step 3: View Report**
```
ACCOUNTS RECEIVABLE AGING REPORT
As of: 2026-04-01

Customer         Current    30-60 Days    60-90 Days    >90 Days     Total
────────────────────────────────────────────────────────────────────────
ABC Corp         500,000    200,000       100,000           0      800,000
XYZ Inc          300,000         0             0      150,000      450,000
─────────────────────────────────────────────────────────────────────────
TOTAL          1,100,000    400,000       200,000      250,000    1,950,000
```

**Interpretation:**
- **Current**: Due within 30 days
- **30-60 Days**: Overdue 30-60 days
- **60-90 Days**: Overdue 60-90 days
- **>90 Days**: Heavily overdue, priority collection

**Actions from Aging Report:**
1. Identify overdue customers
2. Click customer name to see details
3. Click individual invoice to:
   - View details
   - Record partial payment
   - Send reminder
   - Adjust terms

**Export Reports:**
- Click **Export** button
- Choose format:
  - **PDF**: For printing, email to boss
  - **Excel**: For analysis, pivot tables
  - **CSV**: For data import elsewhere

---

### MODULE 2: PAYABLES (ACCOUNTS PAYABLE)

#### 4.2.1 Create Payable

**Location:** Payables → New Payable or [+] Button

**Steps:**

**Step 1: Start New Payable**
- Click **New Payable**
- Form opens

**Step 2: Enter Vendor Information**
```
Vendor Name:               [Select or type vendor]
Vendor Invoice Number:     [Vendor's invoice #] ← MUST be unique
Invoice Date:              [Date on vendor invoice]
Due Date:                  [When payment is due]
```

**Step 3: Enter Amount Details**
```
Subtotal:                 [Amount before tax]
Tax Percentage:           [Auto-lookup or manual]
Tax Amount:               [Auto-calculated]
────────────────────────────────
Total Amount:             [Calculated total]
Currency:                 [IDR / USD / etc]
```

**Step 4: Add Payment Details**
```
Payment Method:           [Bank Transfer / Cash / Check]
PO Number (if any):       [Reference to purchase order]
Description:              [What is being paid for]
```

**Step 5: Add Line Items (Optional)**
- Click **Add Details**
- Can add details of items/services purchased

**Step 6: Attach Vendor Invoice**
- Click **Attach Vendor Invoice**
- Upload scan of invoice
- System stores for audit trail

**Step 7: Submit Payable**
- Click **Submit**
- Status = PENDING
- Finance Admin records it
- Creates GL entry:
  - DR: Expense or Asset (depending on item type)
  - CR: Accounts Payable

**Result:**
- ✅ Toast: "Payable created successfully!"
- Now visible in Payables list
- Ready for payment scheduling

---

#### 4.2.2 Record Payment

**Location:** Payables → Select Payable → Record Payment

**Similar to Invoice Payment:**

**Steps:**
1. Select payable from list
2. Click **Record Payment**
3. Enter payment details (date, amount, method, reference)
4. Attach payment proof
5. Click **Record Payment**

**Result:**
- Payment recorded
- GL entry created (DR: AP, CR: Cash)
- Status updated to PAID if full payment
- Email confirmation to internal team

---

#### 4.2.3 View Payables Aging

**Location:** Reports → Payables Aging

**Shows:**
- Vendor aging (who owes payment)
- Days outstanding (how late)
- Amount by aging bucket (Current/30-60/60-90/>90)
- Total outstanding

**Use to:**
- Identify due payments
- Plan cash flow
- Communicate with vendors

---

### MODULE 3: FINANCIAL REPORTS

#### 4.3.1 General Ledger

**Location:** Reports → General Ledger

**What it shows:**
- Every transaction in account
- Date, description, debit/credit
- Running balance

**Example:**
```
General Ledger - Account 1100 (CASH)
Date         Description              Debit        Credit       Balance
────────────────────────────────────────────────────────────────────────
2026-01-01   Opening balance                                    10,000,000
2026-01-05   Invoice INV-001 paid                   9,500,000     500,000
2026-01-10   AP paid to ABC Corp      2,000,000                2,500,000
```

**Use for:**
- Detailed transaction review
- Audit purposes
- Verification of entries
- Account reconciliation

---

#### 4.3.2 Trial Balance

**Location:** Reports → Trial Balance

**What it is:**
- List of ALL accounts
- Debit and credit columns
- Should always balance (Total DR = Total CR)

**Example:**
```
Trial Balance - 2026-03-31
Account                          Code      Debit         Credit
──────────────────────────────────────────────────────────────
Cash                            1100   5,000,000
Accounts Receivable             1200   2,500,000
Equipment                       1500   10,000,000
Accounts Payable                2100                   3,200,000
Revenue                         4100                  15,000,000
Expense                         5100    1,500,000
────────────────────────────────────────────────────────
TOTAL                                  19,000,000   19,000,000  ✓
```

**Why it matters:**
- Verifies GL accuracy
- Identifies posting errors
- Starting point for financial statements

---

#### 4.3.3 Balance Sheet

**Location:** Reports → Balance Sheet

**What it shows:**
- Assets = Liabilities + Equity at a point in time

```
PROJECT FINANCE - BALANCE SHEET
As of: 2026-03-31

ASSETS                                              Amount
────────────────────────────────────────────────────────
Current Assets:
  Cash                            5,000,000
  Accounts Receivable             2,500,000
  ────────────────────────────────────
  Total Current Assets                           7,500,000

Fixed Assets:
  Equipment               10,000,000
  Acc. Depreciation       (1,000,000)
  ────────────────────────────────────
  Total Fixed Assets                            9,000,000
                                                
TOTAL ASSETS                                  16,500,000


LIABILITIES & EQUITY
────────────────────────────────────────────────────────
Current Liabilities:
  Accounts Payable                3,200,000
  ────────────────────────────────────
  Total Current Liabilities                    3,200,000

Equity:
  Capital Stock          10,000,000
  Retained Earnings       3,300,000
  ────────────────────────────────────
  Total Equity                                13,300,000

TOTAL LIAB & EQUITY                         16,500,000
```

**Balance Sheet Equation:**
✓ **ASSETS (16,500,000) = LIABILITIES (3,200,000) + EQUITY (13,300,000)**

---

#### 4.3.4 Income Statement

**Location:** Reports → Income Statement

**What it shows:**
- Revenue - Expenses = Net Income/Loss for period

```
PROJECT FINANCE - INCOME STATEMENT
For the Period: 2026-01-01 to 2026-03-31

REVENUE:                                            Amount
  Service Revenue            15,000,000
  Product Revenue             5,000,000
  ─────────────────────────────────────────────
  Total Revenue                                 20,000,000
  
EXPENSES:
  Salaries & Wages            4,000,000
  Office Supplies               500,000
  Rent                          800,000
  Utilities                     200,000
  Depreciation                1,000,000
  ─────────────────────────────────────────────
  Total Expenses                                 6,500,000

GROSS PROFIT                                    13,500,000
(Revenue - Expenses)

NET INCOME / (LOSS)                            13,500,000
```

**Interpretation:**
- Positive number = Company is profitable
- Negative number = Company is losing money
- Use to assess business performance

---

#### 4.3.5 Export & Print Reports

**For any report:**

1. Click **Export** button
2. Choose format:
   ```
   [PDF] - For printing, emailing to management
   [Excel] - For further analysis, charts
   [CSV] - For data import to other systems
   ```
3. File downloads to your computer
4. Open and view/print/share

---

### MODULE 4: POLICIES

#### 4.4.1 Tax Rates (Read-Only for Finance Admin)

**Location:** Policies → Tax Rates

**Shows:**
- Tax names (PPN, PPh, etc)
- Tax rates (10%, 15%, etc)
- Whether active or inactive

**Use for:**
- Understand what taxes apply
- Verify calculations
- Reference for explanations

**View Only:** Finance Admin cannot edit
**CEO Access:** Can add/edit/delete tax rates

---

#### 4.4.2 Discount Policies (CEO Only)

**Location:** Policies → Discount Policies

**What it controls:**
- Maximum discount each role can give

**Example:**
```
Role: CEO
Maximum Discount:     25%
Authority Limit:      1,000,000

Meaning: CEO can give up to 25% discount on any sale
but total discounts per transaction can't exceed 1,000,000
```

---

#### 4.4.3 Margin Policies (CEO Manages)

**Location:** Policies → Margin Policies

**What it is:**
- Minimum and maximum profit margins by product category

**Example:**
```
Product Category: SYSTEM_A
Minimum Margin:   15%
Maximum Margin:   30%

Meaning: Products in this category must have 
profit margin between 15-30%  
Below 15% = VIOLATION
Above 30% = Unusual, might indicate error
```

**Policy Enforcement:**
- Sales system checks margin when quoting
- If violates: Flag as violation
- Violation must be approved by CEO
- Creates audit trail for compliance

---

## 5. Workflows & Procedures

### Workflow 1: Complete Invoice Lifecycle

```
1. CREATION (Finance Admin)
   │
   └─► Invoice created, Status = DRAFT
       Editable by creator
   
2. APPROVAL (CEO)
   │
   ├─► CEO reviews
   │   ├─ Approve → Status = SENT
   │   ├─ Reject → Status = REJECTED (back to creator)
   │   └─ Ask Revision → Status = AWAITING_REVISION
   │
   └─► If Approved: SENT
       - Customer notified via email
       - Customer can view invoice
       - Awaits payment

3. PAYMENT (Customer pays)
   │
   └─► Payment received by Finance Admin
       Status = PARTIALLY_PAID or PAID

4. ARCHIVAL
   │
   └─► Invoice completed
       Status = PAID
       Stored in history
       Available for reporting & audit
```

---

### Workflow 2: Complete Payable Lifecycle

```
1. CREATION (Finance Admin receives vendor invoice)
   │
   └─► Payable created, Status = PENDING

2. PAYMENT SCHEDULING
   │
   ├─► Finance Admin schedules payment
   │   - Sets payment date
   │   - Arranges funds
   │
   └─► Payment scheduled (may still be PENDING)

3. PAYMENT EXECUTION (When due)
   │
   └─► Payment made to vendor
       Status = PAID
       Payment proof attached

4. RECONCILIATION
   │
   └─► Bank reconciliation
       Match payment to bank statement
       Close payable
```

---

### Workflow 3: Monthly Close Process

**Steps for Finance Admin & CEO:**

**Week 1-2 of Following Month:**

**Step 1: Prepare Transactions**
- Record all invoices (all customer invoices received)
- Record all payables (all vendor invoices received)
- Record all payments (both received and paid)
- Upload supporting documents

**Step 2: Reconciliation**
- Match bank statement to system cash account
- Use Bank Reconciliation module
- Identify any discrepancies

**Step 3: Journal Entries**
- Post any manual entries (accruals, adjustments)
- Chart of Accounts updates if needed

**Step 4: Generate Trial Balance**
- Reports → Trial Balance
- Verify total debits = total credits
- If not: Find posting errors

**Step 5: Financial Statements**
- Generate Balance Sheet
- Generate Income Statement
- Review for reasonableness

**Step 6: Review & Approval**
- Finance Admin reviews with CEO
- Identify any anomalies
- Approve or discuss adjustments

**Step 7: Final Report**
- Export reports (PDF for record)
- Send to management/stakeholders
- Maintain records for audit

---

## 6. Troubleshooting

### Problem 1: Can't Login

**Symptom:** Error "Email atau password salah"

**Causes & Solutions:**

| Issue | Solution |
|-------|----------|
| Wrong email | Check capitalization, spelling, spaces |
| Wrong password | Verify CAPS LOCK off; try Forgot Password |
| Account inactive | Contact CEO to activate your account |
| System error | Clear browser cache, try again |

**How to Clear Cache:**
- Chrome: Ctrl+Shift+Delete → Select "All time" → Clear data
- Firefox: Ctrl+Shift+Delete → Select "Everything" → Clear Now
- Safari: Cmd+Shift+Delete

---

### Problem 2: Invoice Not Saving

**Symptom:** Click Save → Nothing happens, no toast notification

**Causes & Solutions:**

| Issue | Solution |
|-------|----------|
| Missing required fields | Check: Customer name, invoice date, at least 1 line item |
| Invalid date | Make sure due_date ≥ invoice_date |
| Line items empty | Add at least one item with qty & price |
| Amount = 0 | Check prices not blank or zero |

**Check Console:**
- Press F12 to open Developer Tools
- Go to Console tab
- Look for red error messages
- Screenshot and send to IT

---

### Problem 3: Report Doesn't Load

**Symptom:** Click "Generate Report" → Loading spinner spins forever

**Causes & Solutions:**

| Issue | Solution |
|-------|----------|
| Too much data | Narrow date range; limit year to current |
| Backend not running | Check backend server is running (port 3002) |
| Network issue | Check internet connection; try again |
| Browser issue | Try different browser or incognito window |

**Check Backend Status:**
```bash
# On server terminal:
netstat -an | grep 3002
# Should show: LISTENING

# If not running:
npm start
# or
pm2 start app
```

---

### Problem 4: Payment Recording Error

**Symptom:** "Error recording payment" after clicking Record

**Causes & Solutions:**

| Issue | Solution |
|-------|----------|
| Amount > Invoice | Check payment amount ≤ invoice total |
| Amount = 0 | Enter valid payment amount |
| Invalid date | Check date is valid & ≤ today |
| Duplicate ref | Reference number already used; use different # |

---

### Problem 5: No Permission / Access Denied

**Symptom:** Try to access feature → Red error "Unauthorized"

**Cause:** Your role doesn't have permission

**Solution:**
- Check your role: Click profile → See role
- CEO: Has all access
- Finance Admin: Limited access (no approvals)
- Contact CEO if you need access to restricted features

---

## 7. FAQ (Frequently Asked Questions)

### Q1: Can I edit an invoice after sending to customer?

**A:** No. Once status = SENT, invoice is locked.
- To make changes: Request CEO to REJECT invoice
- Rejected invoice → editable again
- Edit → Resubmit for approval
- This maintains audit trail

---

### Q2: What if customer pays partial amount?

**A:** System records partial payment automatically.
- Payment recorded as PARTIAL_PAID
- Can record multiple payments
- Each payment logged separately
- When sum = total → auto-marked PAID

---

### Q3: Can vendors see their payables in the system?

**A:** No. Payables module is internal only.
- Finance team records vendor invoices
- Vendors don't access system
- Vendors paid by company (not self-service)

---

### Q4: How long is login session valid?

**A:** 24 hours from login time.
- Auto-logout after 24 hours of first login
- Auto-logout if inactive 1 hour
- Manual logout ends session immediately
- Re-login required

---

### Q5: Can I delete an invoice?

**A:** No. System doesn't allow deletion.
- Maintains audit trail
- Instead: Use CANCEL status
- Cancelled invoices appear in reports (for disclosure)
- Finance can explain why cancelled

---

### Q6: What if bank reconciliation doesn't balance?

**A:** Find the difference and investigate.

**Steps:**
1. Verify all payments recorded in system
2. Match system list to bank statement
3. Identify missing items:
   - Bank charges? Post as expense
   - Pending deposits? Still awaiting
   - Check not cleared? Note date
4. Create adjustment entries if necessary
5. Document explanation for audit

---

### Q7: Can I export reports to Excel?

**A:** Yes. All reports have Export button.

**How:**
1. Generate report
2. Click **Export** button
3. Choose **Excel**
4. File downloads (check Downloads folder)
5. Open in Excel, edit, pivot, chart as needed
6. Save to your local computer

---

### Q8: How is password security handled?

**A:** Passwords are encrypted (one-way hash).
- Never stored as plain text
- Uses bcrypt algorithm
- Impossible to reverse/recover password
- If forgotten: Admin resets (doesn't recover old one)

---

### Q9: Who can approve invoices?

**A:** Only CEO role can approve.
- Finance Admin: Can create/record
- CEO: Sole approver
- Ensures control/governance
- Single point of authority

---

### Q10: What happens if system crashes?

**A:** All data is saved in database.
- System outage: Page shows error
- Data is NOT lost
- Contact IT for restart
- Refresh browser once system is back
- All your work is preserved

---

##Quick Reference - Common Tasks

| Task | Menu Path | Notes |
|------|-----------|-------|
| Create Invoice | Invoices → New Invoice | Creator is Finance Admin |
| Approve Invoice | Invoices → List (DRAFT) → Click | CEO only |
| Record Payment | Invoices → Click → Record Payment | Finance Admin |
| View Aging | Reports → Aging Reports | Shows overdue items |
| Get Balance Sheet | Reports → Balance Sheet | Pick "as of" date |
| Generate Income Stmt | Reports → Income Statement | Pick date range |
| Create Payable | Payables → New Payable | From vendor invoice |
| Manage Tax Rates | Policies → Tax Rates | CEO only |
| Bank Reconciliation | Reports → Bank Reconciliation | Monthly task |
| Export Report | Any Report → Export → Excel | Saves to Downloads |

---

## Getting Help

**For Technical Issues:**
- IT Department: [contact info]
- Help Desk: [support email/phone]
- System Admin: [contact]

**For Business/Process Questions:**
- Finance Manager
- CEO (for approvals)
- Process Documentation (this manual)

**For Data Issues:**
- Don't manually edit database
- Contact Finance Manager
- IT will make corrections if valid

---

**Document Version:** 1.0
**Last Updated:** 2026-04-01
**Maintained By:** Finance Department
**For Questions:** finance@projectfinance.com

---

**Thank you for using Project Finance System!**
