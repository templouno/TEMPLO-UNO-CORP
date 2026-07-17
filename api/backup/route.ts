import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.cwd();
const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, 'templo-uno-erp.db');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  if (payload.role !== 'admin') return NextResponse.json({ error: 'Apenas admins' }, { status: 403 });

  const db = getDb();
  db.pragma('wal_checkpoint(TRUNCATE)');

  if (!fs.existsSync(DB_PATH)) {
    return NextResponse.json({ error: 'Banco não encontrado' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(DB_PATH);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.writeFileSync(path.join(BACKUP_DIR, `backup-${timestamp}.db`), fileBuffer);

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .sort().reverse();
  for (const old of backups.slice(10)) {
    fs.unlinkSync(path.join(BACKUP_DIR, old));
  }

  return new NextResponse(fileBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="templo-uno-backup-${timestamp}.db"`,
    },
  });
}

export async function POST(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  if (!fs.existsSync(BACKUP_DIR)) return NextResponse.json({ backups: [] });

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .sort().reverse()
    .map(f => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      return { name: f, size: stat.size, created: stat.mtime.toISOString() };
    });

  return NextResponse.json({ backups });
}
