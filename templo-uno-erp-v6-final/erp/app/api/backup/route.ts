import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';
const DATA_DIR=process.env.RAILWAY_VOLUME_MOUNT_PATH||process.cwd();
const DB_PATH=process.env.DATABASE_PATH||path.join(DATA_DIR,'erp.db');
const BACKUP_DIR=path.join(DATA_DIR,'backups');
export async function GET(req: NextRequest) {
  const p=getUserFromRequest(req); if (!p) return NextResponse.json({error:'Não autorizado'},{status:401});
  getDb().pragma('wal_checkpoint(TRUNCATE)');
  if (!fs.existsSync(DB_PATH)) return NextResponse.json({error:'Banco não encontrado'},{status:404});
  const buf=fs.readFileSync(DB_PATH);
  const ts=new Date().toISOString().replace(/[:.]/g,'-');
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR,{recursive:true});
  fs.writeFileSync(path.join(BACKUP_DIR,`backup-${ts}.db`),buf);
  const old=fs.readdirSync(BACKUP_DIR).filter(f=>f.endsWith('.db')).sort().reverse();
  for (const f of old.slice(10)) fs.unlinkSync(path.join(BACKUP_DIR,f));
  return new NextResponse(buf as unknown as BodyInit,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="backup-${ts}.db"`}});
}
