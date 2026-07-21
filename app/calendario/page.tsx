'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Order } from '@/types';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type CalendarOrder = Order & {
  client_name?: string;
  company_name?: string;
  company_color?: string;
};

type DayEvent = {
  order: CalendarOrder;
  type: 'entrada' | 'entrega' | 'atrasado';
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const EVENT_STYLES: Record<string, string> = {
  entrada: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  entrega: 'bg-green-500/20 text-green-300 border-green-500/30',
  atrasado: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export default function CalendarioPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<CalendarOrder[]>([]);
  const [today] = useState(new Date());
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<'mes' | 'semana'>('mes');
  const [selected, setSelected] = useState<Date | null>(null);

  useEffect(() => {
    api.orders.list({}).then(setOrders).catch(console.error);
  }, []);

  const year = current.getFullYear();
  const month = current.getMonth();

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));

  // Build event map: key = 'YYYY-MM-DD'
  const eventMap = useCallback((): Record<string, DayEvent[]> => {
    const map: Record<string, DayEvent[]> = {};
    const toKey = (d: string) => d?.split('T')[0] ?? '';

    for (const o of orders) {
      const isDelayed = o.status !== 'entregue' && new Date(o.expected_date) < today;

      // Entry event
      const entryKey = toKey(o.entry_date);
      if (entryKey) {
        if (!map[entryKey]) map[entryKey] = [];
        map[entryKey].push({ order: o, type: 'entrada' });
      }

      // Delivery event
      const delKey = toKey(o.expected_date);
      if (delKey) {
        if (!map[delKey]) map[delKey] = [];
        map[delKey].push({ order: o, type: isDelayed ? 'atrasado' : 'entrega' });
      }
    }
    return map;
  }, [orders, today]);

  const events = eventMap();

  // Build calendar grid for month view
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDay + 1;
    cells.push(dayNum >= 1 && dayNum <= daysInMonth ? new Date(year, month, dayNum) : null);
  }

  // Week view
  const getWeekStart = (d: Date) => {
    const day = d.getDay();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  };
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const selectedEvents = selected
    ? events[selected.toISOString().split('T')[0]] || []
    : [];

  const formatKey = (d: Date) => d.toISOString().split('T')[0];
  const isToday = (d: Date) => formatKey(d) === formatKey(today);
  const isSelected = (d: Date) => selected && formatKey(d) === formatKey(selected);

  return (
    <div className="flex h-full flex-col p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Calendário</h1>
          <p className="text-sm text-zinc-500">Entradas e entregas de pedidos</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-zinc-800 overflow-hidden">
            {(['mes', 'semana'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={cn('px-3 py-1.5 text-xs transition-colors capitalize',
                  view === v ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300')}>
                {v === 'mes' ? 'Mês' : 'Semana'}
              </button>
            ))}
          </div>
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={view === 'mes' ? prevMonth : () => setWeekStart(new Date(weekStart.getTime() - 7 * 86400000))}
              className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[140px] text-center text-sm font-medium text-zinc-200">
              {view === 'mes'
                ? `${MONTHS[month]} ${year}`
                : `${weekDays[0].getDate()}/${weekDays[0].getMonth()+1} – ${weekDays[6].getDate()}/${weekDays[6].getMonth()+1}`
              }
            </span>
            <button onClick={view === 'mes' ? nextMonth : () => setWeekStart(new Date(weekStart.getTime() + 7 * 86400000))}
              className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button onClick={() => { setCurrent(new Date(today.getFullYear(), today.getMonth(), 1)); setWeekStart(getWeekStart(today)); }}
            className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-lg px-3 py-1.5 transition-colors">
            Hoje
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        {[
          { label: 'Entrada', style: 'bg-blue-500/20 border border-blue-500/30' },
          { label: 'Entrega', style: 'bg-green-500/20 border border-green-500/30' },
          { label: 'Atrasado', style: 'bg-red-500/20 border border-red-500/30' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-sm ${l.style}`} />
            <span className="text-xs text-zinc-500">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Calendar grid */}
        <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-zinc-800">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium text-zinc-500">{d}</div>
            ))}
          </div>

          {/* Month view */}
          {view === 'mes' && (
            <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: `repeat(${totalCells / 7}, 1fr)` }}>
              {cells.map((day, i) => {
                const key = day ? formatKey(day) : '';
                const dayEvents = day ? (events[key] || []) : [];
                const hasDelay = dayEvents.some(e => e.type === 'atrasado');

                return (
                  <div key={i}
                    onClick={() => day && setSelected(isSelected(day) ? null : day)}
                    className={cn(
                      'border-r border-b border-zinc-800/50 p-1.5 min-h-[80px] transition-colors',
                      day ? 'cursor-pointer hover:bg-zinc-800/40' : 'opacity-0 pointer-events-none',
                      isSelected(day!) && 'bg-zinc-800/60',
                      !day && 'bg-transparent',
                    )}>
                    {day && (
                      <>
                        <div className={cn(
                          'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors',
                          isToday(day) ? 'bg-yellow-500 text-black font-bold' : 'text-zinc-400',
                          hasDelay && !isToday(day) && 'text-red-400',
                        )}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map((ev, ei) => (
                            <div key={ei}
                              onClick={e => { e.stopPropagation(); router.push(`/orders/${ev.order.id}`); }}
                              className={cn('rounded px-1.5 py-0.5 text-[10px] truncate border cursor-pointer hover:opacity-80 transition-opacity', EVENT_STYLES[ev.type])}>
                              {ev.order.number} · {ev.order.client_name}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <p className="text-[10px] text-zinc-600 pl-1">+{dayEvents.length - 3} mais</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Week view */}
          {view === 'semana' && (
            <div className="grid grid-cols-7 flex-1">
              {weekDays.map((day, i) => {
                const key = formatKey(day);
                const dayEvents = events[key] || [];
                return (
                  <div key={i}
                    onClick={() => setSelected(isSelected(day) ? null : day)}
                    className={cn(
                      'border-r border-zinc-800/50 p-2 cursor-pointer hover:bg-zinc-800/40 transition-colors',
                      isSelected(day) && 'bg-zinc-800/60',
                    )}>
                    <div className={cn(
                      'mb-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                      isToday(day) ? 'bg-yellow-500 text-black font-bold' : 'text-zinc-400',
                    )}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map((ev, ei) => (
                        <div key={ei}
                          onClick={e => { e.stopPropagation(); router.push(`/orders/${ev.order.id}`); }}
                          className={cn('rounded px-2 py-1 text-[11px] border cursor-pointer hover:opacity-80 transition-opacity', EVENT_STYLES[ev.type])}>
                          <p className="font-medium truncate">{ev.order.number}</p>
                          <p className="truncate opacity-80">{ev.order.client_name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="w-64 flex-shrink-0 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          {selected ? (
            <>
              <p className="text-xs font-medium text-zinc-400 mb-3">
                {selected.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-zinc-600">Nenhum evento</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((ev, i) => (
                    <div key={i}
                      onClick={() => router.push(`/orders/${ev.order.id}`)}
                      className={cn('rounded-lg border p-3 cursor-pointer hover:opacity-80 transition-opacity', EVENT_STYLES[ev.type])}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {ev.type === 'atrasado' && <AlertCircle className="h-3 w-3 text-red-400" />}
                        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70 capitalize">{ev.type}</span>
                      </div>
                      <p className="text-xs font-semibold">{ev.order.number}</p>
                      <p className="text-[11px] opacity-80">{ev.order.client_name}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ev.order.company_color }} />
                        <span className="text-[10px] opacity-70">{ev.order.company_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-xs text-zinc-600">Clique em um dia para ver os eventos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
