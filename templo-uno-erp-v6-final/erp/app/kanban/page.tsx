'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order } from '@/types';
import { Loader2, GripVertical, Eye, AlertCircle } from 'lucide-react';
const COLS=[{id:'aguardando',label:'Aguardando',color:'#71717a'},{id:'corte',label:'Corte',color:'#3B82F6'},{id:'costura',label:'Costura',color:'#8B5CF6'},{id:'silk',label:'Personalização',color:'#F97316'},{id:'limpeza',label:'Limpeza',color:'#EAB308'},{id:'pronto',label:'Pronto',color:'#22C55E'},{id:'entregue',label:'Entregue',color:'#16A34A'}];
type KO=Order&{client_name?:string;company_name?:string;company_color?:string;current_step?:string;kanban_col?:string};
function getCol(o:KO){if(o.status==='entregue')return'entregue';const s=o.current_step;if(!s||s==='Tecido')return'aguardando';if(s==='Corte')return'corte';if(s==='Costura')return'costura';if(s==='Silk'||s==='Bordado'||s==='DTG')return'silk';if(s==='Limpeza')return'limpeza';if(s==='Entrega')return'pronto';return'aguardando';}
export default function KanbanPage(){
  const router=useRouter();
  const [orders,setOrders]=useState<KO[]>([]);
  const [loading,setLoading]=useState(true);
  const [columns,setColumns]=useState<Record<string,KO[]>>({});
  const [dragging,setDragging]=useState<string|null>(null);
  const [dragOver,setDragOver]=useState<string|null>(null);
  const dragItem=useRef<string|null>(null);
  const load=useCallback(async()=>{
    setLoading(true);
    try{const d=await api.orders.list({});const e=d.map((o:KO)=>({...o,kanban_col:getCol(o)}));setOrders(e);
      const g:Record<string,KO[]>={};COLS.forEach(c=>{g[c.id]=[];});e.forEach((o:KO)=>{const c=o.kanban_col||'aguardando';if(g[c])g[c].push(o);});setColumns(g);
    }finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  const onDrop=async(colId:string)=>{
    const oid=dragItem.current;if(!oid){setDragging(null);setDragOver(null);return;}
    const order=orders.find(o=>o.id===oid);
    if(!order||order.kanban_col===colId){setDragging(null);setDragOver(null);dragItem.current=null;return;}
    setColumns(prev=>{const next={...prev};const sc=order.kanban_col||'aguardando';next[sc]=next[sc].filter(o=>o.id!==oid);next[colId]=[...(next[colId]||[]),{...order,kanban_col:colId}];return next;});
    if(colId==='entregue')await api.orders.update(oid,{...order,status:'entregue',delivery_date:new Date().toISOString()});
    else if(order.status==='entregue')await api.orders.update(oid,{...order,status:'producao',delivery_date:null});
    const col=COLS.find(c=>c.id===colId);
    const stepMap:Record<string,string>={corte:'Corte',costura:'Costura',silk:'Silk',limpeza:'Limpeza',pronto:'Entrega',entregue:'Entrega'};
    if(stepMap[colId])await api.orders.updateChecklist(oid,stepMap[colId],true);
    setDragging(null);setDragOver(null);dragItem.current=null;
  };
  if(loading)return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-yellow-500"/></div>;
  return(
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 flex-shrink-0">
        <div><h1 className="text-lg font-semibold text-zinc-100">Kanban de Produção</h1><p className="text-sm text-zinc-500">{orders.filter(o=>o.status!=='entregue').length} pedidos ativos</p></div>
        <button onClick={load} className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-lg px-3 py-1.5 transition-colors">Atualizar</button>
      </div>
      <div className="flex flex-1 gap-3 overflow-x-auto p-4 pb-6">
        {COLS.map(col=>{const colOrders=columns[col.id]||[];const isOver=dragOver===col.id;return(
          <div key={col.id} className={`flex flex-col rounded-xl border transition-colors flex-shrink-0 w-60 ${isOver?'border-zinc-500 bg-zinc-800/80':'border-zinc-800 bg-zinc-900/60'}`}
            onDragOver={e=>{e.preventDefault();setDragOver(col.id);}} onDrop={()=>onDrop(col.id)} onDragLeave={()=>setDragOver(null)}>
            <div className="flex items-center justify-between px-3 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full flex-shrink-0" style={{backgroundColor:col.color}}/><span className="text-xs font-medium text-zinc-300">{col.label}</span></div>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">{colOrders.length}</span>
            </div>
            <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto">
              {colOrders.length===0?(<div className={`flex items-center justify-center h-20 rounded-lg border border-dashed transition-colors ${isOver?'border-zinc-500':'border-zinc-800'}`}><p className="text-xs text-zinc-700">Soltar aqui</p></div>):
                colOrders.map((o)=>{const del=o.status==='atrasado'||(o.status!=='entregue'&&new Date(o.expected_date)<new Date());return(
                  <div key={o.id} draggable onDragStart={()=>{dragItem.current=o.id;setDragging(o.id);}} onDragEnd={()=>{setDragging(null);setDragOver(null);dragItem.current=null;}}
                    className={`group rounded-lg border bg-zinc-900 p-3 cursor-grab active:cursor-grabbing transition-all select-none ${dragging===o.id?'opacity-40 scale-95 border-zinc-600':'border-zinc-800 hover:border-zinc-700'}`}>
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="font-mono text-[11px] text-yellow-500 font-semibold">{o.number}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>router.push(`/orders/${o.id}`)} className="rounded p-0.5 text-zinc-500 hover:text-zinc-200"><Eye className="h-3.5 w-3.5"/></button>
                        <GripVertical className="h-3.5 w-3.5 text-zinc-700"/>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-zinc-200 leading-tight mb-1">{o.client_name}</p>
                    <div className="flex items-center gap-1.5 mb-2.5"><div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{backgroundColor:o.company_color}}/><span className="text-[11px] text-zinc-500">{o.company_name}</span></div>
                    <div className="flex items-center justify-between border-t border-zinc-800 pt-2 mt-2">
                      <div className={`flex items-center gap-1 text-[10px] ${del?'text-red-400':'text-zinc-500'}`}>{del&&<AlertCircle className="h-3 w-3"/>}{formatDate(o.expected_date)}</div>
                      <span className="text-[11px] font-semibold text-zinc-300">{formatCurrency(o.total_value)}</span>
                    </div>
                  </div>
                );})
              }
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}
