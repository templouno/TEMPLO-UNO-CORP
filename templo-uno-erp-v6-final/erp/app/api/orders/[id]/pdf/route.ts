import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import { OrderPDFDocument } from '@/components/OrderPDF';
import React from 'react';
import type { DocumentProps } from '@react-pdf/renderer';
export async function GET(req: NextRequest, {params}:{params:Promise<{id:string}>}) {
  const p=getUserFromRequest(req); if (!p) return NextResponse.json({error:'Não autorizado'},{status:401});
  const {id}=await params; const db=getDb();
  const order=db.prepare(`SELECT o.*,cl.name as client_name,cl.phone as client_phone,cl.email as client_email,cl.city as client_city,cl.state as client_state,cl.cpf_cnpj as client_cpf_cnpj,co.name as company_name,co.color as company_color FROM orders o LEFT JOIN clients cl ON cl.id=o.client_id LEFT JOIN companies co ON co.id=o.company_id WHERE o.id=?`).get(id) as Record<string,unknown>|undefined;
  if (!order) return NextResponse.json({error:'Não encontrado'},{status:404});
  const products=db.prepare('SELECT * FROM products WHERE order_id=?').all(id);
  const checklist=db.prepare('SELECT ci.*,u.name as user_name FROM checklist_items ci LEFT JOIN users u ON u.id=ci.user_id WHERE ci.order_id=? ORDER BY ci.rowid').all(id);
  const payments=db.prepare('SELECT * FROM payments WHERE order_id=? ORDER BY paid_at DESC').all(id);
  const el=React.createElement(OrderPDFDocument,{order:{...order,products,checklist,payments} as never}) as unknown as React.ReactElement<DocumentProps>;
  const buf=await renderToBuffer(el);
  return new NextResponse(buf as unknown as BodyInit,{headers:{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="pedido-${order.number}.pdf"`}});
}
