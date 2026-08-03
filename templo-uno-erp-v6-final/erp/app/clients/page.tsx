'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Client, Company } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, User, Phone, Mail, MapPin, Edit2, Trash2, Loader2 } from 'lucide-react';
const EF={name:'',phone:'',email:'',cpf_cnpj:'',city:'',state:'',notes:'',company_id:''};
export default function ClientsPage(){
  const [clients,setClients]=useState<Client[]>([]);
  const [companies,setCompanies]=useState<Company[]>([]);
  const [search,setSearch]=useState('');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<Client|null>(null);
  const [form,setForm]=useState(EF);
  const load=useCallback(()=>{setLoading(true);api.clients.list(search).then(setClients).finally(()=>setLoading(false));},[search]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{api.companies.list().then(setCompanies);},[]);
  const openCreate=()=>{setEditing(null);setForm(EF);setOpen(true);};
  const openEdit=(c:Client)=>{setEditing(c);setForm({name:c.name,phone:c.phone||'',email:c.email||'',cpf_cnpj:c.cpf_cnpj||'',city:c.city||'',state:c.state||'',notes:c.notes||'',company_id:c.company_id||''});setOpen(true);};
  const save=async()=>{
    if(!form.name)return;setSaving(true);
    try{if(editing)await api.clients.update(editing.id,form);else await api.clients.create(form);setOpen(false);load();}
    catch{alert('Erro ao salvar');}finally{setSaving(false);}
  };
  const del=async(id:string,name:string)=>{if(!confirm(`Excluir "${name}"?`))return;await api.clients.delete(id);load();};
  const f=(k:keyof typeof EF,v:string)=>setForm(p=>({...p,[k]:v}));
  return(
    <div className="p-6">
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-lg font-semibold text-zinc-100">Clientes</h1><p className="text-sm text-zinc-500">{clients.length} cadastrados</p></div><Button onClick={openCreate}><Plus className="h-4 w-4"/>Novo Cliente</Button></div>
      <div className="relative mb-4"><Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500"/><Input className="pl-9" placeholder="Buscar clientes..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      {loading?<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-yellow-500"/></div>:clients.length===0?<div className="flex flex-col items-center py-16 text-zinc-600"><User className="h-10 w-10 mb-3 opacity-30"/><p className="text-sm">Nenhum cliente encontrado</p></div>:(
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full"><thead><tr className="border-b border-zinc-800 bg-zinc-900">{['Nome','Contato','Cidade','Empresa','Pedidos','Total Gasto',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-zinc-800/50">{clients.map((c:Client&{company_name?:string;company_color?:string})=>(
              <tr key={c.id} className="bg-zinc-900 hover:bg-zinc-800/50 transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300 flex-shrink-0">{c.name[0].toUpperCase()}</div><span className="text-sm font-medium text-zinc-100">{c.name}</span></div></td>
                <td className="px-4 py-3"><div className="text-xs text-zinc-400 space-y-0.5">{c.phone&&<div className="flex items-center gap-1"><Phone className="h-3 w-3"/>{c.phone}</div>}{c.email&&<div className="flex items-center gap-1"><Mail className="h-3 w-3"/>{c.email}</div>}</div></td>
                <td className="px-4 py-3">{c.city&&<div className="flex items-center gap-1 text-xs text-zinc-400"><MapPin className="h-3 w-3"/>{c.city}{c.state?`, ${c.state}`:''}</div>}</td>
                <td className="px-4 py-3">{c.company_name&&<span className="flex items-center gap-1.5 text-xs text-zinc-400"><div className="h-1.5 w-1.5 rounded-full" style={{backgroundColor:c.company_color}}/>{c.company_name}</span>}</td>
                <td className="px-4 py-3 text-sm text-zinc-400">{c.order_count??0}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">{formatCurrency(c.total_spent??0)}</td>
                <td className="px-4 py-3"><div className="flex gap-1">
                  <button onClick={()=>openEdit(c)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"><Edit2 className="h-3.5 w-3.5"/></button>
                  <button onClick={()=>del(c.id,c.name)} className="rounded p-1.5 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5"/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <Dialog open={open} onClose={()=>setOpen(false)} className="max-w-xl">
        <DialogHeader onClose={()=>setOpen(false)}>{editing?'Editar Cliente':'Novo Cliente'}</DialogHeader>
        <DialogBody className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1"><label className="text-xs text-zinc-400">Nome *</label><Input value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Nome completo"/></div>
            <div className="space-y-1"><label className="text-xs text-zinc-400">Telefone</label><Input value={form.phone} onChange={e=>f('phone',e.target.value)} placeholder="(11) 99999-9999"/></div>
            <div className="space-y-1"><label className="text-xs text-zinc-400">Email</label><Input value={form.email} onChange={e=>f('email',e.target.value)} placeholder="email@exemplo.com"/></div>
            <div className="space-y-1"><label className="text-xs text-zinc-400">CPF / CNPJ</label><Input value={form.cpf_cnpj} onChange={e=>f('cpf_cnpj',e.target.value)}/></div>
            <div className="space-y-1"><label className="text-xs text-zinc-400">Empresa</label><Select value={form.company_id} onChange={e=>f('company_id',e.target.value)}><option value="">Nenhuma</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div className="space-y-1"><label className="text-xs text-zinc-400">Cidade</label><Input value={form.city} onChange={e=>f('city',e.target.value)}/></div>
            <div className="space-y-1"><label className="text-xs text-zinc-400">Estado</label><Input value={form.state} onChange={e=>f('state',e.target.value)} placeholder="SP"/></div>
            <div className="col-span-2 space-y-1"><label className="text-xs text-zinc-400">Observações</label><Textarea value={form.notes} onChange={e=>f('notes',e.target.value)} rows={2}/></div>
          </div>
        </DialogBody>
        <DialogFooter><Button variant="secondary" onClick={()=>setOpen(false)}>Cancelar</Button><Button onClick={save} disabled={saving||!form.name}>{saving?<Loader2 className="h-4 w-4 animate-spin"/>:'Salvar'}</Button></DialogFooter>
      </Dialog>
    </div>
  );
}
