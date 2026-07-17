import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb, generateId } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  try {
    const { step, completed } = await req.json();
    const db = getDb();
    if (completed) {
      db.prepare(`UPDATE checklist_items SET completed=1, completed_at=datetime('now'), user_id=? WHERE order_id=? AND step=?`)
        .run(payload.id, id, step);
      db.prepare(`INSERT INTO history (id, order_id, user_id, action, description) VALUES (?, ?, ?, ?, ?)`)
        .run(generateId(), id, payload.id, 'checklist_concluido', `Etapa "${step}" concluída`);
    } else {
      db.prepare(`UPDATE checklist_items SET completed=0, completed_at=NULL, user_id=NULL WHERE order_id=? AND step=?`)
        .run(id, step);
    }
    const checklist = db.prepare(`
      SELECT ci.*, u.name as user_name FROM checklist_items ci
      LEFT JOIN users u ON u.id = ci.user_id
      WHERE ci.order_id = ? ORDER BY ci.rowid
    `).all(id);
    return NextResponse.json(checklist);
  } catch { return NextResponse.json({ error: 'Erro ao atualizar checklist' }, { status: 500 }); }
}
