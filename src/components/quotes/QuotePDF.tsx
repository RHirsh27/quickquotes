'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Quote, QuoteLineItem, Customer, Team } from '@/lib/types'

interface QuotePDFProps {
  quote: Quote
  items: QuoteLineItem[]
  customer: Customer
  team: Team
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  companyName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  label: { color: '#666', marginBottom: 2 },
  
  // Customer & Quote Info Grid
  infoSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  infoCol: { width: '45%' },
  
  // Job Summary
  jobSummarySection: { marginBottom: 20, padding: 10, backgroundColor: '#f3f4f6', borderRadius: 4 },
  jobSummaryLabel: { fontSize: 9, fontWeight: 'bold', color: '#666', marginBottom: 4, textTransform: 'uppercase' },
  jobSummaryText: { fontSize: 10, color: '#333', lineHeight: 1.5 },
  
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
  
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#999', fontSize: 9 },
  notesSection: { marginTop: 40, padding: 10, backgroundColor: '#f9fafb' }
})

export const QuotePDF = ({ quote, items, customer, team }: QuotePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header: Team Company Name & Info */}
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>
            {team?.name || 'Service Company'}
          </Text>
          {team?.company_address && <Text>{team.company_address}</Text>}
          {team?.company_phone && <Text>{team.company_phone}</Text>}
          {team?.company_email && <Text>{team.company_email}</Text>}
          {team?.company_website && <Text>{team.company_website}</Text>}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 24, color: '#2563eb' }}>ESTIMATE</Text>
          <Text style={{ marginTop: 4 }}>#{quote.quote_number}</Text>
          <Text style={{ marginTop: 2 }}>
            {new Date(quote.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Body: Customer Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoCol}>
          <Text style={styles.label}>BILL TO:</Text>
          <Text style={{ fontWeight: 'bold' }}>{customer.name}</Text>
          {customer.address_line_1 && <Text>{customer.address_line_1}</Text>}
          {customer.city && customer.state && (
            <Text>
              {customer.city}, {customer.state} {customer.postal_code || ''}
            </Text>
          )}
          {customer.phone && <Text>{customer.phone}</Text>}
          {customer.email && <Text>{customer.email}</Text>}
        </View>
      </View>

      {/* Job Summary */}
      {quote.job_summary && (
        <View style={styles.jobSummarySection}>
          <Text style={styles.jobSummaryLabel}>SCOPE OF WORK:</Text>
          <Text style={styles.jobSummaryText}>{quote.job_summary}</Text>
        </View>
      )}

      {/* Body: Line Items Table */}
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
              {item.description && (
                <Text style={{ color: '#666', fontSize: 9 }}>
                  {item.description}
                </Text>
              )}
            </View>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colRate}>${item.unit_price.toFixed(2)}</Text>
            <Text style={styles.colTotal}>
              ${(item.quantity * item.unit_price).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Footer: Totals */}
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

      {/* Footer: Notes */}
      {quote.notes && (
        <View style={styles.notesSection}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Notes / Terms:</Text>
          <Text>{quote.notes}</Text>
        </View>
      )}

      <Text style={styles.footer}>Thank you for your business!</Text>
    </Page>
  </Document>
)
