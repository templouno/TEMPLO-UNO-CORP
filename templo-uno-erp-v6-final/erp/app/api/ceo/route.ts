import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
export async function GET(req: NextRequest) {
  if (!getUserFromRequest(req)) return NextResponse.json({error:'Não autorizado'},{status:401});
  const db=getDb(); const now=new Date();
  const mS=new Date(now.getFullYear(),now.getMonth(),1).toISOString();
  const pmS=new Date(now.getFullYear(),now.getMonth()-1,1).toISOString();
  const g=(sql:string,...a:unknown[])=>(db.prepare(sql).get(...a) as Record<string,number>);
  const activeOrders=g("SELECT COUNT(*) as c FROM orders WHERE status!='entregue'").c;
  const don=g("SELECT COUNT(*) as c FROM orders WHERE status='entregue' AND delivery_date IS NOT NULL AND delivery_date<=expected_date").c;
  const dl=g("SELECT COUNT(*) as c FROM orders WHERE status='entregue' AND delivery_date IS NOT NULL AND delivery_date>expected_date").c;
  const tot=don+dl;
  const avg=(db.prepare("SELECT AVG(CAST((julianday(delivery_date)-julianday(entry_date)) AS REAL)) as avg FROM orders WHERE status='entregue' AND delivery_date IS NOT NULL").get() as {avg:number|null}).avg;
  const rc=g("SELECT COUNT(*) as c FROM (SELECT client_id FROM orders GROUP BY client_id HAVING COUNT(*)>1)").c;
  const cmr=g("SELECT COALESCE(SUM(total_value),0) as c FROM orders WHERE created_at>=?",mS).c;
  const pmr=g("SELECT COALESCE(SUM(total_value),0) as c FROM orders WHERE created_at>=? AND created_at<?",pmS,mS).c;
  const cmo=g("SELECT COUNT(*) as c FROM orders WHERE created_at>=?",mS).c;
  const pmo=g("SELECT COUNT(*) as c FROM orders WHERE created_at>=? AND created_at<?",pmS,mS).c;
  const topClients=db.prepare("SELECT cl.name,cl.id,COUNT(o.id) as order_count,COALESCE(SUM(o.total_value),0) as total_revenue FROM clients cl JOIN orders o ON o.client_id=cl.id GROUP BY cl.id ORDER BY total_revenue DESC LIMIT 8").all();
  const topProducts=db.prepare("SELECT name,SUM(quantity) as total_qty,COUNT(*) as appearances,COALESCE(SUM(total_value),0) as total_revenue FROM products GROUP BY name ORDER BY total_qty DESC LIMIT 8").all();
  const companyPerf=db.prepare("SELECT co.name,co.color,COUNT(o.id) as orders,COALESCE(SUM(o.total_value),0) as revenue,COALESCE(AVG(o.total_value),0) as avg_ticket,SUM(CASE WHEN o.status='entregue' THEN 1 ELSE 0 END) as delivered,SUM(CASE WHEN o.status='atrasado' THEN 1 ELSE 0 END) as delayed FROM companies co LEFT JOIN orders o ON o.company_id=co.id GROUP BY co.id ORDER BY revenue DESC").all();
  const bottleneck=db.prepare("SELECT step,COUNT(*) as pending_count FROM checklist_items WHERE completed=0 GROUP BY step ORDER BY pending_count DESC LIMIT 6").all();
  const trend=db.prepare("SELECT strftime('%Y-%m',created_at) as month,COUNT(*) as orders,COALESCE(SUM(total_value),0) as revenue,SUM(CASE WHEN status='entregue' AND delivery_date<=expected_date THEN 1 ELSE 0 END) as on_time,SUM(CASE WHEN status='entregue' THEN 1 ELSE 0 END) as total_done FROM orders WHERE created_at>=datetime('now','-12 months') GROUP BY month ORDER BY month ASC").all();
  return NextResponse.json({kpis:{activeOrders,onTimeRate:tot>0?Math.round((don/tot)*100):0,deliveredOnTime:don,deliveredLate:dl,avgProductionDays:avg?Math.round(avg):0,recurringClients:rc,currentMonthRev:cmr,prevMonthRev:pmr,currentMonthOrders:cmo,prevMonthOrders:pmo},topClients,topProducts,companyPerf,bottleneck,trend});
}
