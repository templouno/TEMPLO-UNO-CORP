import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
export async function GET(req: NextRequest) {
  if (!getUserFromRequest(req)) return NextResponse.json({error:'Não autorizado'},{status:401});
  const db = getDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(),now.getMonth(),1).toISOString();
  const today = now.toISOString().split('T')[0];
  const nextWeek = new Date(now.getTime()+7*864e5).toISOString().split('T')[0];
  const g = (sql: string, ...a: unknown[]) => (db.prepare(sql).get(...a) as Record<string,number>);
  const stats = {
    total_clients: g('SELECT COUNT(*) as c FROM clients').c,
    active_orders: g("SELECT COUNT(*) as c FROM orders WHERE status!='entregue'").c,
    in_production: g("SELECT COUNT(*) as c FROM orders WHERE status='producao'").c,
    delivered: g("SELECT COUNT(*) as c FROM orders WHERE status='entregue'").c,
    delayed: g("SELECT COUNT(*) as c FROM orders WHERE status='atrasado'").c,
    month_revenue: g('SELECT COALESCE(SUM(received_value),0) as c FROM orders WHERE created_at>=?',monthStart).c,
    pending_value: g("SELECT COALESCE(SUM(total_value-received_value),0) as c FROM orders WHERE payment_status!='pago'").c,
    average_ticket: g('SELECT COALESCE(AVG(total_value),0) as c FROM orders WHERE total_value>0').c,
    total_billed: g('SELECT COALESCE(SUM(total_value),0) as c FROM orders').c,
    week_deliveries: g('SELECT COUNT(*) as c FROM orders WHERE expected_date>=? AND expected_date<=?',today,nextWeek).c,
  };
  const ordersPerMonth = db.prepare(`SELECT strftime('%Y-%m',created_at) as month, COUNT(*) as count, COALESCE(SUM(total_value),0) as revenue FROM orders WHERE created_at>=datetime('now','-6 months') GROUP BY month ORDER BY month`).all();
  const byCompany = db.prepare(`SELECT c.name,c.color,COUNT(o.id) as count,COALESCE(SUM(o.total_value),0) as revenue FROM companies c LEFT JOIN orders o ON o.company_id=c.id GROUP BY c.id`).all();
  const byStatus = db.prepare(`SELECT status,COUNT(*) as count FROM orders GROUP BY status`).all();
  return NextResponse.json({stats,ordersPerMonth,byCompany,byStatus});
}
