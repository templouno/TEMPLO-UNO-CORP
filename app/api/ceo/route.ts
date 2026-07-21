import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const db = getDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  // KPIs
  const activeOrders = (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status != 'entregue'").get() as { c: number }).c;
  const deliveredOnTime = (db.prepare(`
    SELECT COUNT(*) as c FROM orders 
    WHERE status = 'entregue' AND delivery_date IS NOT NULL AND delivery_date <= expected_date
  `).get() as { c: number }).c;
  const deliveredLate = (db.prepare(`
    SELECT COUNT(*) as c FROM orders 
    WHERE status = 'entregue' AND delivery_date IS NOT NULL AND delivery_date > expected_date
  `).get() as { c: number }).c;
  const totalDelivered = deliveredOnTime + deliveredLate;
  const onTimeRate = totalDelivered > 0 ? Math.round((deliveredOnTime / totalDelivered) * 100) : 0;

  // Avg production time (entry to delivery, in days)
  const avgProd = (db.prepare(`
    SELECT AVG(CAST((julianday(delivery_date) - julianday(entry_date)) AS REAL)) as avg
    FROM orders WHERE status = 'entregue' AND delivery_date IS NOT NULL
  `).get() as { avg: number | null }).avg;

  // Recurring clients (more than 1 order)
  const recurringClients = (db.prepare(`
    SELECT COUNT(*) as c FROM (
      SELECT client_id FROM orders GROUP BY client_id HAVING COUNT(*) > 1
    )
  `).get() as { c: number }).c;

  // Top clients by revenue
  const topClients = db.prepare(`
    SELECT cl.name, cl.id, COUNT(o.id) as order_count,
      COALESCE(SUM(o.total_value), 0) as total_revenue,
      COALESCE(SUM(o.received_value), 0) as received
    FROM clients cl
    JOIN orders o ON o.client_id = cl.id
    GROUP BY cl.id
    ORDER BY total_revenue DESC
    LIMIT 8
  `).all();

  // Top products by quantity
  const topProducts = db.prepare(`
    SELECT name, SUM(quantity) as total_qty, COUNT(*) as appearances,
      COALESCE(SUM(total_value), 0) as total_revenue
    FROM products
    GROUP BY name
    ORDER BY total_qty DESC
    LIMIT 8
  `).all();

  // Company performance
  const companyPerf = db.prepare(`
    SELECT co.name, co.color,
      COUNT(o.id) as orders,
      COALESCE(SUM(o.total_value), 0) as revenue,
      COALESCE(AVG(o.total_value), 0) as avg_ticket,
      SUM(CASE WHEN o.status = 'entregue' THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN o.status = 'atrasado' THEN 1 ELSE 0 END) as delayed
    FROM companies co
    LEFT JOIN orders o ON o.company_id = co.id
    GROUP BY co.id
    ORDER BY revenue DESC
  `).all();

  // Bottleneck: checklist step with most pending
  const bottleneck = db.prepare(`
    SELECT step, COUNT(*) as pending_count
    FROM checklist_items
    WHERE completed = 0
    GROUP BY step
    ORDER BY pending_count DESC
    LIMIT 6
  `).all();

  // Monthly comparison (current vs previous)
  const currentMonthRev = (db.prepare(`
    SELECT COALESCE(SUM(total_value), 0) as v FROM orders WHERE created_at >= ?
  `).get(monthStart) as { v: number }).v;
  const prevMonthRev = (db.prepare(`
    SELECT COALESCE(SUM(total_value), 0) as v FROM orders 
    WHERE created_at >= ? AND created_at < ?
  `).get(prevMonthStart, monthStart) as { v: number }).v;

  const currentMonthOrders = (db.prepare(`
    SELECT COUNT(*) as c FROM orders WHERE created_at >= ?
  `).get(monthStart) as { c: number }).c;
  const prevMonthOrders = (db.prepare(`
    SELECT COUNT(*) as c FROM orders WHERE created_at >= ? AND created_at < ?
  `).get(prevMonthStart, monthStart) as { c: number }).c;

  // Last 12 months trend
  const trend = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month,
      COUNT(*) as orders,
      COALESCE(SUM(total_value), 0) as revenue,
      SUM(CASE WHEN status = 'entregue' AND delivery_date <= expected_date THEN 1 ELSE 0 END) as on_time,
      SUM(CASE WHEN status = 'entregue' THEN 1 ELSE 0 END) as total_done
    FROM orders
    WHERE created_at >= datetime('now', '-12 months')
    GROUP BY month
    ORDER BY month ASC
  `).all();

  return NextResponse.json({
    kpis: {
      activeOrders,
      onTimeRate,
      deliveredOnTime,
      deliveredLate,
      avgProductionDays: avgProd ? Math.round(avgProd) : 0,
      recurringClients,
      currentMonthRev,
      prevMonthRev,
      currentMonthOrders,
      prevMonthOrders,
    },
    topClients,
    topProducts,
    companyPerf,
    bottleneck,
    trend,
  });
}
