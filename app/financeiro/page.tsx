'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const tooltipStyle = { backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#f4f4f5' };

export default function FinanceiroPage() {
  const [data, setData] = useState<{ stats: Record<string, number>; ordersPerMonth: Array<Record<string, unknown>>; byCompany: Array<Record<string, unknown>> } | null>(null);

  useEffect(() => { api.dashboard.get().then(setData); }, []);

  const s = data?.stats;
  const monthData = (data?.ordersPerMonth ?? []).map((m: Record<string, unknown>) => ({
    name: MONTH_NAMES[parseInt((m.month as string).split('-')[1]) - 1],
    Receita: m.revenue as number,
    Pedidos: m.count as number,
  }));

  const companyData = (data?.byCompany ?? []) as Array<{ name: string; color: string; revenue: number; count: number }>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Financeiro</h1>
        <p className="text-sm text-zinc-500">Visão financeira consolidada</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Faturamento do Mês', value: formatCurrency(s?.month_revenue ?? 0), icon: DollarSign, color: '#22C55E' },
          { label: 'Total Faturado', value: formatCurrency(s?.total_billed ?? 0), icon: TrendingUp, color: '#EAB308' },
          { label: 'Valores Pendentes', value: formatCurrency(s?.pending_value ?? 0), icon: Clock, color: '#EF4444' },
          { label: 'Ticket Médio', value: formatCurrency(s?.average_ticket ?? 0), icon: CheckCircle, color: '#8B5CF6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-zinc-500">{label}</p>
                <div className="rounded-lg p-1.5" style={{ backgroundColor: `${color}20` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
              </div>
              <p className="text-lg font-bold text-zinc-100">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle>Faturamento Mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [formatCurrency(Number(v)), 'Receita']} />
                <Area type="monotone" dataKey="Receita" stroke="#22C55E" strokeWidth={2} fill="url(#colorReceita)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader><CardTitle>Receita por Empresa</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={companyData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [formatCurrency(Number(v)), 'Receita']} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {companyData.map((entry, i) => (
                    <rect key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Company table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle>Detalhamento por Empresa</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800">
              {['Empresa','Pedidos','Receita Total','% do Total'].map(h => (
                <th key={h} className="pb-3 text-left text-xs text-zinc-500">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-zinc-800/50">
              {companyData.map(c => {
                const totalRevenue = companyData.reduce((s, x) => s + x.revenue, 0);
                const pct = totalRevenue > 0 ? ((c.revenue / totalRevenue) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={c.name}>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-sm text-zinc-200">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-zinc-400">{c.count}</td>
                    <td className="py-3 text-sm font-medium text-zinc-100">{formatCurrency(c.revenue)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-zinc-800 max-w-[100px]">
                          <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                        </div>
                        <span className="text-xs text-zinc-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
