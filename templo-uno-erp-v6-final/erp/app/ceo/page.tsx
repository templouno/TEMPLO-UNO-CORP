'use client';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, ShoppingBag, Clock, CheckCircle2, AlertCircle, Users, Trophy, Package, Zap, Minus } from 'lucide-react';
const MN=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const TS={backgroundColor:'#18181b',border:'1px solid #3f3f46',borderRadius:'8px',color:'#f4f4f5',fontSize:11};
type CEOData={kpis:{activeOrders:number;onTimeRate:number;deliveredOnTime:number;deliveredLate:number;avgProductionDays:number;recurringClients:number;currentMonthRev:number;prevMonthRev:number;currentMonthOrders:number;prevMonthOrders:number};topClients:Array<{name:string;id:string;order_count:number;total_revenue:number}>;topProducts:Array<{name:string;total_qty:number;total_revenue:number}>;companyPerf:Array<{name:string;color:string;orders:number;revenue:number;avg_ticket:number;delivered:number;delayed:number}>;bottleneck:Array<{step:string;pending_count:number}>;trend:Array<{month:string;orders:number;revenue:number;on_time:number;total_done:number}>};
function Delta({current,previous}:{current:number;previous:number}){
  if(previous===0)return null;const p=((current-previous)/previous)*100;const up=p>=0;
  const Icon=p===0?Minus:up?TrendingUp:TrendingDown;
  return <div className={`flex items-center gap-1 text-xs ${p===0?'text-zinc-500':up?'text-green-400':'text-red-400'}`}><Icon className="h-3 w-3"/><span>{Math.abs(p).toFixed(1)}% vs mês ant.</span></div>;
}
export default function CEOPage(){
  const [data,setData]=useState<CEOData|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{fetch('/api/ceo',{headers:{Authorization:`Bearer ${localStorage.getItem('erp_token')}`}}).then(r=>r.json()).then(setData).finally(()=>setLoading(false));},[]);
  if(loading)return <div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent"/></div>;
  if(!data)return null;
  const {kpis,topClients,topProducts,companyPerf,bottleneck,trend}=data;
  const trendData=trend.map(t=>({name:MN[parseInt(t.month.split('-')[1])-1],Pedidos:t.orders,Receita:t.revenue,'No Prazo':t.total_done>0?Math.round((t.on_time/t.total_done)*100):0}));
  const maxB=Math.max(...bottleneck.map(b=>b.pending_count),1);
  return(
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-lg font-semibold text-zinc-100">CEO Dashboard</h1><p className="text-sm text-zinc-500">Visão executiva · {new Date().toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</p></div><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 border border-yellow-500/20"><Trophy className="h-4 w-4 text-yellow-500"/></div></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><div className="flex items-start justify-between mb-2"><p className="text-xs text-zinc-500">Pedidos Ativos</p><div className="rounded-lg p-1.5 bg-blue-500/10"><ShoppingBag className="h-3.5 w-3.5 text-blue-400"/></div></div><p className="text-3xl font-bold text-zinc-100">{kpis.activeOrders}</p><Delta current={kpis.currentMonthOrders} previous={kpis.prevMonthOrders}/></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><div className="flex items-start justify-between mb-2"><p className="text-xs text-zinc-500">Entregas no Prazo</p><div className="rounded-lg p-1.5 bg-green-500/10"><CheckCircle2 className="h-3.5 w-3.5 text-green-400"/></div></div><p className="text-3xl font-bold text-zinc-100">{kpis.onTimeRate}<span className="text-lg text-zinc-500">%</span></p><div className="mt-1.5 h-1.5 w-full rounded-full bg-zinc-800"><div className="h-1.5 rounded-full bg-green-500" style={{width:`${kpis.onTimeRate}%`}}/></div><p className="mt-1 text-xs text-zinc-600">{kpis.deliveredOnTime} no prazo · {kpis.deliveredLate} atrasadas</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><div className="flex items-start justify-between mb-2"><p className="text-xs text-zinc-500">Tempo Médio Produção</p><div className="rounded-lg p-1.5 bg-purple-500/10"><Clock className="h-3.5 w-3.5 text-purple-400"/></div></div><p className="text-3xl font-bold text-zinc-100">{kpis.avgProductionDays}<span className="text-lg text-zinc-500"> dias</span></p><p className="text-xs text-zinc-600 mt-1">Entrada até entrega</p></CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardContent className="p-4"><div className="flex items-start justify-between mb-2"><p className="text-xs text-zinc-500">Receita do Mês</p><div className="rounded-lg p-1.5 bg-yellow-500/10"><TrendingUp className="h-3.5 w-3.5 text-yellow-400"/></div></div><p className="text-xl font-bold text-zinc-100">{formatCurrency(kpis.currentMonthRev)}</p><Delta current={kpis.currentMonthRev} previous={kpis.prevMonthRev}/></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800"><CardHeader><CardTitle>Tendência 12 Meses</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={200}><AreaChart data={trendData}>
            <defs><linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EAB308" stopOpacity={0.25}/><stop offset="95%" stopColor="#EAB308" stopOpacity={0}/></linearGradient></defs>
            <XAxis dataKey="name" tick={{fill:'#71717a',fontSize:10}} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="r" tick={{fill:'#71717a',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`R$${(v/1000).toFixed(0)}k`}/>
            <YAxis yAxisId="o" orientation="right" tick={{fill:'#71717a',fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={TS} formatter={((v:unknown,n:unknown)=>n==='Receita'?[formatCurrency(Number(v)),n as string]:[v,n as string]) as never}/>
            <Legend wrapperStyle={{fontSize:11,color:'#71717a'}}/>
            <Area yAxisId="r" type="monotone" dataKey="Receita" stroke="#EAB308" strokeWidth={2} fill="url(#gR)"/>
            <Line yAxisId="o" type="monotone" dataKey="Pedidos" stroke="#8B5CF6" strokeWidth={2} dot={false}/>
          </AreaChart></ResponsiveContainer>
        </CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardHeader><div className="flex items-center gap-2"><CardTitle>Gargalo de Produção</CardTitle><Zap className="h-3.5 w-3.5 text-yellow-500"/></div></CardHeader><CardContent>
          <p className="text-xs text-zinc-600 mb-4">Etapas com mais pendentes</p>
          {bottleneck.length===0?<p className="text-xs text-zinc-600">Nenhum pendente</p>:<div className="space-y-3">{bottleneck.map((b,i)=>(
            <div key={b.step}><div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2">{i===0&&<AlertCircle className="h-3 w-3 text-red-400 flex-shrink-0"/>}<span className="text-xs text-zinc-300">{b.step}</span></div><span className="text-xs font-semibold text-zinc-400">{b.pending_count}</span></div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800"><div className="h-1.5 rounded-full" style={{width:`${(b.pending_count/maxB)*100}%`,backgroundColor:i===0?'#EF4444':i===1?'#F97316':'#EAB308'}}/></div>
            </div>
          ))}</div>}
        </CardContent></Card>
      </div>
      <Card className="bg-zinc-900 border-zinc-800"><CardHeader><CardTitle>Performance por Empresa</CardTitle></CardHeader><CardContent>
        <table className="w-full"><thead><tr className="border-b border-zinc-800">{['Empresa','Pedidos','Receita','Ticket Médio','No Prazo','Atrasados','Saúde'].map(h=><th key={h} className="pb-3 text-left text-xs text-zinc-500 font-medium pr-4">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-zinc-800/50">{companyPerf.map(c=>{const h=c.orders>0?Math.round(((c.delivered-c.delayed)/c.orders)*100):0;const hc=h>=70?'#22C55E':h>=40?'#EAB308':'#EF4444';return(
            <tr key={c.name} className="hover:bg-zinc-800/30 transition-colors">
              <td className="py-3 pr-4"><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{backgroundColor:c.color}}/><span className="text-sm font-medium text-zinc-200">{c.name}</span></div></td>
              <td className="py-3 pr-4 text-sm text-zinc-400">{c.orders}</td><td className="py-3 pr-4 text-sm font-semibold text-zinc-100">{formatCurrency(c.revenue)}</td><td className="py-3 pr-4 text-sm text-zinc-400">{formatCurrency(c.avg_ticket)}</td>
              <td className="py-3 pr-4"><span className="text-sm text-green-400">{c.delivered}</span></td><td className="py-3 pr-4"><span className="text-sm text-red-400">{c.delayed}</span></td>
              <td className="py-3"><div className="flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full bg-zinc-800 w-16"><div className="h-1.5 rounded-full" style={{width:`${Math.max(0,h)}%`,backgroundColor:hc}}/></div><span className="text-xs font-medium" style={{color:hc}}>{h}%</span></div></td>
            </tr>
          );})}</tbody>
        </table>
      </CardContent></Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800"><CardHeader><div className="flex items-center gap-2"><CardTitle>Ranking de Clientes</CardTitle><Users className="h-3.5 w-3.5 text-zinc-500"/></div></CardHeader><CardContent>
          {topClients.length===0?<p className="text-xs text-zinc-600">Nenhum cliente com pedidos</p>:<div className="space-y-2">{topClients.map((c,i)=>{const mx=topClients[0].total_revenue||1;return(
            <div key={c.id} className="flex items-center gap-3">
              <span className={`w-5 text-xs font-bold flex-shrink-0 ${i===0?'text-yellow-500':i===1?'text-zinc-400':i===2?'text-amber-700':'text-zinc-600'}`}>#{i+1}</span>
              <div className="flex-1 min-w-0"><div className="flex items-center justify-between mb-1"><p className="text-xs font-medium text-zinc-200 truncate">{c.name}</p><p className="text-xs font-bold text-zinc-100 ml-2 flex-shrink-0">{formatCurrency(c.total_revenue)}</p></div>
                <div className="flex items-center gap-2"><div className="flex-1 h-1 rounded-full bg-zinc-800"><div className="h-1 rounded-full bg-yellow-500/60" style={{width:`${(c.total_revenue/mx)*100}%`}}/></div><span className="text-[10px] text-zinc-600 flex-shrink-0">{c.order_count} pedidos</span></div>
              </div>
            </div>
          );})}
          <div className="mt-4 pt-3 border-t border-zinc-800"><span className="text-xs text-blue-400 bg-blue-500/10 rounded-full px-2 py-0.5 border border-blue-500/30">{kpis.recurringClients} clientes recorrentes</span></div>
          </div>}
        </CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardHeader><div className="flex items-center gap-2"><CardTitle>Produtos Mais Vendidos</CardTitle><Package className="h-3.5 w-3.5 text-zinc-500"/></div></CardHeader><CardContent>
          {topProducts.length===0?<p className="text-xs text-zinc-600">Nenhum produto</p>:<>
            <ResponsiveContainer width="100%" height={180}><BarChart data={topProducts.slice(0,6)} layout="vertical">
              <XAxis type="number" tick={{fill:'#71717a',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{fill:'#a1a1aa',fontSize:10}} axisLine={false} tickLine={false} width={90} tickFormatter={(v:string)=>v.length>12?v.slice(0,12)+'…':v}/>
              <Tooltip contentStyle={TS}/>
              <Bar dataKey="total_qty" name="Qtd. Total" radius={[0,4,4,0]} fill="#8B5CF6"/>
            </BarChart></ResponsiveContainer>
            <div className="mt-2 space-y-1">{topProducts.slice(0,4).map((p,i)=><div key={i} className="flex items-center justify-between text-[11px]"><span className="text-zinc-500 truncate">{p.name}</span><span className="text-zinc-400 ml-2 flex-shrink-0">{p.total_qty} un · {formatCurrency(p.total_revenue)}</span></div>)}</div>
          </>}
        </CardContent></Card>
      </div>
    </div>
  );
}
