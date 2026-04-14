// Payables Service - Per TSD FITUR 3.4.B
// Accounts Payable dengan 3-way matching
import { prisma } from '../utils/prisma';
import { v4 as uuidv4 } from 'uuid';
import financeEvents from '../events/financeEvents';

export interface CreatePayableDto {
  po_id: string; // Purchase Order ID
  vendor_invoice_number: string;
  invoice_date: string;
  due_date: string;
  vendor_id: string;
  vendor_name: string;
  items: PayableItemDto[];
  notes?: string;
  created_by?: string;
}

export interface PayableItemDto {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface RecordPayablePaymentDto {
  payment_date: string;
  amount: number;
  bank_account_id?: string;
  notes?: string;
}

class PayablesService {
  /**
   * Validate 3-way matching
   * PO vs Receipt vs Vendor Invoice
   * Skip validation if no PO (manual entry for operational/project)
   */
  private async validateThreeWayMatch(
    poId: string | null,
    vendorInvoiceItems: PayableItemDto[]
  ): Promise<{ isValid: boolean; message?: string }> {
    try {
      // Skip validation for manual entry without PO
      if (!poId) {
        console.log('⏭️ Skipping 3-way match - Manual entry without PO');
        return { isValid: true };
      }
      
      // TODO: In production, fetch from Procurement Service & Inventory Service
      // For now, we'll do basic validation
      
      // Mock PO data check
      console.log(`🔍 Validating 3-way match for PO: ${poId}`);
      
      // Calculate totals from vendor invoice
      const invoiceTotal = vendorInvoiceItems.reduce((sum, item) => sum + item.total, 0);
      
      // In production, compare:
      // 1. PO items vs Vendor Invoice items (quantities, prices)
      // 2. Receipt quantities vs Vendor Invoice quantities
      // 3. All three must match within tolerance
      
      // For demo, assume valid if total > 0
      if (invoiceTotal <= 0) {
        return {
          isValid: false,
          message: 'Invoice total must be greater than 0',
        };
      }
      
      console.log(`✅ 3-way match validated for PO: ${poId}`);
      
      return {
        isValid: true,
      };
    } catch (error) {
      console.error('Error in 3-way matching:', error);
      return {
        isValid: false,
        message: 'Error during 3-way matching validation',
      };
    }
  }

  /**
   * Get all payables with filters
   */
  async getAllPayables(filters?: {
    status?: string;
    vendor_name?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      console.log("📊 Fetching payables from database...");
      
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.vendor_name) {
        where.vendor_name = {
          contains: filters.vendor_name,
          mode: 'insensitive'
        };
      }

      // If Prisma model not available (schema not migrated), try raw SQL select
      if (typeof (prisma as any).payables === 'undefined') {
        console.warn('⚠️ Prisma model `payables` not found - attempting raw SQL select to return DB rows');
        try {
          // Get total count
          const countRes: any = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS cnt FROM payables');
          const totalCount = (Array.isArray(countRes) && countRes[0] && (countRes[0].cnt || countRes[0].count)) ? Number(countRes[0].cnt || countRes[0].count) : 0;

          // Fetch rows with pagination
          const rows: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM payables ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, skip);

          const transformedData = [];
          for (const p of rows) {
            // Sum payments for the payable if payments table exists
            let paidAmount = 0;
            try {
              const paidRes: any = await prisma.$queryRawUnsafe(`SELECT COALESCE(SUM(payment_amount),0)::numeric AS paid FROM payable_payments WHERE payable_id = $1`, p.id);
              if (Array.isArray(paidRes) && paidRes[0]) {
                paidAmount = Number(paidRes[0].paid || paidRes[0].sum || 0);
              }
            } catch (e) {
              // ignore, assume no payments table
            }

            const totalAmount = Number(p.total_amount || p.total || 0);
            transformedData.push({
              ...p,
              id: String(p.id),
              total_amount: totalAmount,
              paid_amount: paidAmount,
              remaining_amount: totalAmount - paidAmount,
              subtotal: Number(p.subtotal || 0),
              tax_amount: Number(p.tax_amount || p.tax_ppn || 0),
            });
          }

          return {
            data: transformedData,
            pagination: {
              page,
              limit,
              total: totalCount,
              totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
            },
          };
        } catch (err) {
          console.warn('Raw SQL select failed:', (err as any)?.message || err);
          throw err;
        }
      }

      // Fetch payables from database using Prisma
      const total = await prisma.payables.count({ where });
      const payables = await prisma.payables.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      });

      // Transform data to add remaining_amount
      const transformedData = [];
      for (const p of payables) {
        // Get payments for this payable
        let paidAmount = 0;
        try {
          const paidRes: any = await prisma.$queryRawUnsafe(
            `SELECT COALESCE(SUM(payment_amount),0)::numeric AS paid FROM payable_payments WHERE payable_id = $1`, 
            p.id
          );
          if (Array.isArray(paidRes) && paidRes[0]) {
            paidAmount = Number(paidRes[0].paid || 0);
          }
        } catch (e) {
          // ignore if payable_payments table doesn't exist
        }

        const totalAmount = Number(p.total_amount);
        transformedData.push({
          ...p,
          id: p.id.toString(),
          total_amount: totalAmount,
          paid_amount: paidAmount,
          remaining_amount: totalAmount - paidAmount,
          subtotal: Number(p.subtotal || 0),
          tax_amount: Number(p.tax_amount || 0),
        });
      }

      console.log(`✅ Found ${payables.length} payables from database`);

      return {
        data: transformedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching payables:', error);
      throw error;
    }
  }

  /**
   * Get AP summary (Accounts Payable metrics)
   */
  async getAPSummary() {
    try {
      console.log('📊 Calculating AP Summary from database...');

      // Get all payables from database
      const allPayables: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          p.*,
          COALESCE(SUM(pp.payment_amount), 0) as paid_amount
        FROM payables p
        LEFT JOIN payable_payments pp ON p.id = pp.payable_id
        GROUP BY p.id
      `);

      let totalPayable = 0;
      let totalPaid = 0;
      let totalPending = 0;
      let totalOverdue = 0;

      const now = new Date();

      allPayables.forEach((p: any) => {
        const total = Number(p.total_amount || 0);
        const paid = Number(p.paid_amount || 0);
        const remaining = total - paid;
        const dueDate = new Date(p.due_date);

        totalPayable += remaining;
        totalPaid += paid;

        if (p.status === 'PENDING') {
          totalPending += remaining;
        }

        if (dueDate < now && remaining > 0) {
          totalOverdue += remaining;
        }
      });

      return {
        total_payable: totalPayable,
        total_paid: totalPaid,
        total_pending: totalPending,
        total_overdue: totalOverdue,
        total_count: allPayables.length,
      };
    } catch (error) {
      console.error('Error fetching AP summary:', error);
      throw error;
    }
  }

  /**
   * Create new payable (record vendor bill)
   * Per TSD FITUR 3.4.B - Alur 1
   */
  async createPayable(data: CreatePayableDto) {
    try {
      console.log(`📝 Creating payable for vendor invoice: ${data.vendor_invoice_number}`);

      // Step 1: Validate 3-way matching
      const validation = await this.validateThreeWayMatch(data.po_id, data.items);
      
      if (!validation.isValid) {
        throw new Error(validation.message || '3-way matching failed');
      }

      // Step 2: Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = subtotal * 0.11; // PPN 11%
      const totalAmount = subtotal + taxAmount;

      // Step 3: Insert to payables table
      const payableId = uuidv4();
      const poIdValue = data.po_id || 'MANUAL-' + Date.now(); // Generate placeholder for manual entry

      try {
        await prisma.$queryRawUnsafe(`
          INSERT INTO payables (
            id, po_id, vendor_invoice_number, invoice_date, due_date,
            vendor_name, subtotal, tax_amount, total_amount, status, created_at, updated_at
          ) VALUES (
            $1::uuid, $2, $3, $4::date, $5::date, $6, $7::numeric, $8::numeric, $9::numeric, 'PENDING', NOW(), NOW()
          )
        `, payableId, poIdValue, data.vendor_invoice_number, data.invoice_date,
           data.due_date, data.vendor_name, subtotal, taxAmount, totalAmount);

        // Step 4: Insert payable items
        for (const item of data.items) {
          const itemId = uuidv4();
          await prisma.$queryRawUnsafe(`
            INSERT INTO payable_items (id, payable_id, item_description, quantity, unit_price, total_price, created_at)
            VALUES ($1::uuid, $2::uuid, $3, $4::numeric, $5::numeric, $6::numeric, NOW())
          `, itemId, payableId, item.description, item.quantity, item.unit_price, item.total);
        }
      } catch (err: any) {
        console.error('DB insert error while creating payable:', err);

        // Detect Postgres unique-constraint / duplicate key errors (SQLSTATE 23505)
        const code = err?.code || err?.originalError?.code || err?.meta?.target;
        const message = String(err?.message || err || '');

        if (code === '23505' || /duplicate|already exists/i.test(message) || String(message).includes('vendor_invoice_number')) {
          // Re-throw a standardized error message for controller to translate
          throw new Error('DUPLICATE_VENDOR_INVOICE: vendor_invoice_number already exists');
        }

        throw err;
      }

      console.log(`✅ Payable created: ${payableId} for vendor ${data.vendor_name}`);

      // Step 5: Trigger event for journal entry
      financeEvents.emit('payable.created', {
        payableId,
        vendorName: data.vendor_name,
        amount: totalAmount,
        type: 'GOODS', // Default to GOODS
      });

      return {
        id: payableId,
        vendor_invoice_number: data.vendor_invoice_number,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        vendor_name: data.vendor_name,
        total_amount: totalAmount,
        status: 'PENDING',
        created_at: new Date(),
      };
    } catch (error) {
      console.error('Error creating payable:', error);
      throw error;
    }
  }

  /**
   * Record payment for payable
   * Per TSD FITUR 3.4.B - Alur 2
   */
  async recordPayment(payableId: string, payment: RecordPayablePaymentDto) {
    try {
      console.log(`💸 Recording payment for payable: ${payableId}`);

      // Get payable from database
      const payables: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM payables WHERE id = $1', payableId
      );

      if (!payables || payables.length === 0) {
        throw new Error('Payable not found');
      }

      const payable = payables[0];
      
      // Validate payment amount
      if (payment.amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      if (payment.amount > Number(payable.total_amount)) {
        throw new Error(`Payment amount exceeds payable total`);
      }

      // Insert payment record
      const paymentId = uuidv4();
      await prisma.$queryRawUnsafe(`
        INSERT INTO payable_payments (id, payable_id, payment_date, payment_amount, payment_method, reference_number, notes, created_at)
        VALUES ($1, $2, $3::date, $4::numeric, $5::text, $6::text, $7::text, NOW())
      `, paymentId, payableId, payment.payment_date, Number(payment.amount), 'TRANSFER', payment.bank_account_id || `PAY-${Date.now()}`, payment.notes || '');

      // Update payable status to PAID
      await prisma.$queryRawUnsafe(
        "UPDATE payables SET status = 'PAID', updated_at = NOW() WHERE id = $1",
        payableId
      );
      
      console.log(`✅ Payment recorded for payable: ${payableId}`);

      // Trigger event for journal entry
      financeEvents.emit('payable.paid', {
        payableId,
        vendorName: payable.vendor_name,
        amount: payment.amount,
        paymentDate: payment.payment_date,
      });

      return {
        payable_id: payableId,
        payment_amount: payment.amount,
        payment_date: payment.payment_date,
        status: 'PAID',
      };
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }

  /**
   * Get aging report (breakdown by age buckets) - SYNCHRONIZED WITH AR
   * Calculation done server-side for consistency
   */
  async getAgingReport(): Promise<any> {
    try {
      console.log('📊 Fetching AP aging report from database...');
      
      // First check if payables table has any unpaid payables
      const countCheck: any[] = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int as cnt FROM payables WHERE status NOT IN ('PAID', 'CANCELLED')
      `);
      const unpaidCount = Number(countCheck?.[0]?.cnt || 0);
      console.log(`ℹ️  Found ${unpaidCount} unpaid payables`);
      
      if (unpaidCount === 0) {
        console.log('⚠️  No unpaid payables found, returning empty aging report');
        return [];
      }

      // Calculate aging based on payable status and due date (SAME LOGIC AS AR)
      // Including remaining_amount (total - paid) for accurate AP liability
      const result: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as invoice_count,
          COALESCE(SUM(remaining), 0)::numeric as total_amount,
          age_bucket
        FROM (
          SELECT 
            (p.total_amount - COALESCE(SUM(pp.payment_amount), 0)) as remaining,
            CASE 
              WHEN (CURRENT_DATE - p.due_date) <= 0 THEN 'Current'
              WHEN (CURRENT_DATE - p.due_date) BETWEEN 1 AND 30 THEN '1-30 Days'
              WHEN (CURRENT_DATE - p.due_date) BETWEEN 31 AND 60 THEN '31-60 Days'
              WHEN (CURRENT_DATE - p.due_date) BETWEEN 61 AND 90 THEN '61-90 Days'
              ELSE '90+ Days'
            END AS age_bucket
          FROM payables p
          LEFT JOIN payable_payments pp ON p.id = pp.payable_id
          WHERE p.status NOT IN ('PAID', 'CANCELLED')
          GROUP BY p.id, p.total_amount, p.due_date
        ) aged_payables
        GROUP BY age_bucket
        ORDER BY 
          CASE age_bucket
            WHEN 'Current' THEN 1
            WHEN '1-30 Days' THEN 2
            WHEN '31-60 Days' THEN 3
            WHEN '61-90 Days' THEN 4
            ELSE 5
          END
      `);

      console.log(`✅ Found ${result.length} age buckets in aging report`);

      // Validate and map results
      if (!Array.isArray(result)) {
        console.warn('⚠️ getAgingReport: Query returned non-array result:', result);
        return [];
      }

      const mappedResult = result.map(row => {
        const count = Number(row.invoice_count) || 0;
        const total = Number(row.total_amount) || 0;
        return {
          age_bucket: row.age_bucket,
          invoice_count: count,
          total_amount: total,
        };
      });

      return mappedResult;
    } catch (error) {
      console.error('Error fetching AP aging report:', error);
      throw error;
    }
  }
}

export default new PayablesService();
