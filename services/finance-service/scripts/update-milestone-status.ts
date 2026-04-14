import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateMilestoneStatus() {
  try {
    console.log('🔄 Updating existing milestone statuses...');

    // Update Triggered -> InProgress
    const triggered = await prisma.$executeRaw`
      UPDATE "invoice_milestones" 
      SET "status" = 'Pending'::"InvoiceMilestoneStatus"
      WHERE "status" = 'Triggered'::"InvoiceMilestoneStatus"
    `;
    console.log(`✅ Updated ${triggered} Triggered -> Pending`);

    // Update Invoiced -> Billed
    const invoiced = await prisma.$executeRaw`
      UPDATE "invoice_milestones" 
      SET "status" = 'Pending'::"InvoiceMilestoneStatus"
      WHERE "status" = 'Invoiced'::"InvoiceMilestoneStatus"
    `;
    console.log(`✅ Updated ${invoiced} Invoiced -> Pending`);

    console.log('✅ All milestone statuses updated successfully!');
  } catch (error) {
    console.error('❌ Error updating statuses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMilestoneStatus();
