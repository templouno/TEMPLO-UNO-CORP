import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb, genId } from '@/lib/db';
export async function POST(req: NextRequest, {params}:{params:Promise<{id:string}>}) {
  const p=getUserFromRequest(req); if (!p) return NextResponse.json({error:'Não autorizado'},{status:401});
  const {id}=await params;
  try {
    const {amount,method,notes}=await req.json(); const db=getDb();
    db.prepare('INSERT INTO payments (id,order_id,amount,method,notes) VALUES (?,?,?,?,?)').run(genId(),id,amount,method,notes||null);
    const order=db.prepare('SELECT * FROM orders WHERE id=?').get(id) as {received_value:number;total_value:number};
    const newRec=(order.received_value||0)+amount;
    const newSt=newRec>=order.total_value?'pago':'parcial';
    db.prepare(`UPDATE orders SET received_value=?,payment_status=?,updated_at=datetime('now') WHERE id=?`).run(newRec,newSt,id);
    db.prepare('INSERT INTO history (id,order_id,user_id,action,description) VALUES (?,?,?,?,?)').run(genId(),id,p.id,'pagamento_registrado',`Pagamento de R$ ${amount.toFixed(2)} registrado`);
    return NextResponse.json({ok:true});
  } catch { return NextResponse.json({error:'Erro'},{status:500}); }
}
