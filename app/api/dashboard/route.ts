import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  
  const db = getDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const today = now.toISOString().split('T')[0];

  const stats = {
    total_clients: (db.prepare('SELECT COUNT(*) as c FROM clients').get() as { c: number }).c,
    active_orders: (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status != 'entregue'").get() as { c: number }).c,
    in_production: (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'producao'").get() as { c: number }).c,
    delivered: (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'entregue'").get() as { c: number }).c,
    delayed: (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'atrasado'").get() as { c: number }).c,
    month_revenue: ((db.prepare("SELECT COALESCE(SUM(received_value), 0) as v FROM orders WHERE created_at >= ?").get(monthStart) as { v: number }).v),
    pending_value: ((db.prepare("SELECT COALESCE(SUM(total_value - received_value), 0) as v FROM orders WHERE payment_status != 'pago'").get() as { v: number }).v),
    average_ticket: ((db.prepare("SELECT COALESCE(AVG(total_value), 0) as v FROM orders WHERE total_value > 0").get() as { v: number }).v),
    total_billed: ((db.prepare("SELECT COALESCE(SUM(total_value), 0) as v FROM orders").get() as { v: number }).v),
    week_deliveries: (db.prepare("SELECT COUNT(*) as c FROM orders WHERE expected_date >= ? AND expected_date <= ?").get(today, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) as { c: number }).c,
  };

  // Orders per month (last 6 months)
  const ordersPerMonth = db.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as count,
      COALESCE(SUM(total_value), 0) as revenue
    FROM orders
    WHERE created_at >= datetime('now', '-6 months')
    GROUP BY month
    ORDER BY month ASC
  `).all();

  // Orders by company
  const byCompany = db.prepare(`
    SELECT c.name, c.color, COUNT(o.id) as count, COALESCE(SUM(o.total_value), 0) as revenue
    FROM companies c
    LEFT JOIN orders o ON o.company_id = c.id
    GROUP BY c.id
  `).all();

  // Orders by status
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM orders
    GROUP BY status
  `).all();

  return NextResponse.json({ stats, ordersPerMonth, byCompany, byStatus });
}
