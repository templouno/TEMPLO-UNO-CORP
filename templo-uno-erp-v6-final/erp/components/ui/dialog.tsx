'use client';
import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
interface DialogProps{open:boolean;onClose:()=>void;children:React.ReactNode;className?:string;}
export function Dialog({open,onClose,children,className}:DialogProps){
  React.useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};if(open)document.addEventListener('keydown',h);return()=>document.removeEventListener('keydown',h);},[open,onClose]);
  if(!open)return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/><div className={cn('relative z-10 w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl',className)}>{children}</div></div>;
}
export function DialogHeader({children,onClose}:{children:React.ReactNode;onClose?:()=>void}){
  return <div className="flex items-center justify-between border-b border-zinc-800 p-5"><h2 className="text-base font-semibold text-zinc-100">{children}</h2>{onClose&&<button onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"><X className="h-4 w-4"/></button>}</div>;
}
export function DialogBody({className,children}:{className?:string;children:React.ReactNode}){return <div className={cn('p-5',className)}>{children}</div>;}
export function DialogFooter({children}:{children:React.ReactNode}){return <div className="flex justify-end gap-3 border-t border-zinc-800 p-5">{children}</div>;}
