import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const v = cva('inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 disabled:pointer-events-none disabled:opacity-50',{variants:{variant:{default:'bg-yellow-500 text-black hover:bg-yellow-400',secondary:'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',ghost:'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',danger:'bg-red-600 text-white hover:bg-red-500',outline:'border border-zinc-700 text-zinc-300 hover:bg-zinc-800'},size:{sm:'h-8 px-3 text-xs',default:'h-9 px-4',lg:'h-11 px-6 text-base',icon:'h-9 w-9'}},defaultVariants:{variant:'default',size:'default'}});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof v> {}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({className,variant,size,...props},ref)=><button className={cn(v({variant,size,className}))} ref={ref} {...props}/>);
Button.displayName='Button';
export {Button};
