import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
// import InvoiceTemplate, { generateInvoiceFromCSV } from './InvoiceTemplate';

/**
 * ====================================
 * INVOICE TEMPLATE VIEW PAGE
 * ====================================
 * 
 * Halaman untuk view dan download invoice sebagai PDF
 * Auto-generate dari data invoice dengan format profesional
 */

const InvoiceTemplateView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoiceData();
  }, [id]);

  const loadInvoiceData = async () => {
    try {
      // Fetch invoice data from API
      const response = await fetch(`/api/invoices/${id}`);
      const result = await response.json();

      if (result.success) {
        // Convert to template format
        const templateData = {
          invoice_number: result.data.invoice_number,
          invoice_date: result.data.invoice_date,
          due_date: result.data.due_date,
          customer_name: result.data.customer_name,
          customer_address: result.data.customer_address || 'Jakarta, Indonesia',
          customer_npwp: result.data.customer_npwp,
          wo_po_number: result.data.customer_po || '-',
          items: result.data.items || [
            {
              description: result.data.project_name || 'Service',
              quantity: 1,
              unit_price: result.data.subtotal || 0,
              amount: result.data.subtotal || 0,
            }
          ],
          subtotal: result.data.subtotal || 0,
          ppn_rate: 11,
          ppn_amount: result.data.tax_ppn || 0,
          pph23_rate: 2,
          pph23_amount: result.data.tax_pph23 || 0,
          grand_total: result.data.total_amount || 0,
        };

        setInvoiceData(templateData);
      }
    } catch (error) {
      console.error('Failed to load invoice:', error);
      
      // Fallback: Generate dummy data untuk testing
      setInvoiceData({
        invoice_number: 'INV251124',
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        customer_name: 'Shell Lenteng Agung 1',
        customer_address: 'Jl. Lenteng Agung Raya No. 123, Jakarta Selatan 12345',
        customer_npwp: '01.234.567.8-901.000',
        wo_po_number: 'WOSHELLSHELL',
        items: [
          {
            description: 'RM - Reactive Maintenance - Identify & Repair Chiller System',
            quantity: 1,
            unit_price: 200000,
            amount: 200000,
          },
          {
            description: 'Material & Parts',
            quantity: 1,
            unit_price: 137120,
            amount: 137120,
          }
        ],
        subtotal: 337120,
        ppn_rate: 11,
        ppn_amount: 37083,
        pph23_rate: 2,
        pph23_amount: 6742,
        grand_total: 367461,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-light mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading invoice template...</p>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600 mb-2">Invoice Not Found</p>
          <p className="text-gray-600">Invoice #{id} tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto">
        <InvoiceTemplate data={invoiceData} />
      </div>
    </div>
  );
};

export default InvoiceTemplateView;
