import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb, generateId } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    const { amount, method, notes } = await req.json();
    const db = getDb();
    db.prepare(`INSERT INTO payments (id, order_id, amount, method, notes) VALUES (?, ?, ?, ?, ?)`)
      .run(generateId(), id, amount, method, notes||null);
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as { received_value: number; total_value: number };
    const newReceived = (order.received_value || 0) + amount;
    const newStatus = newReceived >= order.total_value ? 'pago' : 'parcial';
    db.prepare(`UPDATE orders SET received_value=?, payment_status=?, updated_at=datetime('now') WHERE id=?`)
      .run(newReceived, newStatus, id);
    db.prepare(`INSERT INTO history (id, order_id, user_id, action, description) VALUES (?, ?, ?, ?, ?)`)
      .run(generateId(), id, payload.id, 'pagamento_registrado', `Pagamento de R$ ${amount.toFixed(2)} registrado`);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 }); }
}
