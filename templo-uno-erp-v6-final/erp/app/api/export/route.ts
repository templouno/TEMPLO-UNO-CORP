import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
function toCSV(rows: Record<string,unknown>[], headers:{key:string;label:string}[]) {
  const head=headers.map(h=>h.label).join(',');
  const body=rows.map(r=>headers.map(h=>{const v=r[h.key];if(v==null)return '';const s=String(v);return s.includes(',')||s.includes('"')||s.includes('\n')?`"${s.replace(/"/g,'""')}"`:s;}).join(',')).join('\n');
  return `\uFEFF${head}\n${body}`;
}
export async function GET(req: NextRequest) {
  const p=getUserFromRequest(req); if (!p) return NextResponse.json({error:'Não autorizado'},{status:401});
  const sp=new URL(req.url).searchParams;
  const type=sp.get('type')||'orders';
  const db=getDb();
  const fmtD=(d:string|null)=>d?new Date(d).toLocaleDateString('pt-BR'):'';
  const fmtC=(v:number|null)=>v!=null?Number(v).toFixed(2).replace('.',','):'0,00';
  let csv=''; let filename='';
  if (type==='orders') {
    const rows=db.prepare(`SELECT o.number,cl.name as cliente,co.name as empresa,o.entry_date,o.expected_date,o.delivery_date,o.status,o.payment_status,o.payment_method,o.total_value,o.received_value,(o.total_value-o.received_value) as pending_value,o.notes FROM orders o LEFT JOIN clients cl ON cl.id=o.client_id LEFT JOIN companies co ON co.id=o.company_id ORDER BY o.created_at DESC`).all() as Record<string,unknown>[];
    const headers=[{key:'number',label:'Pedido'},{key:'cliente',label:'Cliente'},{key:'empresa',label:'Empresa'},{key:'entry_date',label:'Entrada'},{key:'expected_date',label:'Previsão'},{key:'delivery_date',label:'Entrega'},{key:'status',label:'Status'},{key:'payment_status',label:'Pagamento'},{key:'payment_method',label:'Método'},{key:'total_value',label:'Total'},{key:'received_value',label:'Recebido'},{key:'pending_value',label:'Pendente'},{key:'notes',label:'Obs'}];
    csv=toCSV(rows.map(r=>({...r,entry_date:fmtD(r.entry_date as string),expected_date:fmtD(r.expected_date as string),delivery_date:fmtD(r.delivery_date as string),total_value:fmtC(r.total_value as number),received_value:fmtC(r.received_value as number),pending_value:fmtC(r.pending_value as number)})),headers);
    filename=`pedidos-${new Date().toISOString().split('T')[0]}.csv`;
  } else if (type==='clients') {
    const rows=db.prepare(`SELECT cl.name,cl.phone,cl.email,cl.cpf_cnpj,cl.city,cl.state,co.name as empresa,COUNT(o.id) as total_pedidos,COALESCE(SUM(o.total_value),0) as total_gasto,cl.created_at FROM clients cl LEFT JOIN companies co ON co.id=cl.company_id LEFT JOIN orders o ON o.client_id=cl.id GROUP BY cl.id ORDER BY total_gasto DESC`).all() as Record<string,unknown>[];
    const headers=[{key:'name',label:'Nome'},{key:'phone',label:'Telefone'},{key:'email',label:'Email'},{key:'cpf_cnpj',label:'CPF/CNPJ'},{key:'city',label:'Cidade'},{key:'state',label:'Estado'},{key:'empresa',label:'Empresa'},{key:'total_pedidos',label:'Pedidos'},{key:'total_gasto',label:'Total Gasto'},{key:'created_at',label:'Cadastrado'}];
    csv=toCSV(rows.map(r=>({...r,total_gasto:fmtC(r.total_gasto as number),created_at:fmtD(r.created_at as string)})),headers);
    filename=`clientes-${new Date().toISOString().split('T')[0]}.csv`;
  }
  return new NextResponse(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${filename}"`}});
}
