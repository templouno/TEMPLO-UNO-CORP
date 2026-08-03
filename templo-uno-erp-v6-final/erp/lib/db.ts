import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.cwd();
const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, 'erp.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL, color TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, email TEXT,
      cpf_cnpj TEXT, city TEXT, state TEXT, notes TEXT, company_id TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, number TEXT UNIQUE NOT NULL,
      client_id TEXT NOT NULL, company_id TEXT NOT NULL,
      entry_date TEXT DEFAULT (datetime('now')), expected_date TEXT NOT NULL,
      delivery_date TEXT, status TEXT NOT NULL DEFAULT 'producao',
      payment_status TEXT NOT NULL DEFAULT 'pendente', payment_method TEXT,
      total_value REAL DEFAULT 0, received_value REAL DEFAULT 0, notes TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL, name TEXT NOT NULL,
      reference TEXT, color TEXT, size TEXT, quantity INTEGER DEFAULT 1,
      unit_value REAL DEFAULT 0, total_value REAL DEFAULT 0, notes TEXT
    );
    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL, step TEXT NOT NULL,
      completed INTEGER DEFAULT 0, completed_at TEXT, user_id TEXT
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL, amount REAL NOT NULL,
      method TEXT NOT NULL, paid_at TEXT DEFAULT (datetime('now')), notes TEXT
    );
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY, order_id TEXT, client_id TEXT, user_id TEXT,
      action TEXT NOT NULL, description TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  const c = d.prepare('SELECT COUNT(*) as c FROM companies').get() as { c: number };
  if (c.c === 0) {
    const ins = d.prepare('INSERT INTO companies (id,name,slug,color) VALUES (?,?,?,?)');
    ins.run('c1','Templo Uno','templo-uno','#EAB308');
    ins.run('c2','Templo','templo','#8B5CF6');
    ins.run('c3','Lata','lata','#22C55E');
    ins.run('c4','LEA','lea','#F97316');
  }
}

export function genId(): string {
  return Math.random().toString(36).slice(2,9) + Date.now().toString(36);
}

export function genOrderNumber(d: Database.Database): string {
  const y = new Date().getFullYear();
  const row = d.prepare(`SELECT number FROM orders WHERE number LIKE 'TU-${y}-%' ORDER BY number DESC LIMIT 1`).get() as { number: string } | undefined;
  if (!row) return `TU-${y}-0001`;
  const n = parseInt(row.number.split('-')[2]) + 1;
  return `TU-${y}-${String(n).padStart(4,'0')}`;
}
