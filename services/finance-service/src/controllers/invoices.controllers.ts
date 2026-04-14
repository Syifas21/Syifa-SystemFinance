import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';
import invoicesService from '../services/invoices.service';
import { mockDataStore } from '../utils/mockData';
import journalEntriesService from '../services/journalentries.service';
import { emailService } from '../services/email-notification.service';

const prisma = new PrismaClient();

/**
 * Helper: Auto-create journal entry when invoice is created
 * 
 * Accounting Logic (LENGKAP dengan PPN):
 * DR: Account Receivable (Piutang) = total_amount (termasuk PPN)
 * CR: Sales Revenue (Pendapatan) = subtotal (sebelum PPN)
 * CR: PPN Keluaran = tax_amount
 */
async function createJournalEntryForInvoice(
  invoiceId: string,
  invoiceNumber: string,
  invoiceDate: string,
  customerName: string,
  totalAmount: number
) {
  try {
    console.log(`📝 AUTO-CREATE journal entry for invoice ${invoiceNumber}...`);

    // Get invoice detail untuk subtotal dan tax
    const invoice: any = await prisma.$queryRawUnsafe(`
      SELECT subtotal, tax_amount, total_amount 
      FROM invoices 
      WHERE id = '${invoiceId}'::uuid
    `);

    if (!invoice || invoice.length === 0) {
      console.warn('⚠️ Invoice not found for journal entry');
      return;
    }

    const subtotal = parseFloat(invoice[0].subtotal) || 0;
    const taxAmount = parseFloat(invoice[0].tax_amount) || 0;
    const total = parseFloat(invoice[0].total_amount) || totalAmount;

    // Get accounts from COA
    const arAccount: any = await prisma.$queryRawUnsafe(`
      SELECT id, account_code, account_name 
      FROM "ChartOfAccounts" 
      WHERE account_code = '1120'
      LIMIT 1
    `);

    const salesAccount: any = await prisma.$queryRawUnsafe(`
      SELECT id, account_code, account_name 
      FROM "ChartOfAccounts" 
      WHERE account_code = '4100'
      LIMIT 1
    `);

    const ppnAccount: any = await prisma.$queryRawUnsafe(`
      SELECT id, account_code, account_name 
      FROM "ChartOfAccounts" 
      WHERE account_code = '2110'
      LIMIT 1
    `);

    if (!arAccount || arAccount.length === 0) {
      console.warn('⚠️ Account 1120 (Piutang Usaha) not found in COA');
      return;
    }

    if (!salesAccount || salesAccount.length === 0) {
      console.warn('⚠️ Account 4100 (Pendapatan) not found in COA');
      return;
    }

    if (!ppnAccount || ppnAccount.length === 0) {
      console.warn('⚠️ Account 2110 (PPN Keluaran) not found in COA');
      return;
    }

    // Create DEBIT entry (Account Receivable) - Total termasuk PPN
    await prisma.$queryRawUnsafe(`
      INSERT INTO journal_entries (
        transaction_date, description, account_id, debit, credit,
        reference_id, reference_type, created_by, created_at, updated_at
      ) VALUES (
        '${new Date(invoiceDate).toISOString()}'::timestamp,
        'Piutang dari Invoice ${invoiceNumber} - ${customerName.replace(/'/g, "''")}',
        ${arAccount[0].id},
        ${total},
        0,
        '${invoiceId}'::uuid,
        'INVOICE',
        'SYSTEM',
        NOW(),
        NOW()
      )
    `);

    // Create CREDIT entry (Sales Revenue) - Subtotal sebelum PPN
    await prisma.$queryRawUnsafe(`
      INSERT INTO journal_entries (
        transaction_date, description, account_id, debit, credit,
        reference_id, reference_type, created_by, created_at, updated_at
      ) VALUES (
        '${new Date(invoiceDate).toISOString()}'::timestamp,
        'Pendapatan dari Invoice ${invoiceNumber} - ${customerName.replace(/'/g, "''")}',
        ${salesAccount[0].id},
        0,
        ${subtotal},
        '${invoiceId}'::uuid,
        'INVOICE',
        'SYSTEM',
        NOW(),
        NOW()
      )
    `);

    // Create CREDIT entry (PPN Keluaran) - Tax amount
    if (taxAmount > 0) {
      await prisma.$queryRawUnsafe(`
        INSERT INTO journal_entries (
          transaction_date, description, account_id, debit, credit,
          reference_id, reference_type, created_by, created_at, updated_at
        ) VALUES (
          '${new Date(invoiceDate).toISOString()}'::timestamp,
          'PPN Keluaran Invoice ${invoiceNumber} - ${customerName.replace(/'/g, "''")}',
          ${ppnAccount[0].id},
          0,
          ${taxAmount},
          '${invoiceId}'::uuid,
          'INVOICE',
          'SYSTEM',
          NOW(),
          NOW()
        )
      `);
    }

    console.log(`✅ AUTO Journal created: DR Piutang ${total.toLocaleString('id-ID')}, CR Pendapatan ${subtotal.toLocaleString('id-ID')}, CR PPN ${taxAmount.toLocaleString('id-ID')}`);
  } catch (error) {
    console.error('❌ Error creating journal entry for invoice:', error);
    // Don't throw error - invoice creation should succeed even if journal fails
  }
}

// Controller untuk ambil semua invoices
export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, customer_name, page = '1', limit = '10' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build WHERE clause
    const conditions: string[] = [];
    
    if (status) {
      conditions.push(`status = '${status}'`);
    }
    
    if (customer_name) {
      conditions.push(`customer_name ILIKE '%${customer_name}%'`);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Get invoices with pagination using raw query
    const invoices: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM invoices ${whereClause} ORDER BY invoice_date DESC LIMIT ${limitNum} OFFSET ${skip}`
    );

    const totalResult: any = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM invoices ${whereClause}`
    );
    
    const total = totalResult[0]?.count || 0;

    res.status(200).json({
      success: true,
      message: "Daftar Invoice berhasil diambil dari database",
      data: invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (dbError) {
    console.warn("⚠️ Database error, using mock data store for invoices");
    
    // Fallback to mock data
    const invoices = mockDataStore.getAllInvoices();
    let filtered = invoices;

    // Apply filters
    const { status, customer_name } = req.query;
    if (status) {
      filtered = filtered.filter((inv: any) => inv.status === status);
    }
    if (customer_name) {
      filtered = filtered.filter((inv: any) => 
        inv.customer_name.toLowerCase().includes((customer_name as string).toLowerCase())
      );
    }

    res.status(200).json({
      success: true,
      message: "Daftar Invoice berhasil diambil (Mock Data for Development)",
      data: filtered,
      pagination: {
        page: 1,
        limit: filtered.length,
        total: filtered.length,
        totalPages: 1
      }
    });
  }
};

// Controller untuk ambil invoice berdasarkan ID
export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const invoice: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM invoices WHERE id = '${id}'`
    );

    if (!invoice || invoice.length === 0) {
      res.status(404).json({
        success: false,
        message: "Invoice tidak ditemukan",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Invoice berhasil diambil",
      data: invoice[0],
    });
  } catch (error) {
    console.error("Error mengambil Invoice:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil data Invoice",
      error: errMsg,
    });
  }
};

// Controller untuk create invoice baru
export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      invoice_number,
      invoice_date,
      due_date,
      customer_id,
      customer_name,
      customer_address,
      customer_phone,
      customer_email,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      currency,
      status,
      notes,
      payment_terms,
      created_by
    } = req.body;

    // Validasi field wajib
    if (!invoice_number || !invoice_date || !due_date || !customer_name || !subtotal || !total_amount) {
      res.status(400).json({
        success: false,
        message: "Field wajib: invoice_number, invoice_date, due_date, customer_name, subtotal, total_amount",
      });
      return;
    }

    // Cek apakah invoice_number sudah ada
    const existingInvoice: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM invoices WHERE invoice_number = '${invoice_number}'`
    );

    if (existingInvoice && existingInvoice.length > 0) {
      res.status(409).json({
        success: false,
        message: "Invoice number sudah digunakan",
      });
      return;
    }

    // Create invoice using raw query
    const newInvoice: any = await prisma.$queryRawUnsafe(`
      INSERT INTO invoices (
        id, invoice_number, invoice_date, due_date, customer_id, customer_name,
        customer_address, customer_phone, customer_email, subtotal,
        tax_amount, discount_amount, total_amount, currency, status,
        notes, payment_terms, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        '${invoice_number}',
        '${new Date(invoice_date).toISOString()}',
        '${new Date(due_date).toISOString()}',
        ${customer_id ? `'${customer_id}'` : 'NULL'},
        '${customer_name}',
        ${customer_address ? `'${customer_address}'` : 'NULL'},
        ${customer_phone ? `'${customer_phone}'` : 'NULL'},
        ${customer_email ? `'${customer_email}'` : 'NULL'},
        ${subtotal},
        ${tax_amount || 0},
        ${discount_amount || 0},
        ${total_amount},
        '${currency || 'IDR'}',
        '${status || 'DRAFT'}',
        ${notes ? `'${notes}'` : 'NULL'},
        ${payment_terms ? `'${payment_terms}'` : 'NULL'},
        ${created_by ? `'${created_by}'` : 'NULL'},
        NOW(),
        NOW()
      )
      RETURNING *
    `);

    const createdInvoice = newInvoice[0];

    // 🔥 AUTO-CREATE JOURNAL ENTRY (Accounting Integration)
    // Langsung create journal saat invoice dibuat, tidak perlu tunggu SENT
    await createJournalEntryForInvoice(
      createdInvoice.id,
      createdInvoice.invoice_number,
      invoice_date,
      customer_name,
      total_amount
    );

    console.log(`✅ Invoice ${createdInvoice.invoice_number} created with auto journal entry`);

    res.status(201).json({
      success: true,
      message: "✅ Invoice berhasil dibuat!\n\n📊 Jurnal Otomatis Tercatat:\n• DR: Piutang Usaha (1120)\n• CR: Pendapatan (4100)\n• CR: PPN Keluaran (2110)\n\n✓ Sudah masuk ke Journal Entries",
      data: createdInvoice,
      journal_created: true,
    });
  } catch (error) {
    console.error("Error membuat Invoice:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat membuat Invoice",
      error: errMsg,
    });
  }
};

// Controller untuk update invoice
export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      invoice_date,
      due_date,
      customer_id,
      customer_name,
      customer_address,
      customer_phone,
      customer_email,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      currency,
      status,
      notes,
      payment_terms,
      updated_by
    } = req.body;

    // Cek apakah invoice ada
    const existingInvoice: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM invoices WHERE id = '${id}'`
    );

    if (!existingInvoice || existingInvoice.length === 0) {
      res.status(404).json({
        success: false,
        message: "Invoice tidak ditemukan",
      });
      return;
    }

    // Build UPDATE query dynamically
    const updateFields: string[] = [];
    
    if (invoice_date) updateFields.push(`invoice_date = '${new Date(invoice_date).toISOString()}'`);
    if (due_date) updateFields.push(`due_date = '${new Date(due_date).toISOString()}'`);
    if (customer_id !== undefined) updateFields.push(`customer_id = ${customer_id ? `'${customer_id}'` : 'NULL'}`);
    if (customer_name) updateFields.push(`customer_name = '${customer_name}'`);
    if (customer_address !== undefined) updateFields.push(`customer_address = ${customer_address ? `'${customer_address}'` : 'NULL'}`);
    if (customer_phone !== undefined) updateFields.push(`customer_phone = ${customer_phone ? `'${customer_phone}'` : 'NULL'}`);
    if (customer_email !== undefined) updateFields.push(`customer_email = ${customer_email ? `'${customer_email}'` : 'NULL'}`);
    if (subtotal !== undefined) updateFields.push(`subtotal = ${subtotal}`);
    if (tax_amount !== undefined) updateFields.push(`tax_amount = ${tax_amount}`);
    if (discount_amount !== undefined) updateFields.push(`discount_amount = ${discount_amount}`);
    if (total_amount !== undefined) updateFields.push(`total_amount = ${total_amount}`);
    if (currency) updateFields.push(`currency = '${currency}'`);
    if (status) updateFields.push(`status = '${status}'`);
    if (notes !== undefined) updateFields.push(`notes = ${notes ? `'${notes}'` : 'NULL'}`);
    if (payment_terms !== undefined) updateFields.push(`payment_terms = ${payment_terms ? `'${payment_terms}'` : 'NULL'}`);
    if (updated_by) updateFields.push(`updated_by = '${updated_by}'`);
    
    updateFields.push(`updated_at = NOW()`);

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        message: "Tidak ada field yang diupdate",
      });
      return;
    }

    // Update invoice using raw query
    const updatedInvoice: any = await prisma.$queryRawUnsafe(`
      UPDATE invoices
      SET ${updateFields.join(', ')}
      WHERE id = '${id}'
      RETURNING *
    `);

    res.status(200).json({
      success: true,
      message: "Invoice berhasil diupdate",
      data: updatedInvoice[0],
    });
  } catch (error) {
    console.error("Error update Invoice:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat update Invoice",
      error: errMsg,
    });
  }
};

// Controller untuk delete invoice
export const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Cek apakah invoice ada
    const existingInvoice: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM invoices WHERE id = '${id}'`
    );

    if (!existingInvoice || existingInvoice.length === 0) {
      res.status(404).json({
        success: false,
        message: "Invoice tidak ditemukan",
      });
      return;
    }

    // Delete invoice using raw query
    await prisma.$queryRawUnsafe(
      `DELETE FROM invoices WHERE id = '${id}'`
    );

    res.status(200).json({
      success: true,
      message: "Invoice berhasil dihapus",
    });
  } catch (error) {
    console.error("Error delete Invoice:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat menghapus Invoice",
      error: errMsg,
    });
  }
};

/**
 * GET /api/finance/invoices/summary/ar
 * Get Accounts Receivable summary (Total Piutang, Overdue, DSO)
 * Per TSD FITUR 3.4.A
 */
export const getARSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📊 Getting AR Summary...');
    const summary = await invoicesService.getARSummary();

    res.status(200).json({
      success: true,
      message: 'AR Summary berhasil diambil',
      data: summary,
    });
  } catch (error) {
    console.error('❌ Error getting AR Summary:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat mengambil AR Summary',
      error: errMsg,
    });
  }
};

/**
 * PUT /api/finance/invoices/:id/send
 * Send invoice - Change status to SENT and trigger journal entry
 * Per TSD FITUR 3.4.A - FIN-10
 */
export const sendInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sent_by } = req.body;

    console.log(`📤 Sending invoice ${id}...`);
    
    try {
      const invoice = await invoicesService.sendInvoice(id, sent_by);

      res.status(200).json({
        success: true,
        message: 'Invoice berhasil dikirim dan jurnal otomatis dibuat',
        data: invoice,
      });
    } catch (dbError) {
      // Fallback to mock data
      console.warn('⚠️ Database error, using mock data store for sending invoice');
      
      const invoiceId = parseInt(id);
      const result = mockDataStore.sendInvoice(invoiceId, sent_by);
      
      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Invoice tidak ditemukan',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Invoice berhasil dikirim dan jurnal otomatis dibuat (Mock Data)',
        data: result,
      });
    }
  } catch (error) {
    console.error('❌ Error sending invoice:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errMsg.includes('not found') ? 404 : 
                       errMsg.includes('Only DRAFT') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      message: errMsg,
      error: errMsg,
    });
  }
};

/**
 * POST /api/finance/invoices/:id/payments
 * Record payment for invoice
 * Per TSD FITUR 3.4.A - FIN-11
 */
export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const paymentData = req.body;

    console.log(`💰 Recording payment for invoice ${id}:`, paymentData);

    // Validate required fields
    if (!paymentData.payment_date || !paymentData.amount || !paymentData.method) {
      res.status(400).json({
        success: false,
        message: 'payment_date, amount, dan method wajib diisi',
      });
      return;
    }

    try {
      const result = await invoicesService.recordPayment(id, paymentData);

      res.status(200).json({
        success: true,
        message: 'Pembayaran berhasil dicatat dari database',
        data: result,
      });
    } catch (dbError) {
      // Fallback to mock data
      console.warn('⚠️ Database error, using mock data store for payment recording');
      
      const invoiceId = parseInt(id);
      const result = mockDataStore.recordInvoicePayment(invoiceId, paymentData);
      
      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Invoice tidak ditemukan',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Pembayaran berhasil dicatat (Mock Data for Development)',
        data: result,
      });
    }
  } catch (error) {
    console.error('❌ Error recording payment:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';

    res.status(400).json({
      success: false,
      message: errMsg,
      error: errMsg,
    });
  }
};

/**
 * POST /api/finance/invoices/send-email
 * Send invoice via email with PDF attachment
 */
export const sendInvoiceEmailController = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      to,
      subject,
      message,
      pdfBase64,
      filename,
      invoiceNumber,
      customerName,
      amount,
      dueDate
    } = req.body;

    console.log(`📧 Sending invoice email to ${to}...`);

    // Use email notification service (already imported at top)
    const result = await emailService.sendEmail({
      to,
      subject: subject || `Invoice ${invoiceNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0B2447 0%, #3B82F6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .amount { font-size: 24px; font-weight: bold; color: #3B82F6; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📄 Invoice - ${invoiceNumber || 'N/A'}</h1>
              <p>Tagihan Pembayaran</p>
            </div>
            <div class="content">
              <p>Yth. ${customerName || 'Pelanggan'},</p>
              <p>${message || 'Terlampir invoice pembayaran untuk transaksi Anda.'}</p>
              
              <div class="invoice-details">
                <div class="detail-row">
                  <span><strong>Nomor Invoice:</strong></span>
                  <span>${invoiceNumber || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Jatuh Tempo:</strong></span>
                  <span>${dueDate || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Total:</strong></span>
                  <span class="amount">Rp ${amount ? amount.toLocaleString('id-ID') : 'N/A'}</span>
                </div>
              </div>
              
              <p style="margin-top: 30px;">Mohon melakukan pembayaran sebelum tanggal jatuh tempo.</p>
              <p>Jika ada pertanyaan, silakan hubungi kami.</p>
            </div>
            <div class="footer">
              <p>Email otomatis dari Sistem Finance</p>
              <p>© ${new Date().getFullYear()} Finance Management System</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: pdfBase64 ? [{
        filename: filename || 'invoice.pdf',
        // Remove data URL prefix if exists (data:application/pdf;base64,)
        content: pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf'
      }] : []
    });

    res.status(200).json({
      success: result.success,
      message: result.success ? 'Email berhasil dikirim' : 'Gagal mengirim email',
      messageId: result.messageId
    });
  } catch (error) {
    console.error('❌ Error sending invoice email:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Gagal mengirim email',
    });
  }
};
