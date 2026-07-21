import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb, generateId, generateOrderNumber } from '@/lib/db';
import { CHECKLIST_STEPS } from '@/types';

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const company = searchParams.get('company') || '';

  let query = `
    SELECT o.*, cl.name as client_name, co.name as company_name, co.color as company_color,
      (SELECT step FROM checklist_items WHERE order_id = o.id AND completed = 0 ORDER BY rowid LIMIT 1) as current_step
    FROM orders o
    LEFT JOIN clients cl ON cl.id = o.client_id
    LEFT JOIN companies co ON co.id = o.company_id
    WHERE 1=1
  `;
  const args: string[] = [];
  if (search) { query += ` AND (o.number LIKE ? OR cl.name LIKE ?)`; args.push(`%${search}%`, `%${search}%`); }
  if (status) { query += ` AND o.status = ?`; args.push(status); }
  if (company) { query += ` AND o.company_id = ?`; args.push(company); }
  query += ` ORDER BY o.created_at DESC`;

  const orders = db.prepare(query).all(...args);
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  try {
    const body = await req.json();
    const { client_id, company_id, expected_date, payment_method, notes, products } = body;
    if (!client_id || !company_id || !expected_date) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }
    const db = getDb();
    const id = generateId();
    const number = generateOrderNumber(db);
    const total = (products || []).reduce((s: number, p: { total_value?: number; quantity?: number; unit_value?: number }) =>
      s + (p.total_value || (p.quantity || 0) * (p.unit_value || 0)), 0);

    db.prepare(`
      INSERT INTO orders (id, number, client_id, company_id, expected_date, payment_method, total_value, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, number, client_id, company_id, expected_date, payment_method||null, total, notes||null);

    if (products?.length) {
      const insertProduct = db.prepare(`
        INSERT INTO products (id, order_id, name, reference, color, size, quantity, unit_value, total_value, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of products) {
        insertProduct.run(generateId(), id, p.name, p.reference||null, p.color||null, p.size||null,
          p.quantity||1, p.unit_value||0, (p.quantity||1)*(p.unit_value||0), p.notes||null);
      }
    }

    const insertChecklist = db.prepare(`INSERT INTO checklist_items (id, order_id, step) VALUES (?, ?, ?)`);
    for (const step of CHECKLIST_STEPS) {
      insertChecklist.run(generateId(), id, step);
    }

    db.prepare(`INSERT INTO history (id, order_id, user_id, action, description) VALUES (?, ?, ?, ?, ?)`)
      .run(generateId(), id, payload.id, 'pedido_criado', `Pedido ${number} criado`);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 });
  }
}
