// services/finance-service/src/utils/demo-data-generator.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate comprehensive demo data for client presentation
 */
export async function generateDemoData() {
  console.log('🎨 Generating demo data for presentation...');

  try {
    // 1. Create demo customers
    const customers = await createDemoCustomers();
    console.log(`✅ Created ${customers.length} demo customers`);

    // 2. Create demo vendors
    const vendors = await createDemoVendors();
    console.log(`✅ Created ${vendors.length} demo vendors`);

    // 3. Create realistic chart of accounts
    const coa = await createDemoChartOfAccounts();
    console.log(`✅ Created ${coa.length} chart of accounts`);

    // 4. Create demo invoices with realistic data
    const invoices = await createDemoInvoices(customers, coa);
    console.log(`✅ Created ${invoices.length} demo invoices`);

    // 5. Create demo payments
    const payments = await createDemoPayments(invoices);
    console.log(`✅ Created ${payments.length} demo payments`);

    // 6. Create demo journal entries
    const journalEntries = await createDemoJournalEntries(coa);
    console.log(`✅ Created ${journalEntries.length} demo journal entries`);

    // 7. Create demo bank accounts
    const bankAccounts = await createDemoBankAccounts();
    console.log(`✅ Created ${bankAccounts.length} demo bank accounts`);

    // 8. Create demo exchange rates
    const exchangeRates = await createDemoExchangeRates();
    console.log(`✅ Created ${exchangeRates.length} demo exchange rates`);

    // 9. Create demo tax codes
    const taxCodes = await createDemoTaxCodes();
    console.log(`✅ Created ${taxCodes.length} demo tax codes`);

    console.log('🎉 Demo data generation completed successfully!');

    return {
      customers: customers.length,
      vendors: vendors.length,
      coa: coa.length,
      invoices: invoices.length,
      payments: payments.length,
      journalEntries: journalEntries.length,
      bankAccounts: bankAccounts.length,
      exchangeRates: exchangeRates.length,
      taxCodes: taxCodes.length,
    };
  } catch (error) {
    console.error('❌ Error generating demo data:', error);
    throw error;
  }
}

// Demo Customers
async function createDemoCustomers() {
  const customersData = [
    {
      name: 'PT Teknologi Maju',
      email: 'finance@teknologimaju.com',
      phone: '+62 21 1234 5678',
      address: 'Jl. Sudirman No. 123, Jakarta Pusat',
      tax_id: '01.234.567.8-901.000',
      status: 'ACTIVE' as const,
    },
    {
      name: 'CV Cahaya Sejahtera',
      email: 'admin@cahayasejahtera.co.id',
      phone: '+62 31 9876 5432',
      address: 'Jl. Raya Darmo No. 45, Surabaya',
      tax_id: '02.345.678.9-012.000',
      status: 'ACTIVE' as const,
    },
    {
      name: 'PT Sumber Rezeki',
      email: 'info@sumberrezeki.com',
      phone: '+62 22 5555 6666',
      address: 'Jl. Asia Afrika No. 789, Bandung',
      tax_id: '03.456.789.0-123.000',
      status: 'ACTIVE' as const,
    },
    {
      name: 'Toko Berkah Jaya',
      email: 'toko@berkahjaya.com',
      phone: '+62 274 777 8888',
      address: 'Jl. Malioboro No. 56, Yogyakarta',
      tax_id: '04.567.890.1-234.000',
      status: 'ACTIVE' as const,
    },
    {
      name: 'PT Global Trading Indonesia',
      email: 'sales@globaltrading.co.id',
      phone: '+62 21 9999 0000',
      address: 'Jl. Gatot Subroto No. 321, Jakarta Selatan',
      tax_id: '05.678.901.2-345.000',
      status: 'ACTIVE' as const,
    },
  ];

  const customers = [];
  for (const data of customersData) {
    const existing = await prisma.customer.findFirst({
      where: { email: data.email },
    });

    if (!existing) {
      const customer = await prisma.customer.create({ data });
      customers.push(customer);
    }
  }

  return customers;
}

// Demo Vendors
async function createDemoVendors() {
  const vendorsData = [
    {
      name: 'PT Supplier Utama',
      email: 'vendor@supplierutama.com',
      phone: '+62 21 1111 2222',
      address: 'Jl. MT Haryono No. 111, Jakarta Timur',
      tax_id: '11.111.222.3-444.000',
      status: 'ACTIVE' as const,
    },
    {
      name: 'CV Bahan Bangunan Jaya',
      email: 'info@bahanbangunan.co.id',
      phone: '+62 31 3333 4444',
      address: 'Jl. Wonokromo No. 55, Surabaya',
      tax_id: '22.222.333.4-555.000',
      status: 'ACTIVE' as const,
    },
    {
      name: 'PT Logistik Express',
      email: 'ops@logistikexpress.com',
      phone: '+62 21 5555 6666',
      address: 'Jl. Cakung No. 99, Jakarta Timur',
      tax_id: '33.333.444.5-666.000',
      status: 'ACTIVE' as const,
    },
  ];

  const vendors = [];
  for (const data of vendorsData) {
    const existing = await prisma.vendor.findFirst({
      where: { email: data.email },
    });

    if (!existing) {
      const vendor = await prisma.vendor.create({ data });
      vendors.push(vendor);
    }
  }

  return vendors;
}

// Demo Chart of Accounts
async function createDemoChartOfAccounts() {
  const coaData = [
    // Assets
    { code: '1100', name: 'Cash on Hand', type: 'ASSET', category: 'CURRENT_ASSET' },
    { code: '1110', name: 'Bank BCA', type: 'ASSET', category: 'CURRENT_ASSET' },
    { code: '1120', name: 'Bank Mandiri', type: 'ASSET', category: 'CURRENT_ASSET' },
    { code: '1200', name: 'Accounts Receivable', type: 'ASSET', category: 'CURRENT_ASSET' },
    { code: '1300', name: 'Inventory', type: 'ASSET', category: 'CURRENT_ASSET' },
    { code: '1400', name: 'Prepaid Expenses', type: 'ASSET', category: 'CURRENT_ASSET' },
    { code: '1500', name: 'Fixed Assets - Equipment', type: 'ASSET', category: 'FIXED_ASSET' },
    { code: '1510', name: 'Fixed Assets - Vehicles', type: 'ASSET', category: 'FIXED_ASSET' },
    { code: '1520', name: 'Fixed Assets - Building', type: 'ASSET', category: 'FIXED_ASSET' },
    { code: '1600', name: 'Accumulated Depreciation', type: 'ASSET', category: 'FIXED_ASSET' },

    // Liabilities
    { code: '2100', name: 'Accounts Payable', type: 'LIABILITY', category: 'CURRENT_LIABILITY' },
    { code: '2200', name: 'Accrued Expenses', type: 'LIABILITY', category: 'CURRENT_LIABILITY' },
    { code: '2300', name: 'Short-term Loan', type: 'LIABILITY', category: 'CURRENT_LIABILITY' },
    { code: '2400', name: 'Tax Payable - VAT', type: 'LIABILITY', category: 'CURRENT_LIABILITY' },
    { code: '2410', name: 'Tax Payable - Income Tax', type: 'LIABILITY', category: 'CURRENT_LIABILITY' },
    { code: '2500', name: 'Long-term Loan', type: 'LIABILITY', category: 'LONG_TERM_LIABILITY' },

    // Equity
    { code: '3100', name: 'Owner Equity', type: 'EQUITY', category: 'EQUITY' },
    { code: '3200', name: 'Retained Earnings', type: 'EQUITY', category: 'EQUITY' },
    { code: '3300', name: 'Current Year Earnings', type: 'EQUITY', category: 'EQUITY' },

    // Revenue
    { code: '4100', name: 'Sales Revenue', type: 'REVENUE', category: 'OPERATING_REVENUE' },
    { code: '4200', name: 'Service Revenue', type: 'REVENUE', category: 'OPERATING_REVENUE' },
    { code: '4300', name: 'Other Revenue', type: 'REVENUE', category: 'NON_OPERATING_REVENUE' },
    { code: '4400', name: 'Interest Income', type: 'REVENUE', category: 'NON_OPERATING_REVENUE' },

    // Expenses
    { code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE', category: 'COST_OF_SALES' },
    { code: '5200', name: 'Salaries & Wages', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '5300', name: 'Rent Expense', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '5400', name: 'Utilities Expense', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '5500', name: 'Marketing & Advertising', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '5600', name: 'Office Supplies', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '5700', name: 'Transportation', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '5800', name: 'Depreciation Expense', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '5900', name: 'Interest Expense', type: 'EXPENSE', category: 'FINANCIAL_EXPENSE' },
    { code: '6000', name: 'Other Expenses', type: 'EXPENSE', category: 'OTHER_EXPENSE' },
  ];

  const accounts = [];
  for (const data of coaData) {
    const existing = await prisma.chart_of_accounts.findFirst({
      where: { code: data.code },
    });

    if (!existing) {
      const account = await prisma.chart_of_accounts.create({
        data: {
          ...data,
          is_active: true,
        },
      });
      accounts.push(account);
    }
  }

  return accounts;
}

// Demo Invoices
async function createDemoInvoices(customers: any[], coa: any[]) {
  if (customers.length === 0) return [];

  const invoices = [];
  const today = new Date();

  // Create 5 invoices with different statuses
  const invoiceData = [
    {
      customer_id: customers[0].id,
      invoice_number: 'INV-2024-001',
      invoice_date: new Date(today.getFullYear(), today.getMonth() - 1, 15),
      due_date: new Date(today.getFullYear(), today.getMonth() - 1, 30),
      status: 'PAID' as const,
      subtotal: 25000000,
      tax_amount: 2500000,
      discount_amount: 0,
      total_amount: 27500000,
      paid_amount: 27500000,
      balance: 0,
      notes: 'Pembayaran konsultasi IT bulan November',
    },
    {
      customer_id: customers[1].id,
      invoice_number: 'INV-2024-002',
      invoice_date: new Date(today.getFullYear(), today.getMonth(), 5),
      due_date: new Date(today.getFullYear(), today.getMonth(), 20),
      status: 'PARTIALLY_PAID' as const,
      subtotal: 35000000,
      tax_amount: 3500000,
      discount_amount: 500000,
      total_amount: 38000000,
      paid_amount: 20000000,
      balance: 18000000,
      notes: 'Pembelian software development - DP 50%',
    },
    {
      customer_id: customers[2].id,
      invoice_number: 'INV-2024-003',
      invoice_date: new Date(today.getFullYear(), today.getMonth(), 10),
      due_date: new Date(today.getFullYear(), today.getMonth() + 1, 10),
      status: 'PENDING' as const,
      subtotal: 15000000,
      tax_amount: 1500000,
      discount_amount: 0,
      total_amount: 16500000,
      paid_amount: 0,
      balance: 16500000,
      notes: 'Jasa maintenance sistem bulan Desember',
    },
    {
      customer_id: customers[3].id,
      invoice_number: 'INV-2024-004',
      invoice_date: new Date(today.getFullYear(), today.getMonth(), 15),
      due_date: new Date(today.getFullYear(), today.getMonth(), 30),
      status: 'PENDING' as const,
      subtotal: 45000000,
      tax_amount: 4500000,
      discount_amount: 1000000,
      total_amount: 48500000,
      paid_amount: 0,
      balance: 48500000,
      notes: 'Project implementation ERP system',
    },
    {
      customer_id: customers[4].id,
      invoice_number: 'INV-2024-005',
      invoice_date: new Date(today.getFullYear(), today.getMonth() - 2, 20),
      due_date: new Date(today.getFullYear(), today.getMonth() - 1, 20),
      status: 'OVERDUE' as const,
      subtotal: 12000000,
      tax_amount: 1200000,
      discount_amount: 0,
      total_amount: 13200000,
      paid_amount: 0,
      balance: 13200000,
      notes: 'Training & workshop - OVERDUE 30 days',
    },
  ];

  for (const data of invoiceData) {
    const existing = await prisma.invoice.findFirst({
      where: { invoice_number: data.invoice_number },
    });

    if (!existing) {
      const invoice = await prisma.invoice.create({ data });
      invoices.push(invoice);
    }
  }

  return invoices;
}

// Demo Payments
async function createDemoPayments(invoices: any[]) {
  if (invoices.length === 0) return [];

  const payments = [];
  const paidInvoice = invoices.find((inv) => inv.status === 'PAID');
  const partialInvoice = invoices.find((inv) => inv.status === 'PARTIALLY_PAID');

  if (paidInvoice) {
    const payment = await prisma.payment.create({
      data: {
        invoice_id: paidInvoice.id,
        payment_date: new Date(paidInvoice.due_date.getTime() - 5 * 24 * 60 * 60 * 1000),
        amount: paidInvoice.total_amount,
        payment_method: 'BANK_TRANSFER',
        reference_number: 'TRF-001',
        notes: 'Pembayaran lunas via transfer BCA',
      },
    });
    payments.push(payment);
  }

  if (partialInvoice) {
    const payment = await prisma.payment.create({
      data: {
        invoice_id: partialInvoice.id,
        payment_date: new Date(),
        amount: 20000000,
        payment_method: 'BANK_TRANSFER',
        reference_number: 'TRF-002',
        notes: 'Pembayaran DP 50%',
      },
    });
    payments.push(payment);
  }

  return payments;
}

// Demo Journal Entries
async function createDemoJournalEntries(coa: any[]) {
  if (coa.length === 0) return [];

  const cashAccount = coa.find((a) => a.code === '1110');
  const revenueAccount = coa.find((a) => a.code === '4100');
  const expenseAccount = coa.find((a) => a.code === '5200');
  const apAccount = coa.find((a) => a.code === '2100');

  if (!cashAccount || !revenueAccount || !expenseAccount || !apAccount) return [];

  const journalEntries = [];

  // Entry 1: Sales Revenue
  const entry1 = await prisma.journal_entry.create({
    data: {
      entry_number: 'JE-2024-001',
      entry_date: new Date(),
      description: 'Record sales revenue for December',
      total_debit: 27500000,
      total_credit: 27500000,
      status: 'POSTED',
      lines: {
        create: [
          {
            account_id: cashAccount.id,
            debit: 27500000,
            credit: 0,
            description: 'Cash received from customer',
          },
          {
            account_id: revenueAccount.id,
            debit: 0,
            credit: 27500000,
            description: 'Sales revenue',
          },
        ],
      },
    },
  });
  journalEntries.push(entry1);

  // Entry 2: Salary Expense
  const entry2 = await prisma.journal_entry.create({
    data: {
      entry_number: 'JE-2024-002',
      entry_date: new Date(),
      description: 'Record salary payment',
      total_debit: 15000000,
      total_credit: 15000000,
      status: 'POSTED',
      lines: {
        create: [
          {
            account_id: expenseAccount.id,
            debit: 15000000,
            credit: 0,
            description: 'Salary expense',
          },
          {
            account_id: cashAccount.id,
            debit: 0,
            credit: 15000000,
            description: 'Cash payment',
          },
        ],
      },
    },
  });
  journalEntries.push(entry2);

  return journalEntries;
}

// Demo Bank Accounts
async function createDemoBankAccounts() {
  const bankAccountsData = [
    {
      bank_name: 'Bank Central Asia (BCA)',
      account_number: '1234567890',
      account_name: 'PT Project Finance',
      currency: 'IDR',
      balance: 150000000,
      is_active: true,
    },
    {
      bank_name: 'Bank Mandiri',
      account_number: '0987654321',
      account_name: 'PT Project Finance',
      currency: 'IDR',
      balance: 85000000,
      is_active: true,
    },
    {
      bank_name: 'Bank BNI',
      account_number: '5555666677',
      account_name: 'PT Project Finance',
      currency: 'USD',
      balance: 12500,
      is_active: true,
    },
  ];

  const bankAccounts = [];
  for (const data of bankAccountsData) {
    const existing = await prisma.bank_account.findFirst({
      where: { account_number: data.account_number },
    });

    if (!existing) {
      const account = await prisma.bank_account.create({ data });
      bankAccounts.push(account);
    }
  }

  return bankAccounts;
}

// Demo Exchange Rates
async function createDemoExchangeRates() {
  const today = new Date();
  const ratesData = [
    {
      from_currency: 'USD',
      to_currency: 'IDR',
      rate: 15750,
      effective_date: today,
    },
    {
      from_currency: 'EUR',
      to_currency: 'IDR',
      rate: 17250,
      effective_date: today,
    },
    {
      from_currency: 'SGD',
      to_currency: 'IDR',
      rate: 11500,
      effective_date: today,
    },
  ];

  const rates = [];
  for (const data of ratesData) {
    const rate = await prisma.exchange_rate.upsert({
      where: {
        from_currency_to_currency_effective_date: {
          from_currency: data.from_currency,
          to_currency: data.to_currency,
          effective_date: data.effective_date,
        },
      },
      update: {},
      create: data,
    });
    rates.push(rate);
  }

  return rates;
}

// Demo Tax Codes
async function createDemoTaxCodes() {
  const taxCodesData = [
    {
      code: 'PPN',
      name: 'PPN 11%',
      rate: 11.0,
      type: 'SALES',
      is_active: true,
    },
    {
      code: 'PPH23',
      name: 'PPh Pasal 23 - 2%',
      rate: 2.0,
      type: 'WITHHOLDING',
      is_active: true,
    },
    {
      code: 'PPH21',
      name: 'PPh Pasal 21',
      rate: 5.0,
      type: 'WITHHOLDING',
      is_active: true,
    },
  ];

  const taxCodes = [];
  for (const data of taxCodesData) {
    const existing = await prisma.tax_code.findFirst({
      where: { code: data.code },
    });

    if (!existing) {
      const taxCode = await prisma.tax_code.create({ data });
      taxCodes.push(taxCode);
    }
  }

  return taxCodes;
}

// Export for use in seed script
export default generateDemoData;
