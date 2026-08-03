import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb, genId } from '@/lib/db';
export async function GET(req: NextRequest) {
  const p = getUserFromRequest(req);
  if (!p) return NextResponse.json({error:'Não autorizado'},{status:401});
  const s = new URL(req.url).searchParams.get('search')||'';
  const clients = getDb().prepare(`SELECT cl.*,co.name as company_name,co.color as company_color,COUNT(o.id) as order_count,COALESCE(SUM(o.total_value),0) as total_spent FROM clients cl LEFT JOIN companies co ON co.id=cl.company_id LEFT JOIN orders o ON o.client_id=cl.id WHERE cl.name LIKE ? OR cl.email LIKE ? OR cl.phone LIKE ? GROUP BY cl.id ORDER BY cl.name`).all(`%${s}%`,`%${s}%`,`%${s}%`);
  return NextResponse.json(clients);
}
export async function POST(req: NextRequest) {
  const p = getUserFromRequest(req);
  if (!p) return NextResponse.json({error:'Não autorizado'},{status:401});
  try {
    const {name,phone,email,cpf_cnpj,city,state,notes,company_id}=await req.json();
    if (!name) return NextResponse.json({error:'Nome obrigatório'},{status:400});
    const db=getDb(); const id=genId();
    db.prepare('INSERT INTO clients (id,name,phone,email,cpf_cnpj,city,state,notes,company_id) VALUES (?,?,?,?,?,?,?,?,?)').run(id,name,phone||null,email||null,cpf_cnpj||null,city||null,state||null,notes||null,company_id||null);
    db.prepare('INSERT INTO history (id,client_id,user_id,action,description) VALUES (?,?,?,?,?)').run(genId(),id,p.id,'cliente_criado',`Cliente "${name}" cadastrado`);
    return NextResponse.json(db.prepare('SELECT * FROM clients WHERE id=?').get(id),{status:201});
  } catch(e) { return NextResponse.json({error:'Erro ao criar'},{status:500}); }
}
