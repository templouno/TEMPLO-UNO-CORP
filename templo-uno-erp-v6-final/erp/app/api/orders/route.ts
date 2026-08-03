import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb, genId, genOrderNumber } from '@/lib/db';
import { CHECKLIST_STEPS } from '@/types';
export async function GET(req: NextRequest) {
  const p=getUserFromRequest(req); if (!p) return NextResponse.json({error:'Não autorizado'},{status:401});
  const db=getDb(); const sp=new URL(req.url).searchParams;
  const search=sp.get('search')||''; const status=sp.get('status')||''; const company=sp.get('company')||'';
  let q=`SELECT o.*,cl.name as client_name,co.name as company_name,co.color as company_color,(SELECT step FROM checklist_items WHERE order_id=o.id AND completed=0 ORDER BY rowid LIMIT 1) as current_step FROM orders o LEFT JOIN clients cl ON cl.id=o.client_id LEFT JOIN companies co ON co.id=o.company_id WHERE 1=1`;
  const args:string[]=[];
  if (search){q+=` AND (o.number LIKE ? OR cl.name LIKE ?)`;args.push(`%${search}%`,`%${search}%`);}
  if (status){q+=` AND o.status=?`;args.push(status);}
  if (company){q+=` AND o.company_id=?`;args.push(company);}
  q+=` ORDER BY o.created_at DESC`;
  return NextResponse.json(db.prepare(q).all(...args));
}
export async function POST(req: NextRequest) {
  const p=getUserFromRequest(req); if (!p) return NextResponse.json({error:'Não autorizado'},{status:401});
  try {
    const {client_id,company_id,expected_date,payment_method,notes,products}=await req.json();
    if (!client_id||!company_id||!expected_date) return NextResponse.json({error:'Campos obrigatórios faltando'},{status:400});
    const db=getDb(); const id=genId(); const number=genOrderNumber(db);
    const total=(products||[]).reduce((s:number,p:{quantity?:number;unit_value?:number;total_value?:number})=>s+(p.total_value||(p.quantity||0)*(p.unit_value||0)),0);
    db.prepare('INSERT INTO orders (id,number,client_id,company_id,expected_date,payment_method,total_value,notes) VALUES (?,?,?,?,?,?,?,?)').run(id,number,client_id,company_id,expected_date,payment_method||null,total,notes||null);
    if (products?.length) {
      const ins=db.prepare('INSERT INTO products (id,order_id,name,reference,color,size,quantity,unit_value,total_value,notes) VALUES (?,?,?,?,?,?,?,?,?,?)');
      for (const pr of products) ins.run(genId(),id,pr.name,pr.reference||null,pr.color||null,pr.size||null,pr.quantity||1,pr.unit_value||0,(pr.quantity||1)*(pr.unit_value||0),pr.notes||null);
    }
    const insCk=db.prepare('INSERT INTO checklist_items (id,order_id,step) VALUES (?,?,?)');
    for (const step of CHECKLIST_STEPS) insCk.run(genId(),id,step);
    db.prepare('INSERT INTO history (id,order_id,user_id,action,description) VALUES (?,?,?,?,?)').run(genId(),id,p.id,'pedido_criado',`Pedido ${number} criado`);
    return NextResponse.json(db.prepare('SELECT * FROM orders WHERE id=?').get(id),{status:201});
  } catch(e) { console.error(e); return NextResponse.json({error:'Erro ao criar pedido'},{status:500}); }
}
