import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define styles for Classic Template (Traditional, Formal, Black & White)
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 10,
    fontFamily: 'Times-Roman',
    backgroundColor: '#FFFFFF',
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  companyName: {
    fontSize: 24,
    fontFamily: 'Times-Bold',
    color: '#000000',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  companyDetails: {
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 18,
    fontFamily: 'Times-Bold',
    color: '#000000',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  invoiceInfoBox: {
    width: '30%',
  },
  infoLabel: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
    color: '#000000',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 10,
    color: '#000000',
  },
  billTo: {
    marginBottom: 25,
    paddingLeft: 20,
  },
  billToLabel: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: '#000000',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  billToText: {
    fontSize: 10,
    color: '#000000',
    lineHeight: 1.5,
  },
  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#000000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tableHeaderText: {
    fontFamily: 'Times-Bold',
    fontSize: 9,
    color: '#000000',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  colNo: { width: '8%', fontSize: 9 },
  colItem: { width: '45%', fontSize: 9 },
  colQty: { width: '10%', fontSize: 9, textAlign: 'center' },
  colPrice: { width: '17%', fontSize: 9, textAlign: 'right' },
  colTotal: { width: '20%', fontSize: 9, textAlign: 'right' },
  summary: {
    marginTop: 15,
    alignSelf: 'flex-end',
    width: '45%',
    borderWidth: 1,
    borderColor: '#000000',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
  summaryRowTotal: {
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 0,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#000000',
  },
  summaryLabelTotal: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    color: '#000000',
  },
  summaryValue: {
    fontSize: 10,
    color: '#000000',
  },
  summaryValueTotal: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    color: '#000000',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: '#000000',
  },
  signature: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 20,
  },
  signatureBox: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
    color: '#000000',
    marginBottom: 40,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 5,
  },
  signatureName: {
    fontSize: 9,
    color: '#000000',
  },
  footerText: {
    fontSize: 8,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 1.4,
    marginTop: 10,
  },
  notes: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#F9F9F9',
  },
  notesLabel: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
    color: '#000000',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.4,
  },
});

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface ClassicTemplateProps {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
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

const ClassicTemplate: React.FC<ClassicTemplateProps> = ({
  invoiceNumber,
  invoiceDate,
  dueDate,
  customerName,
  customerAddress,
  customerPhone,
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
          <Text style={styles.companyName}>{companyName}</Text>
          <Text style={styles.companyDetails}>{companyAddress}</Text>
          <Text style={styles.companyDetails}>Telp: {companyPhone} | Email: {companyEmail}</Text>
        </View>

        <Text style={styles.invoiceTitle}>INVOICE</Text>

        {/* Invoice Info */}
        <View style={styles.invoiceInfo}>
          <View style={styles.invoiceInfoBox}>
            <Text style={styles.infoLabel}>Invoice Number:</Text>
            <Text style={styles.infoValue}>{invoiceNumber}</Text>
          </View>
          <View style={styles.invoiceInfoBox}>
            <Text style={styles.infoLabel}>Invoice Date:</Text>
            <Text style={styles.infoValue}>{formatDate(invoiceDate)}</Text>
          </View>
          <View style={styles.invoiceInfoBox}>
            <Text style={styles.infoLabel}>Due Date:</Text>
            <Text style={styles.infoValue}>{formatDate(dueDate)}</Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billTo}>
          <Text style={styles.billToLabel}>Bill To:</Text>
          <Text style={styles.billToText}>{customerName}</Text>
          {customerAddress && <Text style={styles.billToText}>{customerAddress}</Text>}
          {customerPhone && <Text style={styles.billToText}>Telp: {customerPhone}</Text>}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colNo]}>No.</Text>
            <Text style={[styles.tableHeaderText, styles.colItem]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Amount</Text>
          </View>
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colNo}>{index + 1}.</Text>
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
          <View style={[styles.summaryRow, styles.summaryRowTotal]}>
            <Text style={styles.summaryLabelTotal}>TOTAL DUE:</Text>
            <Text style={styles.summaryValueTotal}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>NOTES:</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.signature}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Prepared By,</Text>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureName}>(________________)</Text>
              </View>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Approved By,</Text>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureName}>(________________)</Text>
              </View>
            </View>
          </View>
          <Text style={styles.footerText}>
            Payment should be made within 30 days. Please make checks payable to {companyName}.{'\n'}
            Thank you for your business.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ClassicTemplate;
