import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  
  const db = getDb();
  const companies = db.prepare('SELECT * FROM companies ORDER BY name').all();
  return NextResponse.json(companies);
}
