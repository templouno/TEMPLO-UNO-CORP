'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, ShoppingBag, Factory, Truck, AlertCircle, DollarSign, Clock, TrendingUp, Package, Calendar } from 'lucide-react';
interface Stats{total_clients:number;active_orders:number;in_production:number;delivered:number;delayed:number;month_revenue:number;pending_value:number;average_ticket:number;total_billed:number;week_deliveries:number;}
const MONTHS=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const TS={backgroundColor:'#18181b',border:'1px solid #3f3f46',borderRadius:'8px',color:'#f4f4f5'};
export default function DashboardPage(){
  const [data,setData]=useState<{stats:Stats;ordersPerMonth:unknown[];byCompany:unknown[];byStatus:unknown[]}|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{api.dashboard.get().then(setData).finally(()=>setLoading(false));},[]);
  if(loading)return <div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent"/></div>;
  const s=data?.stats;
  const cards=[
    {label:'Clientes',value:s?.total_clients??0,icon:Users,color:'#EAB308'},{label:'Pedidos Ativos',value:s?.active_orders??0,icon:ShoppingBag,color:'#8B5CF6'},
    {label:'Em Produção',value:s?.in_production??0,icon:Factory,color:'#3B82F6'},{label:'Entregues',value:s?.delivered??0,icon:Truck,color:'#22C55E'},
    {label:'Atrasados',value:s?.delayed??0,icon:AlertCircle,color:'#EF4444'},{label:'Receita do Mês',value:formatCurrency(s?.month_revenue??0),icon:DollarSign,color:'#22C55E',t:true},
    {label:'Pendentes',value:formatCurrency(s?.pending_value??0),icon:Clock,color:'#EF4444',t:true},{label:'Ticket Médio',value:formatCurrency(s?.average_ticket??0),icon:TrendingUp,color:'#EAB308',t:true},
    {label:'Total Faturado',value:formatCurrency(s?.total_billed??0),icon:Package,color:'#8B5CF6',t:true},{label:'Entregas/Semana',value:s?.week_deliveries??0,icon:Calendar,color:'#F97316'},
  ];
  const monthData=(data?.ordersPerMonth as Array<{month:string;count:number;revenue:number}>??[]).map(m=>({name:MONTHS[parseInt(m.month.split('-')[1])-1],Pedidos:m.count,Receita:m.revenue}));
  const statusData=(data?.byStatus as Array<{status:string;count:number}>??[]).map(s=>({name:s.status==='producao'?'Produção':s.status==='entregue'?'Entregue':'Atrasado',value:s.count,color:s.status==='producao'?'#EAB308':s.status==='entregue'?'#22C55E':'#EF4444'}));
  const companyData=data?.byCompany as Array<{name:string;color:string;count:number;revenue:number}>??[];
  return(
    <div className="p-6 space-y-6">
      <div><h1 className="text-lg font-semibold text-zinc-100">Dashboard</h1><p className="text-sm text-zinc-500">Visão geral da operação</p></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map(({label,value,icon:Icon,color,t})=>(
          <Card key={label} className="bg-zinc-900 border-zinc-800"><CardContent className="p-4">
            <div className="flex items-start justify-between mb-3"><p className="text-xs text-zinc-500">{label}</p><div className="rounded-lg p-1.5" style={{backgroundColor:`${color}20`}}><Icon className="h-3.5 w-3.5" style={{color}}/></div></div>
            <p className={`font-bold text-zinc-100 ${t?'text-sm':'text-2xl'}`}>{value}</p>
          </CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800"><CardHeader><CardTitle>Pedidos por Mês</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={200}><BarChart data={monthData}><XAxis dataKey="name" tick={{fill:'#71717a',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#71717a',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={TS}/><Bar dataKey="Pedidos" fill="#EAB308" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
        </CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardHeader><CardTitle>Status</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>{statusData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip contentStyle={TS}/></PieChart></ResponsiveContainer>
          <div className="flex justify-center gap-3 mt-2">{statusData.map(s=><div key={s.name} className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full" style={{backgroundColor:s.color}}/><span className="text-xs text-zinc-500">{s.name}({s.value})</span></div>)}</div>
        </CardContent></Card>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800"><CardHeader><CardTitle>Faturamento Mensal</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={180}><LineChart data={monthData}><XAxis dataKey="name" tick={{fill:'#71717a',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#71717a',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`R$${(v/1000).toFixed(0)}k`}/><Tooltip contentStyle={TS} formatter={((v:unknown)=>[formatCurrency(Number(v)),'Receita']) as never}/><Line type="monotone" dataKey="Receita" stroke="#22C55E" strokeWidth={2} dot={{fill:'#22C55E',r:3}}/></LineChart></ResponsiveContainer>
        </CardContent></Card>
        <Card className="bg-zinc-900 border-zinc-800"><CardHeader><CardTitle>Por Empresa</CardTitle></CardHeader><CardContent>
          <div className="space-y-3 pt-2">{companyData.map(c=>{const max=Math.max(...companyData.map(x=>x.count),1);return(<div key={c.name}><div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{backgroundColor:c.color}}/><span className="text-xs text-zinc-400">{c.name}</span></div><span className="text-xs text-zinc-500">{c.count}</span></div><div className="h-1.5 w-full rounded-full bg-zinc-800"><div className="h-1.5 rounded-full" style={{width:`${(c.count/max)*100}%`,backgroundColor:c.color}}/></div></div>);})}</div>
        </CardContent></Card>
      </div>
    </div>
  );
}
