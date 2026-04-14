// Mock Data Service - Fallback when database is unavailable
// This allows development to continue while database issues are resolved

// In-memory storage for CRUD operations
class MockDataStore {
  private accounts = [
    { id: 1, account_code: "1000", account_name: "Kas", account_type: "ASSET", description: "Kas di tangan dan kas kecil", created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 2, account_code: "1100", account_name: "Bank BCA", account_type: "ASSET", description: "Rekening giro Bank Central Asia", created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 3, account_code: "1200", account_name: "Piutang Usaha", account_type: "ASSET", description: "Piutang dari pelanggan atas penjualan kredit", created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 4, account_code: "1300", account_name: "Persediaan Barang", account_type: "ASSET", description: "Persediaan material dan barang jadi", created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 5, account_code: "1500", account_name: "Peralatan Kantor", account_type: "ASSET", description: "Peralatan dan perlengkapan kantor", created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 6, account_code: "2000", account_name: "Utang Usaha", account_type: "LIABILITY", description: "Utang kepada supplier atas pembelian kredit", created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 7, account_code: "2100", account_name: "Utang Pajak", account_type: "LIABILITY", description: "Utang PPh dan PPN yang belum dibayar", created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 8, account_code: "3000", account_name: "Modal Saham", account_type: "EQUITY", description: "Modal disetor pemegang saham", created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 9, account_code: "4000", account_name: "Pendapatan Jasa", account_type: "REVENUE", description: "Pendapatan dari jasa engineering dan konstruksi", created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 10, account_code: "5000", account_name: "Beban Gaji", account_type: "EXPENSE", description: "Beban gaji karyawan dan tunjangan", created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 11, account_code: "5100", account_name: "Beban Sewa", account_type: "EXPENSE", description: "Beban sewa kantor dan gudang", created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
    { id: 12, account_code: "5200", account_name: "Beban Listrik & Air", account_type: "EXPENSE", description: "Beban utilitas listrik dan air", created_at: new Date('2024-01-01'), updated_at: new Date('2024-01-01') },
  ];
  private nextAccountId = 13;

  // Invoices with detailed data
  private invoices = [
    {
      id: 1,
      invoice_number: "INV-2025-001",
      invoice_date: new Date('2025-01-15'),
      due_date: new Date('2025-02-15'),
      customer_name: "PT. Pertamina (Persero)",
      project_name: "Instalasi Pipeline Jakarta-Bogor",
      customer_po: "PO-PTM-2025-0015",
      subtotal: 500000000,
      discount: 0,
      tax_ppn: 55000000,
      tax_pph23: -10000000,
      total_amount: 545000000,
      paid_amount: 272500000,
      remaining_amount: 272500000,
      status: "PARTIALLY_PAID",
      payment_terms: "Net 30",
      notes: "Down Payment 50% sudah dibayar",
      created_at: new Date('2025-01-15'),
      updated_at: new Date('2025-01-20'),
      items: [
        { description: "Jasa Engineering & Desain", quantity: 1, unit_price: 150000000, total: 150000000 },
        { description: "Material Pipeline (100m)", quantity: 100, unit_price: 2500000, total: 250000000 },
        { description: "Instalasi & Commissioning", quantity: 1, unit_price: 100000000, total: 100000000 }
      ],
      payments: [
        { payment_date: new Date('2025-01-20'), amount: 272500000, method: "Transfer Bank", reference: "TRF-20250120-001" }
      ]
    },
    {
      id: 2,
      invoice_number: "INV-2025-002",
      invoice_date: new Date('2025-02-01'),
      due_date: new Date('2025-03-03'),
      customer_name: "PT. Unilever Indonesia",
      project_name: "Maintenance HVAC System Pabrik Cikarang",
      customer_po: "PO-UNI-2025-0087",
      subtotal: 85000000,
      discount: 2000000,
      tax_ppn: 9130000,
      tax_pph23: -1660000,
      total_amount: 90470000,
      paid_amount: 90470000,
      remaining_amount: 0,
      status: "PAID",
      payment_terms: "Net 30",
      notes: "Pembayaran lunas - proyek selesai",
      created_at: new Date('2025-02-01'),
      updated_at: new Date('2025-02-15'),
      items: [
        { description: "Maintenance Rutin HVAC", quantity: 1, unit_price: 45000000, total: 45000000 },
        { description: "Spare Parts & Material", quantity: 1, unit_price: 40000000, total: 40000000 }
      ],
      payments: [
        { payment_date: new Date('2025-02-15'), amount: 90470000, method: "Transfer Bank", reference: "TRF-20250215-003" }
      ]
    },
    {
      id: 3,
      invoice_number: "INV-2025-003",
      invoice_date: new Date('2025-02-10'),
      due_date: new Date('2025-03-12'),
      customer_name: "PT. Astra International",
      project_name: "Sistem Otomasi Gudang - Phase 1",
      customer_po: "PO-AST-2025-0123",
      subtotal: 750000000,
      discount: 0,
      tax_ppn: 82500000,
      tax_pph23: -15000000,
      total_amount: 817500000,
      paid_amount: 0,
      remaining_amount: 817500000,
      status: "SENT",
      payment_terms: "Net 30",
      notes: "Milestone 1: Design & Procurement - Menunggu pembayaran",
      created_at: new Date('2025-02-10'),
      updated_at: new Date('2025-02-10'),
      items: [
        { description: "System Design & Engineering", quantity: 1, unit_price: 200000000, total: 200000000 },
        { description: "Procurement Equipment", quantity: 1, unit_price: 400000000, total: 400000000 },
        { description: "Installation Services", quantity: 1, unit_price: 150000000, total: 150000000 }
      ],
      payments: []
    },
    {
      id: 4,
      invoice_number: "INV-2025-004",
      invoice_date: new Date('2025-01-05'),
      due_date: new Date('2025-02-04'),
      customer_name: "PT. Telkom Indonesia",
      project_name: "Network Infrastructure Upgrade",
      customer_po: "PO-TELKOM-2024-0998",
      subtotal: 320000000,
      discount: 0,
      tax_ppn: 35200000,
      tax_pph23: -6400000,
      total_amount: 348800000,
      paid_amount: 0,
      remaining_amount: 348800000,
      status: "OVERDUE",
      payment_terms: "Net 30",
      notes: "OVERDUE - Sudah lewat jatuh tempo 13 hari",
      created_at: new Date('2025-01-05'),
      updated_at: new Date('2025-02-17'),
      items: [
        { description: "Network Equipment", quantity: 1, unit_price: 200000000, total: 200000000 },
        { description: "Installation & Configuration", quantity: 1, unit_price: 120000000, total: 120000000 }
      ],
      payments: []
    },
    {
      id: 5,
      invoice_number: "INV-2025-005",
      invoice_date: new Date('2025-02-17'),
      due_date: new Date('2025-03-19'),
      customer_name: "PT. Pupuk Indonesia",
      project_name: "Conveyor Belt System Maintenance",
      customer_po: "PO-PI-2025-0056",
      subtotal: 125000000,
      discount: 5000000,
      tax_ppn: 13200000,
      tax_pph23: -2400000,
      total_amount: 130800000,
      paid_amount: 0,
      remaining_amount: 130800000,
      status: "DRAFT",
      payment_terms: "Net 30",
      notes: "Draft - Menunggu review finance",
      created_at: new Date('2025-02-17'),
      updated_at: new Date('2025-02-17'),
      items: [
        { description: "Maintenance Services", quantity: 1, unit_price: 75000000, total: 75000000 },
        { description: "Replacement Parts", quantity: 1, unit_price: 50000000, total: 50000000 }
      ],
      payments: []
    }
  ];
  private nextInvoiceId = 6;

  // Payables with 3-way matching data
  private payables = [
    {
      id: 1,
      vendor_invoice_number: "VINV-SUP-001",
      po_number: "PO-2025-015",
      vendor_name: "PT. Supplier Jaya Abadi",
      invoice_date: new Date('2025-02-01'),
      due_date: new Date('2025-03-03'),
      subtotal: 150000000,
      tax_ppn: 16500000,
      tax_pph23: 0,
      total_amount: 166500000,
      paid_amount: 0,
      status: "READY_TO_PAY",
      matching_status: "MATCHED",
      po_matched: true,
      gr_matched: true,
      payment_terms: "Net 30",
      notes: "3-way matching completed - siap dibayar",
      created_at: new Date('2025-02-01'),
      updated_at: new Date('2025-02-02'),
      items: [
        { description: "Steel Pipe 6inch (50pcs)", po_qty: 50, received_qty: 50, invoice_qty: 50, unit_price: 2000000, total: 100000000, matched: true },
        { description: "Valve Ball 4inch (25pcs)", po_qty: 25, received_qty: 25, invoice_qty: 25, unit_price: 2000000, total: 50000000, matched: true }
      ]
    },
    {
      id: 2,
      vendor_invoice_number: "VINV-MTR-089",
      po_number: "PO-2025-022",
      vendor_name: "CV. Material Teknik Resources",
      invoice_date: new Date('2025-02-10'),
      due_date: new Date('2025-02-24'),
      subtotal: 85000000,
      tax_ppn: 9350000,
      tax_pph23: 0,
      total_amount: 94350000,
      paid_amount: 94350000,
      status: "PAID",
      matching_status: "MATCHED",
      po_matched: true,
      gr_matched: true,
      payment_terms: "Net 14",
      notes: "Sudah dibayar",
      created_at: new Date('2025-02-10'),
      updated_at: new Date('2025-02-24'),
      items: [
        { description: "Electrical Cable 100m", po_qty: 100, received_qty: 100, invoice_qty: 100, unit_price: 450000, total: 45000000, matched: true },
        { description: "Junction Box (40pcs)", po_qty: 40, received_qty: 40, invoice_qty: 40, unit_price: 1000000, total: 40000000, matched: true }
      ],
      payments: [
        { payment_date: new Date('2025-02-24'), amount: 94350000, method: "Transfer Bank", bank_account: "BCA 1234567890" }
      ]
    },
    {
      id: 3,
      vendor_invoice_number: "INV-CNS-2025-045",
      po_number: "WO-2025-008",
      vendor_name: "PT. Konsultan Profesional Indonesia",
      invoice_date: new Date('2025-02-15'),
      due_date: new Date('2025-03-17'),
      subtotal: 50000000,
      tax_ppn: 5500000,
      tax_pph23: -1000000,
      total_amount: 54500000,
      paid_amount: 0,
      status: "DISPUTE",
      matching_status: "MISMATCH",
      po_matched: true,
      gr_matched: false,
      payment_terms: "Net 30",
      notes: "DISPUTE: Invoice amount tidak sesuai WO - selisih Rp 10jt",
      created_at: new Date('2025-02-15'),
      updated_at: new Date('2025-02-16'),
      items: [
        { description: "Consulting Services", po_qty: 1, received_qty: null, invoice_qty: 1, unit_price: 50000000, total: 50000000, matched: false }
      ]
    }
  ];
  private nextPayableId = 4;

  // Journal Entries
  private journalEntries = [
    {
      id: 1,
      transaction_date: new Date('2025-02-17'),
      description: "Pembayaran tagihan listrik PLN bulan Januari 2025",
      reference_type: "GENERAL_JOURNAL",
      reference_id: "GJ-2025-001",
      total_debit: 5500000,
      total_credit: 5500000,
      created_by: "Dewi Sartika",
      created_at: new Date('2025-02-17'),
      updated_at: new Date('2025-02-17'),
      entries: [
        { account_code: "5200", account_name: "Beban Listrik & Air", debit: 5500000, credit: 0 },
        { account_code: "1100", account_name: "Bank BCA", debit: 0, credit: 5500000 }
      ]
    },
    {
      id: 2,
      transaction_date: new Date('2025-02-16'),
      description: "Pembelian ATK dan galon air minum untuk kantor",
      reference_type: "GENERAL_JOURNAL",
      reference_id: "GJ-2025-002",
      total_debit: 1250000,
      total_credit: 1250000,
      created_by: "Dewi Sartika",
      created_at: new Date('2025-02-16'),
      updated_at: new Date('2025-02-16'),
      entries: [
        { account_code: "5100", account_name: "Beban Sewa", debit: 1250000, credit: 0 },
        { account_code: "1000", account_name: "Kas", debit: 0, credit: 1250000 }
      ]
    },
    {
      id: 3,
      transaction_date: new Date('2025-01-20'),
      description: "Pencatatan pembayaran invoice INV-2025-001 (Down Payment 50%)",
      reference_type: "INVOICE_PAYMENT",
      reference_id: "INV-2025-001",
      total_debit: 272500000,
      total_credit: 272500000,
      created_by: "System",
      created_at: new Date('2025-01-20'),
      updated_at: new Date('2025-01-20'),
      entries: [
        { account_code: "1100", account_name: "Bank BCA", debit: 272500000, credit: 0 },
        { account_code: "1200", account_name: "Piutang Usaha", debit: 0, credit: 272500000 }
      ]
    }
  ];
  private nextJournalId = 4;
  
  private nextAccountId = 13;

  // Chart of Accounts CRUD
  getAllAccounts() {
    return [...this.accounts];
  }

  getAccountById(id: number) {
    return this.accounts.find(acc => acc.id === id);
  }

  createAccount(data: any) {
    const newAccount = {
      id: this.nextAccountId++,
      account_code: data.account_code,
      account_name: data.account_name,
      account_type: data.account_type,
      description: data.description || null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.accounts.push(newAccount);
    console.log(`✅ Created account: ${newAccount.account_code} - ${newAccount.account_name}`);
    return newAccount;
  }

  updateAccount(id: number, data: any) {
    const index = this.accounts.findIndex(acc => acc.id === id);
    if (index === -1) return null;

    this.accounts[index] = {
      ...this.accounts[index],
      account_code: data.account_code ?? this.accounts[index].account_code,
      account_name: data.account_name ?? this.accounts[index].account_name,
      account_type: data.account_type ?? this.accounts[index].account_type,
      description: data.description ?? this.accounts[index].description,
      updated_at: new Date(),
    };

    console.log(`✅ Updated account ID ${id}`);
    return this.accounts[index];
  }

  deleteAccount(id: number) {
    const index = this.accounts.findIndex(acc => acc.id === id);
    if (index === -1) return false;

    const account = this.accounts[index];
    this.accounts.splice(index, 1);
    console.log(`✅ Deleted account: ${account.account_code} - ${account.account_name}`);
    return true;
  }

  // Invoices CRUD
  getAllInvoices() {
    return [...this.invoices];
  }

  getInvoiceById(id: number) {
    return this.invoices.find(inv => inv.id === id);
  }

  createInvoice(data: any) {
    const newInvoice = {
      id: this.nextInvoiceId++,
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.invoices.push(newInvoice);
    console.log(`✅ Created invoice: ${newInvoice.invoice_number}`);
    return newInvoice;
  }

  updateInvoice(id: number, data: any) {
    const index = this.invoices.findIndex(inv => inv.id === id);
    if (index === -1) return null;
    this.invoices[index] = { ...this.invoices[index], ...data, updated_at: new Date() };
    console.log(`✅ Updated invoice ID ${id}`);
    return this.invoices[index];
  }

  deleteInvoice(id: number) {
    const index = this.invoices.findIndex(inv => inv.id === id);
    if (index === -1) return false;
    this.invoices.splice(index, 1);
    console.log(`✅ Deleted invoice ID ${id}`);
    return true;
  }

  sendInvoice(invoiceId: number, sentBy?: string) {
    const invoice = this.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return null;

    if (invoice.status !== 'DRAFT') {
      throw new Error('Only DRAFT invoices can be sent');
    }

    invoice.status = 'SENT';
    invoice.updated_at = new Date();
    
    // Create automatic journal entry for invoice.sent
    const journalEntry = {
      id: this.nextJournalId++,
      transaction_date: new Date(),
      description: `Penjualan - Invoice ${invoice.invoice_number} (${invoice.customer_name})`,
      reference_type: 'INVOICE_SENT',
      reference_id: invoice.invoice_number,
      total_debit: invoice.total_amount,
      total_credit: invoice.total_amount,
      created_by: 'System Auto-Journal',
      created_at: new Date(),
      updated_at: new Date(),
      entries: [
        { account_code: '1200', account_name: 'Piutang Usaha', debit: invoice.total_amount, credit: 0 },
        { account_code: '4000', account_name: 'Pendapatan Jasa', debit: 0, credit: invoice.subtotal },
        { account_code: '2100', account_name: 'Utang Pajak (PPN)', debit: 0, credit: invoice.tax_ppn }
      ]
    };
    this.journalEntries.push(journalEntry);

    console.log(`✅ Invoice ${invoice.invoice_number} sent and journal entry created`);
    return { invoice, journal: journalEntry };
  }

  recordInvoicePayment(invoiceId: number, paymentData: any) {
    const invoice = this.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return null;

    if (!['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status)) {
      throw new Error('Can only record payment for SENT, PARTIALLY_PAID, or OVERDUE invoices');
    }

    if (paymentData.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    if (paymentData.amount > invoice.remaining_amount) {
      throw new Error(`Payment amount (Rp ${paymentData.amount}) exceeds remaining balance (Rp ${invoice.remaining_amount})`);
    }

    invoice.paid_amount += paymentData.amount;
    invoice.remaining_amount -= paymentData.amount;
    
    if (invoice.remaining_amount <= 0) {
      invoice.status = "PAID";
      invoice.remaining_amount = 0;
    } else {
      invoice.status = "PARTIALLY_PAID";
    }

    if (!invoice.payments) invoice.payments = [];
    invoice.payments.push({
      payment_date: paymentData.payment_date,
      amount: paymentData.amount,
      method: paymentData.method,
      reference: paymentData.reference || `PAY-${Date.now()}`
    });

    // Create automatic journal entry for payment.received
    const journalEntry = {
      id: this.nextJournalId++,
      transaction_date: new Date(paymentData.payment_date),
      description: `Penerimaan Pembayaran Invoice ${invoice.invoice_number} dari ${invoice.customer_name}`,
      reference_type: 'PAYMENT_RECEIVED',
      reference_id: invoice.invoice_number,
      total_debit: paymentData.amount,
      total_credit: paymentData.amount,
      created_by: 'System Auto-Journal',
      created_at: new Date(),
      updated_at: new Date(),
      entries: [
        { account_code: '1100', account_name: 'Bank BCA', debit: paymentData.amount, credit: 0 },
        { account_code: '1200', account_name: 'Piutang Usaha', debit: 0, credit: paymentData.amount }
      ]
    };
    this.journalEntries.push(journalEntry);

    invoice.updated_at = new Date();
    console.log(`✅ Recorded payment for invoice ${invoice.invoice_number}: Rp ${paymentData.amount.toLocaleString('id-ID')}`);
    return { invoice, journal: journalEntry };
  }

  // Payables CRUD
  getAllPayables() {
    return [...this.payables];
  }

  getPayableById(id: number) {
    return this.payables.find(pay => pay.id === id);
  }

  createPayable(data: any) {
    const newPayable = {
      id: this.nextPayableId++,
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.payables.push(newPayable);
    console.log(`✅ Created payable: ${newPayable.vendor_invoice_number}`);
    return newPayable;
  }

  updatePayable(id: number, data: any) {
    const index = this.payables.findIndex(pay => pay.id === id);
    if (index === -1) return null;
    this.payables[index] = { ...this.payables[index], ...data, updated_at: new Date() };
    console.log(`✅ Updated payable ID ${id}`);
    return this.payables[index];
  }

  deletePayable(id: number) {
    const index = this.payables.findIndex(pay => pay.id === id);
    if (index === -1) return false;
    this.payables.splice(index, 1);
    console.log(`✅ Deleted payable ID ${id}`);
    return true;
  }

  recordPayablePayment(payableId: number, paymentData: any) {
    const payable = this.payables.find(pay => pay.id === payableId);
    if (!payable) return null;

    payable.paid_amount = payable.total_amount;
    payable.status = "PAID";

    if (!payable.payments) payable.payments = [];
    payable.payments.push({
      payment_date: paymentData.payment_date,
      amount: paymentData.amount,
      method: paymentData.method,
      bank_account: paymentData.bank_account
    });

    payable.updated_at = new Date();
    console.log(`✅ Recorded payment for payable ${payable.vendor_invoice_number}: Rp ${paymentData.amount}`);
    return payable;
  }

  // Journal Entries CRUD
  getAllJournalEntries() {
    return [...this.journalEntries];
  }

  getJournalEntryById(id: number) {
    return this.journalEntries.find(je => je.id === id);
  }

  createJournalEntry(data: any) {
    const newJournal = {
      id: this.nextJournalId++,
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.journalEntries.push(newJournal);
    console.log(`✅ Created journal entry: ${newJournal.reference_id} - ${newJournal.description}`);
    return newJournal;
  }

  // Dashboard & Reports
  getARSummary() {
    const totalReceivable = this.invoices
      .filter(inv => inv.status !== 'PAID' && inv.status !== 'DRAFT')
      .reduce((sum, inv) => sum + inv.remaining_amount, 0);
    
    const overdue = this.invoices
      .filter(inv => inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + inv.remaining_amount, 0);

    const avgDSO = 35; // Days Sales Outstanding

    return { totalReceivable, overdue, avgDSO };
  }

  getAPSummary() {
    const totalPayable = this.payables
      .filter(pay => pay.status !== 'PAID')
      .reduce((sum, pay) => sum + pay.total_amount, 0);
    
    const dueThisWeek = this.payables
      .filter(pay => {
        const daysUntilDue = Math.ceil((pay.due_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return pay.status !== 'PAID' && daysUntilDue <= 7 && daysUntilDue >= 0;
      })
      .reduce((sum, pay) => sum + pay.total_amount, 0);

    return { totalPayable, dueThisWeek };
  }
}

export const mockDataStore = new MockDataStore();

// Export convenience methods
export const mockChartOfAccounts = mockDataStore.getAllAccounts();
export const mockInvoices = mockDataStore.getAllInvoices();
export const mockPayables = mockDataStore.getAllPayables();
export const mockJournalEntries = mockDataStore.getAllJournalEntries();

export const mockTaxRates = [
  { id: 1, tax_name: "PPN", tax_code: "PPN", rate: 11.00, description: "Pajak Pertambahan Nilai", is_active: true, created_at: new Date(), updated_at: new Date() },
  { id: 2, tax_name: "PPh 21", tax_code: "PPH21", rate: 5.00, description: "Pajak Penghasilan Pasal 21", is_active: true, created_at: new Date(), updated_at: new Date() },
  { id: 3, tax_name: "PPh 23", tax_code: "PPH23", rate: 2.00, description: "Pajak Penghasilan Pasal 23", is_active: true, created_at: new Date(), updated_at: new Date() },
  { id: 4, tax_name: "PPh 4(2)", tax_code: "PPH4_2", rate: 10.00, description: "Pajak Penghasilan Final", is_active: true, created_at: new Date(), updated_at: new Date() }
];

export const mockExchangeRates = [
  { id: 1, currency_from: "USD", currency_to: "IDR", rate: 15750.00, effective_date: new Date(), is_active: true, created_at: new Date(), updated_at: new Date() },
  { id: 2, currency_from: "EUR", currency_to: "IDR", rate: 17250.00, effective_date: new Date(), is_active: true, created_at: new Date(), updated_at: new Date() },
  { id: 3, currency_from: "SGD", currency_to: "IDR", rate: 11650.00, effective_date: new Date(), is_active: true, created_at: new Date(), updated_at: new Date() },
  { id: 4, currency_from: "JPY", currency_to: "IDR", rate: 105.50, effective_date: new Date(), is_active: true, created_at: new Date(), updated_at: new Date() }
];

export const mockDashboardData = {
  cash_flow: [
    { period: "Jan", inflow: 150000000, outflow: 120000000, net: 30000000 },
    { period: "Feb", inflow: 180000000, outflow: 145000000, net: 35000000 },
    { period: "Mar", inflow: 165000000, outflow: 130000000, net: 35000000 }
  ],
  profitability: [
    { period: "Jan", revenue: 150000000, expenses: 120000000, net_income: 30000000 },
    { period: "Feb", revenue: 180000000, expenses: 145000000, net_income: 35000000 },
    { period: "Mar", revenue: 165000000, expenses: 130000000, net_income: 35000000 }
  ],
  ar_ap_summary: mockDataStore.getARSummary()
};
