import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';

function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(rows: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const head = headers.map(h => h.label).join(',');
  const body = rows.map(row =>
    headers.map(h => escapeCSV(row[h.key])).join(',')
  ).join('\n');
  return `\uFEFF${head}\n${body}`; // BOM for Excel UTF-8
}

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'orders';
  const format = searchParams.get('format') || 'csv';

  const db = getDb();
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '';
  const fmtCur = (v: number | null) => v != null ? Number(v).toFixed(2).replace('.', ',') : '0,00';

  let csv = '';
  let filename = '';

  if (type === 'orders') {
    const rows = db.prepare(`
      SELECT o.number, cl.name as cliente, co.name as empresa,
        o.entry_date, o.expected_date, o.delivery_date,
        o.status, o.payment_status, o.payment_method,
        o.total_value, o.received_value,
        (o.total_value - o.received_value) as pending_value,
        o.notes
      FROM orders o
      LEFT JOIN clients cl ON cl.id = o.client_id
      LEFT JOIN companies co ON co.id = o.company_id
      ORDER BY o.created_at DESC
    `).all() as Record<string, unknown>[];

    const headers = [
      { key: 'number', label: 'Pedido' },
      { key: 'cliente', label: 'Cliente' },
      { key: 'empresa', label: 'Empresa' },
      { key: 'entry_date', label: 'Entrada' },
      { key: 'expected_date', label: 'Previsão Entrega' },
      { key: 'delivery_date', label: 'Entrega Real' },
      { key: 'status', label: 'Status' },
      { key: 'payment_status', label: 'Pagamento' },
      { key: 'payment_method', label: 'Forma Pagamento' },
      { key: 'total_value', label: 'Valor Total (R$)' },
      { key: 'received_value', label: 'Recebido (R$)' },
      { key: 'pending_value', label: 'Pendente (R$)' },
      { key: 'notes', label: 'Observações' },
    ];

    const mapped = rows.map(r => ({
      ...r,
      entry_date: fmtDate(r.entry_date as string),
      expected_date: fmtDate(r.expected_date as string),
      delivery_date: fmtDate(r.delivery_date as string),
      total_value: fmtCur(r.total_value as number),
      received_value: fmtCur(r.received_value as number),
      pending_value: fmtCur(r.pending_value as number),
      status: r.status === 'producao' ? 'Em Produção' : r.status === 'entregue' ? 'Entregue' : 'Atrasado',
      payment_status: r.payment_status === 'pago' ? 'Pago' : r.payment_status === 'parcial' ? 'Parcial' : 'Pendente',
    }));

    csv = toCSV(mapped, headers);
    filename = `pedidos-${new Date().toISOString().split('T')[0]}.csv`;

  } else if (type === 'clients') {
    const rows = db.prepare(`
      SELECT cl.name, cl.phone, cl.email, cl.cpf_cnpj,
        cl.city, cl.state, co.name as empresa,
        COUNT(o.id) as total_pedidos,
        COALESCE(SUM(o.total_value), 0) as total_gasto,
        cl.created_at
      FROM clients cl
      LEFT JOIN companies co ON co.id = cl.company_id
      LEFT JOIN orders o ON o.client_id = cl.id
      GROUP BY cl.id
      ORDER BY total_gasto DESC
    `).all() as Record<string, unknown>[];

    const headers = [
      { key: 'name', label: 'Nome' },
      { key: 'phone', label: 'Telefone' },
      { key: 'email', label: 'Email' },
      { key: 'cpf_cnpj', label: 'CPF/CNPJ' },
      { key: 'city', label: 'Cidade' },
      { key: 'state', label: 'Estado' },
      { key: 'empresa', label: 'Empresa' },
      { key: 'total_pedidos', label: 'Total Pedidos' },
      { key: 'total_gasto', label: 'Total Gasto (R$)' },
      { key: 'created_at', label: 'Cadastrado em' },
    ];

    const mapped = rows.map(r => ({
      ...r,
      total_gasto: fmtCur(r.total_gasto as number),
      created_at: fmtDate(r.created_at as string),
    }));

    csv = toCSV(mapped, headers);
    filename = `clientes-${new Date().toISOString().split('T')[0]}.csv`;

  } else if (type === 'financeiro') {
    const rows = db.prepare(`
      SELECT o.number as pedido, cl.name as cliente, co.name as empresa,
        o.total_value, o.received_value,
        (o.total_value - o.received_value) as pendente,
        o.payment_status, o.payment_method,
        p.amount as pagamento_valor, p.method as pagamento_metodo, p.paid_at as pagamento_data
      FROM orders o
      LEFT JOIN clients cl ON cl.id = o.client_id
      LEFT JOIN companies co ON co.id = o.company_id
      LEFT JOIN payments p ON p.order_id = o.id
      ORDER BY o.created_at DESC, p.paid_at DESC
    `).all() as Record<string, unknown>[];

    const headers = [
      { key: 'pedido', label: 'Pedido' },
      { key: 'cliente', label: 'Cliente' },
      { key: 'empresa', label: 'Empresa' },
      { key: 'total_value', label: 'Total (R$)' },
      { key: 'received_value', label: 'Recebido (R$)' },
      { key: 'pendente', label: 'Pendente (R$)' },
      { key: 'payment_status', label: 'Status' },
      { key: 'payment_method', label: 'Método' },
      { key: 'pagamento_valor', label: 'Valor Pago (R$)' },
      { key: 'pagamento_metodo', label: 'Método Pago' },
      { key: 'pagamento_data', label: 'Data Pagamento' },
    ];

    const mapped = rows.map(r => ({
      ...r,
      total_value: fmtCur(r.total_value as number),
      received_value: fmtCur(r.received_value as number),
      pendente: fmtCur(r.pendente as number),
      pagamento_valor: fmtCur(r.pagamento_valor as number),
      pagamento_data: fmtDate(r.pagamento_data as string),
    }));

    csv = toCSV(mapped, headers);
    filename = `financeiro-${new Date().toISOString().split('T')[0]}.csv`;
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
