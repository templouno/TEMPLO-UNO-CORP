import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
export async function GET(req: NextRequest) {
  const p = getUserFromRequest(req);
  if (!p) return NextResponse.json({error:'Não autorizado'},{status:401});
  const user = getDb().prepare('SELECT id,name,email,role FROM users WHERE id=?').get(p.id);
  if (!user) return NextResponse.json({error:'Não encontrado'},{status:404});
  return NextResponse.json(user);
}
