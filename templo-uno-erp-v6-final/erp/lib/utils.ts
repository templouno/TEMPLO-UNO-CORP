import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
export const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);
export const formatDate = (d?: string|null) => d ? new Intl.DateTimeFormat('pt-BR').format(new Date(d)) : '-';
export const formatDateTime = (d?: string|null) => d ? new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(d)) : '-';
