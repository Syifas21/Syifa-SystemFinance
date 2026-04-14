// Seed users and initial data for finance system
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding users and test data...');

  // Hash passwords
  const ceoPassword = await bcrypt.hash('ceo123', 10);
  const financePassword = await bcrypt.hash('finance123', 10);

  // Create CEO user
  const ceo = await prisma.users.upsert({
    where: { email: 'ceo@projectfinance.com' },
    update: {
      password_hash: ceoPassword,
    },
    create: {
      id: uuidv4(),
      email: 'ceo@projectfinance.com',
      password_hash: ceoPassword,
      full_name: 'CEO User',
      role: 'CEO',
      is_active: true,
    },
  });

  // Create Finance Admin user
  const financeAdmin = await prisma.users.upsert({
    where: { email: 'finance@projectfinance.com' },
    update: {
      password_hash: financePassword,
    },
    create: {
      id: uuidv4(),
      email: 'finance@projectfinance.com',
      password_hash: financePassword,
      full_name: 'Finance Admin',
      role: 'FINANCE_ADMIN',
      is_active: true,
    },
  });

  console.log('✅ Users created:');
  console.log('   📧 CEO: ceo@projectfinance.com / ceo123');
  console.log('   📧 Finance Admin: finance@projectfinance.com / finance123');

  // Seed test invoices for AR aging report testing
  console.log('\n🌱 Seeding test invoices for aging report...');
  
  const today = new Date();
  const invoiceData = [
    // Current invoices (not yet due)
    {
      due_date: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days in future
      status: 'SENT',
      total_amount: 250000000,
      customer_name: 'PT Maju Jaya',
    },
    {
      due_date: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days in future
      status: 'SENT',
      total_amount: 150000000,
      customer_name: 'CV Sukses Bersama',
    },
    // 1-30 Days overdue
    {
      due_date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      status: 'SENT',
      total_amount: 100000000,
      customer_name: 'PT Angin Kencang',
    },
    {
      due_date: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      status: 'SENT',
      total_amount: 75000000,
      customer_name: 'CV Tangguh Sentosa',
    },
    // 31-60 Days overdue
    {
      due_date: new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
      status: 'SENT',
      total_amount: 200000000,
      customer_name: 'PT Cahaya Teknologi',
    },
    {
      due_date: new Date(today.getTime() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
      status: 'OVERDUE',
      total_amount: 125000000,
      customer_name: 'CV Warna-Warni',
    },
    // 61-90 Days overdue
    {
      due_date: new Date(today.getTime() - 75 * 24 * 60 * 60 * 1000), // 75 days ago
      status: 'OVERDUE',
      total_amount: 300000000,
      customer_name: 'PT Gemilang Abadi',
    },
    // 90+ Days overdue
    {
      due_date: new Date(today.getTime() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
      status: 'OVERDUE',
      total_amount: 450000000,
      customer_name: 'CV Terpercaya Sejati',
    },
    {
      due_date: new Date(today.getTime() - 150 * 24 * 60 * 60 * 1000), // 150 days ago
      status: 'SENT',
      total_amount: 200000000,
      customer_name: 'PT Inovasi Masa Depan',
    },
    // Paid invoice (should be excluded from aging report)
    {
      due_date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      status: 'PAID',
      total_amount: 500000000,
      customer_name: 'PT Pembayar Terpercaya',
    },
  ];

  const createdInvoices = [];
  for (const data of invoiceData) {
    const invoice = await prisma.invoices.upsert({
      where: { invoice_number: `INV-TEST-${data.customer_name.replace(/\s+/g, '-')}-${Date.now()}` },
      update: {},
      create: {
        id: uuidv4(),
        invoice_number: `INV-TEST-${data.customer_name.replace(/\s+/g, '-')}-${Date.now()}`,
        invoice_date: new Date(data.due_date.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before due date
        due_date: data.due_date,
        customer_id: uuidv4(),
        customer_name: data.customer_name,
        customer_address: 'Jakarta, Indonesia',
        customer_phone: '+62-812-3456-7890',
        customer_email: 'contact@customer.com',
        subtotal: data.total_amount,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: data.total_amount,
        currency: 'IDR',
        status: data.status as any,
        notes: `Test invoice for aging report - ${data.status}`,
        payment_terms: 'NET 30',
        created_by: 'seed',
        updated_by: 'seed',
      },
    });
    createdInvoices.push(invoice);
  }

  console.log(`✅ Created ${createdInvoices.length} test invoices:`);
  console.log('   - 2x Current (not yet due)');
  console.log('   - 2x 1-30 Days overdue');
  console.log('   - 2x 31-60 Days overdue');
  console.log('   - 1x 61-90 Days overdue');
  console.log('   - 2x 90+ Days overdue');
  console.log('   - 1x PAID (excluded from aging)');

  console.log('\n✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
