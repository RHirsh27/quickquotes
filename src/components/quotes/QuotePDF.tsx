'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

// Register a standard font (optional, using Helvetica by default is fine)
// Font.register({ family: 'Helvetica', src: '...' })

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  companyName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  label: { color: '#666', marginBottom: 2 },
  
  // Customer & Quote Info Grid
  infoSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  infoCol: { width: '45%' },
  
  // Table
  table: { width: '100%', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 6, marginBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  
  // Table Columns
  colDesc: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colRate: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },

  // Totals
  totalsSection: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalRow: { flexDirection: 'row', marginBottom: 4, width: 200 },
  totalLabel: { width: '60%', textAlign: 'right', paddingRight: 10, color: '#666' },
  totalValue: { width: '40%', textAlign: 'right', fontWeight: 'bold' },
  grandTotal: { fontSize: 14, marginTop: 8 },
  
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#999', fontSize: 9 }
})

// Types (reusing or importing from your types file)
interface QuotePDFProps {
  quote: any
  items: any[]
  customer: any
  userProfile: any
}

export const QuotePDF = ({ quote, items, customer, userProfile }: QuotePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>{userProfile?.company_name || 'Service Company'}</Text>
          <Text>{userProfile?.phone}</Text>
          <Text>{userProfile?.email}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 24, color: '#2563eb' }}>ESTIMATE</Text>
          <Text style={{ marginTop: 4 }}>#{quote.quote_number}</Text>
          <Text style={{ marginTop: 2 }}>{new Date(quote.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoCol}>
          <Text style={styles.label}>BILL TO:</Text>
          <Text style={{ fontWeight: 'bold' }}>{customer.name}</Text>
          {customer.address_line_1 && <Text>{customer.address_line_1}</Text>}
          {customer.city && <Text>{customer.city} {customer.state} {customer.postal_code}</Text>}
          {customer.phone && <Text>{customer.phone}</Text>}
          {customer.email && <Text>{customer.email}</Text>}
        </View>
      </View>

      {/* Line Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>DESCRIPTION</Text>
          <Text style={styles.colQty}>QTY</Text>
          <Text style={styles.colRate}>RATE</Text>
          <Text style={styles.colTotal}>AMOUNT</Text>
        </View>

        {items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.colDesc}>
              <Text style={{ fontWeight: 'bold' }}>{item.label}</Text>
              {item.description && <Text style={{ color: '#666', fontSize: 9 }}>{item.description}</Text>}
            </View>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colRate}>${item.unit_price.toFixed(2)}</Text>
            <Text style={styles.colTotal}>${(item.quantity * item.unit_price).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${quote.subtotal.toFixed(2)}</Text>
          </View>
          {quote.tax_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({quote.tax_rate}%)</Text>
              <Text style={styles.totalValue}>${quote.tax_amount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${quote.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Footer / Notes */}
      {quote.notes && (
        <View style={{ marginTop: 40, padding: 10, backgroundColor: '#f9fafb' }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Notes / Terms:</Text>
          <Text>{quote.notes}</Text>
        </View>
      )}

      <Text style={styles.footer}>Thank you for your business!</Text>
    </Page>
  </Document>
)

