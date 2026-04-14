import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define styles for Minimal Template (Clean, Simple, Lots of White Space)
const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 50,
  },
  companyInfo: {
    width: '50%',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: 1,
  },
  companyDetails: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.5,
  },
  invoiceTitle: {
    fontSize: 32,
    fontWeight: 'ultrabold',
    color: '#000000',
    textAlign: 'right',
    letterSpacing: -1,
  },
  billInfo: {
    marginBottom: 40,
  },
  billRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  billLabel: {
    width: '30%',
    fontSize: 9,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billValue: {
    width: '70%',
    fontSize: 10,
    color: '#000000',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginVertical: 25,
  },
  table: {
    marginTop: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  tableHeaderText: {
    fontSize: 9,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  colItem: { width: '50%', fontSize: 10, color: '#000000' },
  colQty: { width: '15%', fontSize: 10, textAlign: 'center', color: '#000000' },
  colPrice: { width: '17.5%', fontSize: 10, textAlign: 'right', color: '#666666' },
  colTotal: { width: '17.5%', fontSize: 10, textAlign: 'right', color: '#000000' },
  summary: {
    marginTop: 30,
    alignSelf: 'flex-end',
    width: '40%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 10,
    color: '#000000',
    textAlign: 'right',
  },
  summaryTotal: {
    paddingTop: 15,
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#000000',
  },
  summaryTotalLabel: {
    fontSize: 11,
    color: '#000000',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryTotalValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 60,
    right: 60,
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  notes: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  notesLabel: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.6,
  },
});

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface MinimalTemplateProps {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerAddress?: string;
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

const MinimalTemplate: React.FC<MinimalTemplateProps> = ({
  invoiceNumber,
  invoiceDate,
  dueDate,
  customerName,
  customerAddress,
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
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
            <Text style={styles.companyDetails}>{companyPhone}</Text>
            <Text style={styles.companyDetails}>{companyEmail}</Text>
          </View>
          <Text style={styles.invoiceTitle}>Invoice</Text>
        </View>

        {/* Bill Info */}
        <View style={styles.billInfo}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Invoice Number</Text>
            <Text style={styles.billValue}>{invoiceNumber}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Date</Text>
            <Text style={styles.billValue}>{formatDate(invoiceDate)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Due Date</Text>
            <Text style={styles.billValue}>{formatDate(dueDate)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bill To */}
        <View style={styles.billInfo}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Bill To</Text>
            <View style={{ width: '70%' }}>
              <Text style={styles.billValue}>{customerName}</Text>
              {customerAddress && <Text style={[styles.billValue, { fontSize: 9, color: '#666666', marginTop: 3 }]}>{customerAddress}</Text>}
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Price</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
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
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax ({taxRate}%)</Text>
            <Text style={styles.summaryValue}>{formatCurrency(taxAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your business
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default MinimalTemplate;
