import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
export async function GET(req: NextRequest) {
  if (!getUserFromRequest(req)) return NextResponse.json({error:'Não autorizado'},{status:401});
  return NextResponse.json(getDb().prepare('SELECT * FROM companies ORDER BY name').all());
}
