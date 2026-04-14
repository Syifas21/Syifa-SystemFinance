/**
 * AR (Accounts Receivable) Service
 * Provides real-time data for AR Dashboard
 */

import { prisma } from '../utils/prisma';

interface ARSummaryData {
  total_receivable: number;
  total_paid: number;
  total_outstanding: number;
  overdue_amount: number;
  overdue_count: number;
  avg_dso: number; // Days Sales Outstanding
  status_breakdown: {
    draft: number;
    sent: number;
    partially_paid: number;
    paid: number;
    overdue: number;
  };
  recent_invoices: Array<{
    id: string;
    invoice_number: string;
    customer_name: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: string;
    invoice_date: string;
    due_date: string;
    days_outstanding: number;
  }>;
}

class ARService {
  /**
   * Get comprehensive AR summary with real data
   */
  async getARSummary(): Promise<ARSummaryData> {
    try {
      console.log('📊 Calculating AR Summary from database...');

      // Get all invoices
      const invoices = await prisma.invoices.findMany({
        orderBy: { invoice_date: 'desc' },
      });

      let totalReceivable = 0;
      let totalPaid = 0;
      let overdueAmount = 0;
      let overdueCount = 0;
      let totalDaysOutstanding = 0;
      let invoiceCount = 0;

      const statusBreakdown = {
        draft: 0,
        sent: 0,
        partially_paid: 0,
        paid: 0,
        overdue: 0,
      };

      const now = new Date();
      const recentInvoices: any[] = [];

      for (const invoice of invoices) {
        const total = Number(invoice.total_amount);
        
        // Determine paid amount based on status (since we don't have invoice_payments table yet)
        let paid = 0;
        let remaining = total;
        
        if (invoice.status === 'PAID') {
          paid = total;
          remaining = 0;
        }
        // For now, we'll treat all non-PAID invoices as unpaid
        // In the future, you can add invoice_payments table for partial payments
        
        totalReceivable += remaining;
        totalPaid += paid;

        // Calculate days outstanding
        const invoiceDate = new Date(invoice.invoice_date);
        const daysOutstanding = Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        totalDaysOutstanding += daysOutstanding;
        invoiceCount++;

        // Check if overdue
        const dueDate = new Date(invoice.due_date);
        const isOverdue = dueDate < now && remaining > 0;

        if (isOverdue) {
          overdueAmount += remaining;
          overdueCount++;
          statusBreakdown.overdue++;
        } else {
          // Status breakdown
          if (invoice.status === 'DRAFT') statusBreakdown.draft++;
          else if (invoice.status === 'SENT') statusBreakdown.sent++;
          else if (invoice.status === 'PAID') statusBreakdown.paid++;
          // partially_paid will be used when invoice_payments table is added
        }

        // Add to recent invoices (top 10)
        if (recentInvoices.length < 10) {
          recentInvoices.push({
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            customer_name: invoice.customer_name,
            total_amount: total,
            paid_amount: paid,
            remaining_amount: remaining,
            status: isOverdue ? 'OVERDUE' : invoice.status,
            invoice_date: invoice.invoice_date.toISOString(),
            due_date: invoice.due_date.toISOString(),
            days_outstanding: daysOutstanding,
          });
        }
      }

      const avgDSO = invoiceCount > 0 ? Math.round(totalDaysOutstanding / invoiceCount) : 0;

      return {
        total_receivable: totalReceivable,
        total_paid: totalPaid,
        total_outstanding: totalReceivable,
        overdue_amount: overdueAmount,
        overdue_count: overdueCount,
        avg_dso: avgDSO,
        status_breakdown: statusBreakdown,
        recent_invoices: recentInvoices,
      };
    } catch (error) {
      console.error('Error fetching AR summary:', error);
      throw error;
    }
  }

  /**
   * Get aging report (breakdown by age buckets)
   */
  async getAgingReport(): Promise<any> {
    try {
      console.log('📊 Fetching AR aging report from database...');
      
      // First check if invoices table has any unpaid invoices
      const countCheck: any[] = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as cnt FROM invoices WHERE status NOT IN ('PAID', 'DRAFT')
      `);
      const unpaidCount = Number(countCheck?.[0]?.cnt || 0);
      console.log(`ℹ️  Found ${unpaidCount} unpaid invoices`);
      
      if (unpaidCount === 0) {
        console.log('⚠️  No unpaid invoices found, returning empty aging report');
        return [];
      }

      // Calculate aging based on invoice status and due date
      // Using proper GROUP BY syntax with sub-query
      const result: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          COUNT(*) as invoice_count,
          COALESCE(SUM(total_amount), 0) as total_amount,
          age_bucket
        FROM (
          SELECT 
            total_amount,
            CASE 
              WHEN (CURRENT_DATE - due_date) <= 0 THEN 'Current'
              WHEN (CURRENT_DATE - due_date) BETWEEN 1 AND 30 THEN '1-30 Days'
              WHEN (CURRENT_DATE - due_date) BETWEEN 31 AND 60 THEN '31-60 Days'
              WHEN (CURRENT_DATE - due_date) BETWEEN 61 AND 90 THEN '61-90 Days'
              ELSE '90+ Days'
            END AS age_bucket
          FROM invoices
          WHERE status NOT IN ('PAID', 'DRAFT')
        ) aged_invoices
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
        const amount = Number(row.total_amount) || 0;
        
        if (isNaN(count) || isNaN(amount)) {
          console.warn('⚠️ getAgingReport: Invalid number conversion for row:', {
            row,
            count,
            amount,
          });
        }
        
        return {
          age_bucket: row.age_bucket || 'Unknown',
          invoice_count: count,
          total_amount: amount,
        };
      });

      console.log('✅ Aging report generated successfully:', mappedResult);
      return mappedResult;
    } catch (error: any) {
      console.error('❌ Error in getAgingReport:', {
        message: error.message,
        code: error.code,
        meta: error.meta,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      });
      throw new Error(`Failed to fetch aging report: ${error.message}`);
    }
  }

  /**
   * Get top customers by outstanding amount
   */
  async getTopCustomers(limit: number = 10): Promise<any[]> {
    try {
      // Calculate outstanding based on unpaid invoices
      const result: any[] = await prisma.$queryRawUnsafe(`
        SELECT 
          customer_name,
          customer_id,
          COUNT(*) as invoice_count,
          SUM(total_amount) as total_billed,
          SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END) as total_paid,
          SUM(CASE WHEN status != 'PAID' THEN total_amount ELSE 0 END) as total_outstanding
        FROM invoices
        WHERE status != 'DRAFT'
        GROUP BY customer_name, customer_id
        HAVING SUM(CASE WHEN status != 'PAID' THEN total_amount ELSE 0 END) > 0
        ORDER BY total_outstanding DESC
        LIMIT $1
      `, limit);

      return result.map(row => ({
        customer_name: row.customer_name,
        customer_id: row.customer_id,
        invoice_count: Number(row.invoice_count),
        total_billed: Number(row.total_billed),
        total_paid: Number(row.total_paid),
        total_outstanding: Number(row.total_outstanding),
      }));
    } catch (error) {
      console.error('Error getting top customers:', error);
      throw error;
    }
  }
}

export default new ARService();
