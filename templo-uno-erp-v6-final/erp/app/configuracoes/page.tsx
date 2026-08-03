'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Database, FileSpreadsheet, Users, DollarSign, Package, Loader2, CheckCircle2, Smartphone, Wifi, WifiOff } from 'lucide-react';
function useDownload(){
  const [loading,setLoading]=useState<string|null>(null);
  const [done,setDone]=useState<string|null>(null);
  const dl=async(url:string,label:string)=>{
    setLoading(label);setDone(null);
    try{const t=localStorage.getItem('erp_token');const res=await fetch(url,{headers:{Authorization:`Bearer ${t}`}});if(!res.ok)throw new Error();
      const blob=await res.blob();const cd=res.headers.get('Content-Disposition')||'';const m=cd.match(/filename="?([^"]+)"?/);
      const fn=m?.[1]||'download';const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fn;a.click();URL.revokeObjectURL(a.href);
      setDone(label);setTimeout(()=>setDone(null),3000);
    }catch{alert('Erro ao baixar');}finally{setLoading(null);}
  };
  return{loading,done,dl};
}
export default function ConfigPage(){
  const {loading,done,dl}=useDownload();
  const [standalone,setStandalone]=useState(false);
  const [online,setOnline]=useState(true);
  useEffect(()=>{setStandalone(window.matchMedia('(display-mode: standalone)').matches);setOnline(navigator.onLine);const on=()=>setOnline(true);const off=()=>setOnline(false);window.addEventListener('online',on);window.addEventListener('offline',off);return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off);};},[]);
  const exports=[{label:'Pedidos (CSV)',icon:Package,url:'/api/export?type=orders',desc:'Todos os pedidos'},{label:'Clientes (CSV)',icon:Users,url:'/api/export?type=clients',desc:'Base de clientes'},{label:'Financeiro (CSV)',icon:DollarSign,url:'/api/export?type=financeiro',desc:'Pagamentos e pendências'}];
  return(
    <div className="p-6 space-y-6 max-w-2xl">
      <div><h1 className="text-lg font-semibold text-zinc-100">Configurações</h1><p className="text-sm text-zinc-500">Backup, exportação e administração</p></div>
      <Card className="bg-zinc-900 border-zinc-800"><CardHeader><div className="flex items-center gap-2"><Database className="h-4 w-4 text-yellow-500"/><CardTitle className="text-zinc-100 text-sm">Backup do Banco de Dados</CardTitle></div></CardHeader><CardContent className="space-y-4">
        <p className="text-xs text-zinc-500">Baixa uma cópia completa do banco SQLite. Salve regularmente em local seguro.</p>
        <Button onClick={()=>dl('/api/backup','backup')} disabled={loading==='backup'} variant="outline" className="gap-2">
          {loading==='backup'?<Loader2 className="h-4 w-4 animate-spin"/>:done==='backup'?<CheckCircle2 className="h-4 w-4 text-green-400"/>:<Download className="h-4 w-4"/>}{done==='backup'?'Baixado!':'Baixar Backup (.db)'}
        </Button>
      </CardContent></Card>
      <Card className="bg-zinc-900 border-zinc-800"><CardHeader><div className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-green-500"/><CardTitle className="text-zinc-100 text-sm">Exportação de Dados</CardTitle></div></CardHeader><CardContent>
        <p className="text-xs text-zinc-500 mb-4">Exporte para CSV — compatível com Excel e Google Sheets.</p>
        <div className="space-y-2">{exports.map(item=>(
          <div key={item.label} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <div className="flex items-center gap-3"><div className="rounded-lg bg-zinc-800 p-1.5"><item.icon className="h-3.5 w-3.5 text-zinc-400"/></div><div><p className="text-xs font-medium text-zinc-200">{item.label}</p><p className="text-[11px] text-zinc-600">{item.desc}</p></div></div>
            <Button size="sm" variant="ghost" onClick={()=>dl(item.url,item.label)} disabled={loading===item.label} className="gap-1.5 flex-shrink-0">
              {loading===item.label?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:done===item.label?<CheckCircle2 className="h-3.5 w-3.5 text-green-400"/>:<Download className="h-3.5 w-3.5"/>}{done===item.label?'OK':'CSV'}
            </Button>
          </div>
        ))}</div>
      </CardContent></Card>
      <Card className="bg-zinc-900 border-zinc-800"><CardHeader><div className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-blue-400"/><CardTitle className="text-zinc-100 text-sm">Sistema</CardTitle></div></CardHeader><CardContent>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[['Modo',standalone?'✅ App instalado':'🌐 Navegador'],['Conexão',online?'✅ Online':'🔴 Offline'],['Stack','Next.js + TypeScript'],['Banco','SQLite (local)'],['Auth','JWT + bcrypt'],['Versão','v6.0 — 2025']].map(([l,v])=>(
            <div key={l}><p className="text-zinc-600 mb-0.5">{l}</p><p className="text-zinc-300 font-medium">{v}</p></div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  );
}
