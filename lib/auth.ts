import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, generateId } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'templo-uno-erp-secret-2024';

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getUserFromRequest(request: Request): JWTPayload | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.slice(7));
}

export function ensureAdminExists() {
  const db = getDb();
  const admin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@templounocorp.com');
  if (!admin) {
    db.prepare(`
      INSERT INTO users (id, name, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(generateId(), 'Admin', 'admin@templounocorp.com', hashPassword('admin123'), 'admin');
  }
}
