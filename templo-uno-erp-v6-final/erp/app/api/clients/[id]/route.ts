import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb, genId } from '@/lib/db';
export async function GET(req: NextRequest, {params}:{params:Promise<{id:string}>}) {
  const p=getUserFromRequest(req); if (!p) return NextResponse.json({error:'Não autorizado'},{status:401});
  const {id}=await params; const db=getDb();
  const client=db.prepare(`SELECT cl.*,co.name as company_name FROM clients cl LEFT JOIN companies co ON co.id=cl.company_id WHERE cl.id=?`).get(id);
  if (!client) return NextResponse.json({error:'Não encontrado'},{status:404});
  const orders=db.prepare(`SELECT o.*,co.name as company_name,co.color as company_color FROM orders o LEFT JOIN companies co ON co.id=o.company_id WHERE o.client_id=? ORDER BY o.created_at DESC`).all(id);
  return NextResponse.json({...(client as object),orders});
}
export async function PUT(req: NextRequest, {params}:{params:Promise<{id:string}>}) {
  const p=getUserFromRequest(req); if (!p) return NextResponse.json({error:'Não autorizado'},{status:401});
  const {id}=await params;
  try {
    const {name,phone,email,cpf_cnpj,city,state,notes,company_id}=await req.json(); const db=getDb();
    db.prepare(`UPDATE clients SET name=?,phone=?,email=?,cpf_cnpj=?,city=?,state=?,notes=?,company_id=?,updated_at=datetime('now') WHERE id=?`).run(name,phone||null,email||null,cpf_cnpj||null,city||null,state||null,notes||null,company_id||null,id);
    db.prepare('INSERT INTO history (id,client_id,user_id,action,description) VALUES (?,?,?,?,?)').run(genId(),id,p.id,'cliente_editado','Cliente atualizado');
    return NextResponse.json(db.prepare('SELECT * FROM clients WHERE id=?').get(id));
  } catch { return NextResponse.json({error:'Erro'},{status:500}); }
}
export async function DELETE(req: NextRequest, {params}:{params:Promise<{id:string}>}) {
  const p=getUserFromRequest(req); if (!p) return NextResponse.json({error:'Não autorizado'},{status:401});
  const {id}=await params;
  getDb().prepare('DELETE FROM clients WHERE id=?').run(id);
  return NextResponse.json({ok:true});
}
