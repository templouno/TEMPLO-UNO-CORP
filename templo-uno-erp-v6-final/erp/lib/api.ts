const tok = () => typeof window!=='undefined' ? localStorage.getItem('erp_token') : null;
async function req(url: string, opts: RequestInit={}) {
  const t = tok();
  const res = await fetch(url,{...opts,headers:{'Content-Type':'application/json',...(t?{Authorization:`Bearer ${t}`}:{}), ...opts.headers}});
  if (!res.ok) { const e = await res.json().catch(()=>({error:'Erro'})); throw new Error(e.error||'Erro'); }
  return res.json();
}
export const api = {
  auth: { login:(e:string,p:string)=>req('/api/auth/login',{method:'POST',body:JSON.stringify({email:e,password:p})}), me:()=>req('/api/auth/me') },
  dashboard: { get:()=>req('/api/dashboard') },
  companies: { list:()=>req('/api/companies') },
  clients: { list:(s='')=>req(`/api/clients?search=${encodeURIComponent(s)}`), get:(id:string)=>req(`/api/clients/${id}`), create:(d:object)=>req('/api/clients',{method:'POST',body:JSON.stringify(d)}), update:(id:string,d:object)=>req(`/api/clients/${id}`,{method:'PUT',body:JSON.stringify(d)}), delete:(id:string)=>req(`/api/clients/${id}`,{method:'DELETE'}) },
  orders: { list:(p:{search?:string;status?:string;company?:string}={})=>req(`/api/orders?${new URLSearchParams(p as Record<string,string>)}`), get:(id:string)=>req(`/api/orders/${id}`), create:(d:object)=>req('/api/orders',{method:'POST',body:JSON.stringify(d)}), update:(id:string,d:object)=>req(`/api/orders/${id}`,{method:'PUT',body:JSON.stringify(d)}), delete:(id:string)=>req(`/api/orders/${id}`,{method:'DELETE'}), updateChecklist:(id:string,step:string,completed:boolean)=>req(`/api/orders/${id}/checklist`,{method:'PUT',body:JSON.stringify({step,completed})}), addPayment:(id:string,d:object)=>req(`/api/orders/${id}/payment`,{method:'POST',body:JSON.stringify(d)}) },
};
