import { create } from 'zustand';
interface User { id:string; name:string; email:string; role:string; }
interface AuthStore { user:User|null; token:string|null; setAuth:(u:User,t:string)=>void; logout:()=>void; }
export const useAuthStore = create<AuthStore>((set)=>({
  user:null, token:null,
  setAuth:(user,token)=>{ if(typeof window!=='undefined') localStorage.setItem('erp_token',token); set({user,token}); },
  logout:()=>{ if(typeof window!=='undefined') localStorage.removeItem('erp_token'); set({user:null,token:null}); },
}));
