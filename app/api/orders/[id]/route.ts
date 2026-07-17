import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb, generateId } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const order = db.prepare(`
    SELECT o.*, cl.name as client_name, cl.phone as client_phone, cl.email as client_email,
      co.name as company_name, co.color as company_color
    FROM orders o
    LEFT JOIN clients cl ON cl.id = o.client_id
    LEFT JOIN companies co ON co.id = o.company_id
    WHERE o.id = ?
  `).get(id);
  if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  const products = db.prepare('SELECT * FROM products WHERE order_id = ?').all(id);
  const checklist = db.prepare(`
    SELECT ci.*, u.name as user_name FROM checklist_items ci
    LEFT JOIN users u ON u.id = ci.user_id
    WHERE ci.order_id = ? ORDER BY ci.rowid
  `).all(id);
  const payments = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY paid_at DESC').all(id);
  const history = db.prepare(`
    SELECT h.*, u.name as user_name FROM history h
    LEFT JOIN users u ON u.id = h.user_id
    WHERE h.order_id = ? ORDER BY h.created_at DESC
  `).all(id);
  return NextResponse.json({ ...(order as object), products, checklist, payments, history });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    const body = await req.json();
    const { status, payment_status, payment_method, expected_date, delivery_date, notes, received_value } = body;
    const db = getDb();
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as { status: string; number: string } | undefined;
    if (!existing) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    db.prepare(`
      UPDATE orders SET status=?, payment_status=?, payment_method=?, expected_date=?,
        delivery_date=?, notes=?, received_value=?, updated_at=datetime('now')
      WHERE id=?
    `).run(status, payment_status, payment_method||null, expected_date, delivery_date||null, notes||null, received_value||0, id);
    if (status !== existing.status) {
      db.prepare(`INSERT INTO history (id, order_id, user_id, action, description) VALUES (?, ?, ?, ?, ?)`)
        .run(generateId(), id, payload.id, 'status_alterado', `Status alterado para "${status}"`);
    }
    return NextResponse.json(db.prepare('SELECT * FROM orders WHERE id = ?').get(id));
  } catch { return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
