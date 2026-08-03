import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, genId } from './db';

const SECRET = process.env.JWT_SECRET || 'templo-uno-secret-2025';

export interface JWTPayload { id: string; email: string; name: string; role: string; }

export const hashPassword = (p: string) => bcrypt.hashSync(p, 10);
export const verifyPassword = (p: string, h: string) => bcrypt.compareSync(p, h);
export const signToken = (payload: JWTPayload) => jwt.sign(payload, SECRET, { expiresIn: '7d' });
export const verifyToken = (token: string): JWTPayload | null => {
  try { return jwt.verify(token, SECRET) as JWTPayload; } catch { return null; }
};
export const getUserFromRequest = (req: Request): JWTPayload | null => {
  const h = req.headers.get('Authorization');
  if (!h?.startsWith('Bearer ')) return null;
  return verifyToken(h.slice(7));
};
export function ensureAdmin() {
  const db = getDb();
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get('admin@templounocorp.com');
  if (!exists) {
    db.prepare('INSERT INTO users (id,name,email,password,role) VALUES (?,?,?,?,?)').run(
      genId(), 'Admin', 'admin@templounocorp.com', hashPassword('admin123'), 'admin'
    );
  }
}
