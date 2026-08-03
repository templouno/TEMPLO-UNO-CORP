import * as React from 'react';
import { cn } from '@/lib/utils';
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> { color?: string; }
export function Badge({className,color,children,...props}:BadgeProps){
  const style:React.CSSProperties=color?{backgroundColor:`${color}22`,color,border:`1px solid ${color}44`}:{};
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',className)} style={style} {...props}>{children}</span>;
}
