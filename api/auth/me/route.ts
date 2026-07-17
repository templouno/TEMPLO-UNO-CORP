import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(payload.id);
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  
  return NextResponse.json(user);
}
