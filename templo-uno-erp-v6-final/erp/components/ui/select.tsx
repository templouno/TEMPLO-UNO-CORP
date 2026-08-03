import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
const Select = React.forwardRef<HTMLSelectElement,React.SelectHTMLAttributes<HTMLSelectElement>>(({className,children,...props},ref)=><div className="relative"><select className={cn('flex h-9 w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 pr-8 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-500',className)} ref={ref} {...props}>{children}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-zinc-500"/></div>);
Select.displayName='Select';
export {Select};
