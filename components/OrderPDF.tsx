import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font
} from '@react-pdf/renderer';

// Types
interface Product { name: string; reference?: string; color?: string; size?: string; quantity: number; unit_value: number; total_value: number; }
interface ChecklistItem { step: string; completed: boolean; completed_at?: string; user_name?: string; }
interface Payment { amount: number; method: string; paid_at: string; }
interface OrderData {
  number: string; notes?: string;
  client_name?: string; client_phone?: string; client_email?: string;
  client_city?: string; client_state?: string; client_cpf_cnpj?: string;
  company_name?: string; company_color?: string;
  entry_date: string; expected_date: string; delivery_date?: string;
  status: string; payment_status: string; payment_method?: string;
  total_value: number; received_value: number;
  products?: Product[]; checklist?: ChecklistItem[]; payments?: Payment[];
}

// Helpers
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const fmtDate = (d?: string) => {
  if (!d) return '-';
  try { return new Intl.DateTimeFormat('pt-BR').format(new Date(d)); } catch { return d; }
};

const STATUS_LABELS: Record<string, string> = {
  producao: 'Em Produção', entregue: 'Entregue', atrasado: 'Atrasado',
};
const PAYMENT_LABELS: Record<string, string> = {
  pago: 'Pago', pendente: 'Pendente', parcial: 'Parcial',
};
const METHOD_LABELS: Record<string, string> = {
  pix: 'PIX', transferencia: 'Transferência', dinheiro: 'Dinheiro', cartao: 'Cartão', boleto: 'Boleto',
};
const STATUS_COLORS: Record<string, string> = {
  producao: '#D97706', entregue: '#16A34A', atrasado: '#DC2626',
};
const PAY_COLORS: Record<string, string> = {
  pago: '#16A34A', pendente: '#DC2626', parcial: '#D97706',
};

// Styles
const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: '#1a1a1a', backgroundColor: '#ffffff', paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40 },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: '#f0f0f0' },
  logoBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoSquare: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#000000' },
  companyName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#111111' },
  companyTagline: { fontSize: 8, color: '#888888', marginTop: 2 },
  orderBox: { alignItems: 'flex-end' },
  orderNumber: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#111111', letterSpacing: 0.5 },
  orderSub: { fontSize: 8, color: '#888888', marginTop: 2 },
  // Badges
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  // Section
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#888888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  gridItem: { width: '50%', marginBottom: 10 },
  gridLabel: { fontSize: 7, color: '#888888', marginBottom: 2 },
  gridValue: { fontSize: 9, color: '#111111', fontFamily: 'Helvetica-Bold' },
  // Table
  table: { borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 6, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8f8f8', paddingVertical: 7, paddingHorizontal: 10 },
  tableHeaderCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#666666', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  tableRowAlt: { backgroundColor: '#fafafa' },
  tableCell: { fontSize: 8.5, color: '#222222' },
  // Financial
  finBox: { borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 6, overflow: 'hidden' },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  finRowFirst: { borderTopWidth: 0 },
  finLabel: { fontSize: 8.5, color: '#555555' },
  finValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#111111' },
  finTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, paddingHorizontal: 14, backgroundColor: '#111111' },
  finTotalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  finTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  // Checklist
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  checkItem: { width: '23%', padding: 8, borderRadius: 5, borderWidth: 1, alignItems: 'center' },
  checkStep: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', marginTop: 4, textAlign: 'center' },
  checkDate: { fontSize: 6, color: '#888888', marginTop: 2, textAlign: 'center' },
  checkDot: { width: 10, height: 10, borderRadius: 5 },
  // Notes
  notesBox: { backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 6, padding: 12 },
  notesText: { fontSize: 8.5, color: '#444444', lineHeight: 1.5 },
  // Footer
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e8e8e8' },
  footerText: { fontSize: 7, color: '#aaaaaa' },
  pageNum: { fontSize: 7, color: '#aaaaaa' },
  // Divider
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 16 },
});

// Column widths for products table
const COL = { name: '30%', ref: '12%', color: '11%', size: '10%', qty: '9%', unit: '14%', total: '14%' };

export function OrderPDFDocument({ order }: { order: OrderData }) {
  const products = order.products || [];
  const checklist = order.checklist || [];
  const payments = order.payments || [];
  const statusColor = STATUS_COLORS[order.status] || '#666666';
  const payColor = PAY_COLORS[order.payment_status] || '#666666';
  const compColor = order.company_color || '#EAB308';
  const pending = (order.total_value || 0) - (order.received_value || 0);
  const now = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());

  return (
    <Document title={`Pedido ${order.number}`} author="Templo Uno Corp ERP">
      <Page size="A4" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <View style={[s.logoSquare, { backgroundColor: compColor }]}>
              <Text style={s.logoText}>TU</Text>
            </View>
            <View>
              <Text style={s.companyName}>{order.company_name || 'Templo Uno'}</Text>
              <Text style={s.companyTagline}>Templo Uno Corp · ERP</Text>
            </View>
          </View>
          <View style={s.orderBox}>
            <Text style={s.orderNumber}>{order.number}</Text>
            <Text style={s.orderSub}>Ordem de Serviço</Text>
            <View style={s.badgeRow}>
              <View style={[s.badge, { backgroundColor: `${statusColor}20`, color: statusColor, borderWidth: 0.5, borderColor: statusColor }]}>
                <Text style={{ color: statusColor, fontSize: 7, fontFamily: 'Helvetica-Bold' }}>
                  {STATUS_LABELS[order.status] || order.status}
                </Text>
              </View>
              <View style={[s.badge, { backgroundColor: `${payColor}20` }]}>
                <Text style={{ color: payColor, fontSize: 7, fontFamily: 'Helvetica-Bold' }}>
                  {PAYMENT_LABELS[order.payment_status] || order.payment_status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CLIENT + DATES */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Dados do Pedido</Text>
          <View style={s.grid}>
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Cliente</Text>
              <Text style={s.gridValue}>{order.client_name || '-'}</Text>
            </View>
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Empresa</Text>
              <Text style={[s.gridValue, { color: compColor }]}>{order.company_name || '-'}</Text>
            </View>
            {order.client_phone && (
              <View style={s.gridItem}>
                <Text style={s.gridLabel}>Telefone</Text>
                <Text style={s.gridValue}>{order.client_phone}</Text>
              </View>
            )}
            {order.client_email && (
              <View style={s.gridItem}>
                <Text style={s.gridLabel}>Email</Text>
                <Text style={s.gridValue}>{order.client_email}</Text>
              </View>
            )}
            {(order.client_city || order.client_state) && (
              <View style={s.gridItem}>
                <Text style={s.gridLabel}>Cidade</Text>
                <Text style={s.gridValue}>{[order.client_city, order.client_state].filter(Boolean).join(', ')}</Text>
              </View>
            )}
            {order.client_cpf_cnpj && (
              <View style={s.gridItem}>
                <Text style={s.gridLabel}>CPF / CNPJ</Text>
                <Text style={s.gridValue}>{order.client_cpf_cnpj}</Text>
              </View>
            )}
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Data de Entrada</Text>
              <Text style={s.gridValue}>{fmtDate(order.entry_date)}</Text>
            </View>
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Previsão de Entrega</Text>
              <Text style={s.gridValue}>{fmtDate(order.expected_date)}</Text>
            </View>
            {order.delivery_date && (
              <View style={s.gridItem}>
                <Text style={s.gridLabel}>Entregue em</Text>
                <Text style={s.gridValue}>{fmtDate(order.delivery_date)}</Text>
              </View>
            )}
            <View style={s.gridItem}>
              <Text style={s.gridLabel}>Forma de Pagamento</Text>
              <Text style={s.gridValue}>{order.payment_method ? (METHOD_LABELS[order.payment_method] || order.payment_method) : '-'}</Text>
            </View>
          </View>
        </View>

        {/* PRODUCTS TABLE */}
        {products.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Produtos ({products.length} {products.length === 1 ? 'item' : 'itens'})</Text>
            <View style={s.table}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { width: COL.name }]}>Produto</Text>
                <Text style={[s.tableHeaderCell, { width: COL.ref }]}>Ref</Text>
                <Text style={[s.tableHeaderCell, { width: COL.color }]}>Cor</Text>
                <Text style={[s.tableHeaderCell, { width: COL.size }]}>Tam</Text>
                <Text style={[s.tableHeaderCell, { width: COL.qty, textAlign: 'right' }]}>Qtd</Text>
                <Text style={[s.tableHeaderCell, { width: COL.unit, textAlign: 'right' }]}>Unit.</Text>
                <Text style={[s.tableHeaderCell, { width: COL.total, textAlign: 'right' }]}>Total</Text>
              </View>
              {products.map((p, i) => (
                <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableCell, { width: COL.name, fontFamily: 'Helvetica-Bold' }]}>{p.name}</Text>
                  <Text style={[s.tableCell, { width: COL.ref, color: '#666666' }]}>{p.reference || '-'}</Text>
                  <Text style={[s.tableCell, { width: COL.color, color: '#666666' }]}>{p.color || '-'}</Text>
                  <Text style={[s.tableCell, { width: COL.size, color: '#666666' }]}>{p.size || '-'}</Text>
                  <Text style={[s.tableCell, { width: COL.qty, textAlign: 'right' }]}>{p.quantity}</Text>
                  <Text style={[s.tableCell, { width: COL.unit, textAlign: 'right', color: '#555555' }]}>{fmtCurrency(p.unit_value)}</Text>
                  <Text style={[s.tableCell, { width: COL.total, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{fmtCurrency(p.total_value || p.quantity * p.unit_value)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* FINANCIAL */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Financeiro</Text>
          <View style={s.finBox}>
            <View style={[s.finRow, s.finRowFirst]}>
              <Text style={s.finLabel}>Subtotal dos Produtos</Text>
              <Text style={s.finValue}>{fmtCurrency(order.total_value)}</Text>
            </View>
            <View style={s.finRow}>
              <Text style={s.finLabel}>Valor Recebido</Text>
              <Text style={[s.finValue, { color: '#16A34A' }]}>{fmtCurrency(order.received_value)}</Text>
            </View>
            {payments.length > 0 && payments.map((pay, i) => (
              <View key={i} style={[s.finRow, { paddingLeft: 24 }]}>
                <Text style={[s.finLabel, { color: '#aaaaaa', fontSize: 7.5 }]}>
                  {fmtDate(pay.paid_at)} · {METHOD_LABELS[pay.method] || pay.method}
                </Text>
                <Text style={[s.finValue, { color: '#16A34A', fontSize: 7.5 }]}>{fmtCurrency(pay.amount)}</Text>
              </View>
            ))}
            <View style={s.finTotalRow}>
              <Text style={s.finTotalLabel}>Saldo Pendente</Text>
              <Text style={s.finTotalValue}>{fmtCurrency(pending)}</Text>
            </View>
          </View>
        </View>

        {/* CHECKLIST */}
        {checklist.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              Produção — {checklist.filter(c => c.completed).length}/{checklist.length} etapas concluídas
            </Text>
            <View style={s.checkGrid}>
              {checklist.map((item, i) => (
                <View key={i} style={[
                  s.checkItem,
                  {
                    backgroundColor: item.completed ? '#f0fdf4' : '#fafafa',
                    borderColor: item.completed ? '#86efac' : '#e8e8e8',
                  }
                ]}>
                  <View style={[s.checkDot, { backgroundColor: item.completed ? '#22C55E' : '#d1d5db' }]} />
                  <Text style={[s.checkStep, { color: item.completed ? '#15803d' : '#555555' }]}>{item.step}</Text>
                  {item.completed && item.completed_at && (
                    <Text style={s.checkDate}>{fmtDate(item.completed_at)}</Text>
                  )}
                  {item.completed && item.user_name && (
                    <Text style={s.checkDate}>{item.user_name}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* NOTES */}
        {order.notes && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Observações</Text>
            <View style={s.notesBox}>
              <Text style={s.notesText}>{order.notes}</Text>
            </View>
          </View>
        )}

        {/* FOOTER */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Templo Uno Corp ERP · {now}</Text>
          <Text style={s.pageNum} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}
