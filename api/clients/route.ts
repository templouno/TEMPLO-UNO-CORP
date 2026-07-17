import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb, generateId } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  
  const clients = db.prepare(`
    SELECT 
      cl.*,
      co.name as company_name,
      co.color as company_color,
      COUNT(o.id) as order_count,
      COALESCE(SUM(o.total_value), 0) as total_spent
    FROM clients cl
    LEFT JOIN companies co ON co.id = cl.company_id
    LEFT JOIN orders o ON o.client_id = cl.id
    WHERE cl.name LIKE ? OR cl.email LIKE ? OR cl.phone LIKE ?
    GROUP BY cl.id
    ORDER BY cl.name ASC
  `).all(`%${search}%`, `%${search}%`, `%${search}%`);
  
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  
  try {
    const body = await req.json();
    const { name, phone, email, cpf_cnpj, city, state, notes, company_id } = body;
    
    if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    
    const db = getDb();
    const id = generateId();
    
    db.prepare(`
      INSERT INTO clients (id, name, phone, email, cpf_cnpj, city, state, notes, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, phone || null, email || null, cpf_cnpj || null, city || null, state || null, notes || null, company_id || null);
    
    db.prepare(`
      INSERT INTO history (id, client_id, user_id, action, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(generateId(), id, payload.id, 'cliente_criado', `Cliente "${name}" cadastrado`);
    
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
  }
}
