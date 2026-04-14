import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Define styles for Modern Template (Clean, Professional, with accent color)
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#2563EB', // Blue accent
  },
  companyInfo: {
    width: '50%',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#64748B',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563EB',
    textAlign: 'right',
  },
  invoiceInfo: {
    fontSize: 9,
    color: '#475569',
    textAlign: 'right',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billTo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  billToBox: {
    width: '48%',
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  billToLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  billToText: {
    fontSize: 9,
    color: '#1E293B',
    lineHeight: 1.5,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  colNo: { width: '8%', fontSize: 9 },
  colItem: { width: '40%', fontSize: 9 },
  colQty: { width: '12%', fontSize: 9, textAlign: 'center' },
  colPrice: { width: '20%', fontSize: 9, textAlign: 'right' },
  colTotal: { width: '20%', fontSize: 9, textAlign: 'right' },
  summary: {
    marginTop: 20,
    alignSelf: 'flex-end',
    width: '40%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#475569',
  },
  summaryValue: {
    fontSize: 10,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  summaryTotal: {
    backgroundColor: '#2563EB',
    borderRadius: 5,
    marginTop: 5,
  },
  summaryTotalLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  notes: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FEF3C7',
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#78350F',
    lineHeight: 1.4,
  },
});

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface ModernTemplateProps {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({
  invoiceNumber,
  invoiceDate,
  dueDate,
  customerName,
  customerAddress,
  customerPhone,
  customerEmail,
  items,
  subtotal,
  taxRate,
  taxAmount,
  total,
  notes,
  companyName = 'PT. MAJU BERSAMA SUKSES',
  companyAddress = 'Jl. Gatot Subroto No. 123, Jakarta Selatan 12950',
  companyPhone = '+62 21 5550 1234',
  companyEmail = 'finance@majubersama.co.id',
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.companyDetails}>{companyAddress}</Text>
            <Text style={styles.companyDetails}>Tel: {companyPhone}</Text>
            <Text style={styles.companyDetails}>Email: {companyEmail}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceInfo}>No: {invoiceNumber}</Text>
            <Text style={styles.invoiceInfo}>Date: {formatDate(invoiceDate)}</Text>
            <Text style={styles.invoiceInfo}>Due: {formatDate(dueDate)}</Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billTo}>
          <View style={styles.billToBox}>
            <Text style={styles.billToLabel}>Bill To</Text>
            <Text style={styles.billToText}>{customerName}</Text>
            {customerAddress && <Text style={styles.billToText}>{customerAddress}</Text>}
            {customerPhone && <Text style={styles.billToText}>Tel: {customerPhone}</Text>}
            {customerEmail && <Text style={styles.billToText}>Email: {customerEmail}</Text>}
          </View>
          <View style={[styles.billToBox, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.billToLabel}>Payment Terms</Text>
            <Text style={styles.billToText}>Due Date: {formatDate(dueDate)}</Text>
            <Text style={styles.billToText}>Payment Method: Bank Transfer</Text>
            <Text style={styles.billToText}>Bank: BCA - 1234567890</Text>
            <Text style={styles.billToText}>A/N: {companyName}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>No</Text>
            <Text style={styles.colItem}>Item Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {items.map((item, index) => (
            <View key={index} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
              <Text style={styles.colNo}>{index + 1}</Text>
              <Text style={styles.colItem}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax ({taxRate}%):</Text>
            <Text style={styles.summaryValue}>{formatCurrency(taxAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>TOTAL:</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your business! Payment due within 30 days. {'\n'}
            For questions, contact us at {companyEmail} or {companyPhone}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ModernTemplate;
