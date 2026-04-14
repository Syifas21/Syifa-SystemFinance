/**
 * Cron Job for Auto-generating Invoices from Milestones
 * Runs daily at 1:00 AM to check for milestones that are due
 * Per TSD FITUR 3.4.A - FIN-09: Auto-generate invoice based on termin/milestone
 */

import cron from 'node-cron';
import milestoneInvoiceService from '../services/milestone-invoice.service';

/**
 * Initialize cron jobs for finance automation
 */
export const initFinanceCronJobs = () => {
  console.log('🕐 Initializing Finance Cron Jobs...');

  // ============================================
  // CRON JOB 1: Auto-generate invoices from milestones
  // Schedule: Every day at 1:00 AM
  // ============================================
  cron.schedule('0 1 * * *', async () => {
    console.log('\n🔔 [CRON] Starting daily milestone invoice generation...');
    console.log(`   Time: ${new Date().toISOString()}`);
    
    try {
      const result = await milestoneInvoiceService.generateInvoicesFromDueMilestones();
      
      console.log('\n✅ [CRON] Milestone invoice generation completed');
      console.log(`   - Invoices Generated: ${result.invoicesGenerated}`);
      console.log(`   - Errors: ${result.errors.length}`);
      
      if (result.invoicesGenerated > 0) {
        console.log('\n📄 Generated Invoices:');
        result.invoices.forEach(inv => {
          console.log(`   - ${inv.invoice_number} | ${inv.customer_name} | ${inv.milestone_name} | Rp ${inv.amount.toLocaleString('id-ID')}`);
        });
      }
      
      if (result.errors.length > 0) {
        console.log('\n⚠️ Errors:');
        result.errors.forEach(err => {
          console.log(`   - ${err.milestone_name}: ${err.error}`);
        });
      }
      
    } catch (error) {
      console.error('❌ [CRON] Error in milestone invoice generation:', error);
    }
  });

  // ============================================
  // CRON JOB 2: Send payment reminders for overdue invoices
  // Schedule: Every day at 9:00 AM
  // ============================================
  cron.schedule('0 9 * * *', async () => {
    console.log('\n🔔 [CRON] Starting daily payment reminder check...');
    console.log(`   Time: ${new Date().toISOString()}`);
    
    try {
      // TODO: Implement payment reminder logic
      // - Query invoices WHERE status = 'SENT' AND due_date < TODAY
      // - Send reminder emails to customers
      console.log('⏳ [CRON] Payment reminder feature - Coming soon');
      
    } catch (error) {
      console.error('❌ [CRON] Error in payment reminder:', error);
    }
  });

  // ============================================
  // CRON JOB 3: Update invoice status to OVERDUE
  // Schedule: Every day at 2:00 AM
  // ============================================
  cron.schedule('0 2 * * *', async () => {
    console.log('\n🔔 [CRON] Starting daily invoice status update...');
    console.log(`   Time: ${new Date().toISOString()}`);
    
    try {
      // TODO: Implement auto-update status logic
      // - UPDATE invoices SET status = 'OVERDUE' WHERE status = 'SENT' AND due_date < TODAY
      console.log('⏳ [CRON] Invoice status update feature - Coming soon');
      
    } catch (error) {
      console.error('❌ [CRON] Error in status update:', error);
    }
  });

  console.log('✅ Finance Cron Jobs initialized successfully');
  console.log('   📅 Milestone Invoice Generation: Daily at 1:00 AM');
  console.log('   📧 Payment Reminders: Daily at 9:00 AM');
  console.log('   🔄 Status Updates: Daily at 2:00 AM');
};

/**
 * Manual trigger for testing (can be called from API endpoint)
 */
export const triggerMilestoneInvoiceGeneration = async () => {
  console.log('🔧 [MANUAL] Triggering milestone invoice generation...');
  
  try {
    const result = await milestoneInvoiceService.generateInvoicesFromDueMilestones();
    return result;
  } catch (error) {
    console.error('❌ [MANUAL] Error in milestone invoice generation:', error);
    throw error;
  }
};
