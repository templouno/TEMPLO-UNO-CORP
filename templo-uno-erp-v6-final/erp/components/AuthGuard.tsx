'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
export function AuthGuard({children}:{children:React.ReactNode}){
  const {user,setAuth}=useAuthStore(); const router=useRouter(); const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const t=localStorage.getItem('erp_token');
    if(!t){router.push('/login');setLoading(false);return;}
    api.auth.me().then(u=>{setAuth(u,t);setLoading(false);}).catch(()=>{router.push('/login');setLoading(false);});
  },[]);
  if(loading)return <div className="flex h-screen items-center justify-center bg-zinc-950"><div className="h-6 w-6 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent"/></div>;
  if(!user)return null;
  return <>{children}</>;
}
