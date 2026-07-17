'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ShoppingBag, BarChart3, LogOut, Kanban, Calendar, Trophy, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Pedidos', icon: ShoppingBag },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/financeiro', label: 'Financeiro', icon: BarChart3 },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
  { href: '/ceo', label: 'CEO Dashboard', icon: Trophy },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

const companies = [
  { name: 'Templo Uno', color: '#EAB308' },
  { name: 'Templo', color: '#8B5CF6' },
  { name: 'Lata', color: '#22C55E' },
  { name: 'LEA', color: '#F97316' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/login'); };

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-zinc-800 bg-zinc-950">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-zinc-800 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-500">
          <span className="text-xs font-black text-black">TU</span>
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-100 leading-none">Templo Uno</p>
          <p className="text-[10px] text-zinc-500 leading-none mt-0.5">Corp ERP</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="mb-4">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors mb-0.5',
                pathname.startsWith(href)
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
              )}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Companies */}
        <div className="mb-2 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">Empresas</p>
          {companies.map(c => (
            <div key={c.name} className="flex items-center gap-2 py-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="text-xs text-zinc-500">{c.name}</span>
            </div>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center justify-between rounded-lg px-2 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 flex-shrink-0">
              <span className="text-[10px] font-bold text-black">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">{user?.name}</p>
              <p className="text-[10px] text-zinc-600 truncate">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 rounded">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
