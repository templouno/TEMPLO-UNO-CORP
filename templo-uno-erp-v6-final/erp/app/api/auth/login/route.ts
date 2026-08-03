import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, signToken, ensureAdmin } from '@/lib/auth';
export async function POST(req: NextRequest) {
  try {
    ensureAdmin();
    const { email, password } = await req.json();
    if (!email||!password) return NextResponse.json({error:'Email e senha obrigatórios'},{status:400});
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(email) as {id:string;name:string;email:string;password:string;role:string}|undefined;
    if (!user||!verifyPassword(password,user.password)) return NextResponse.json({error:'Credenciais inválidas'},{status:401});
    const token = signToken({id:user.id,email:user.email,name:user.name,role:user.role});
    return NextResponse.json({token,user:{id:user.id,name:user.name,email:user.email,role:user.role}});
  } catch(e) { console.error('Login error:',e); return NextResponse.json({error:'Erro interno'},{status:500}); }
}
