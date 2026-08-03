'use client';
import { Sidebar } from '@/components/Sidebar';
import { AuthGuard } from '@/components/AuthGuard';
export default function Layout({children}:{children:React.ReactNode}){
  return <AuthGuard><div className="flex h-screen overflow-hidden bg-zinc-950"><Sidebar/><main className="flex-1 overflow-hidden">{children}</main></div></AuthGuard>;
}
