'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order } from '@/types';
import { Loader2, GripVertical, Eye, AlertCircle } from 'lucide-react';

// Kanban columns with their checklist step mapping
const COLUMNS = [
  { id: 'aguardando', label: 'Aguardando Material', color: '#71717a', step: null },
  { id: 'corte',      label: 'Corte',               color: '#3B82F6', step: 'Corte' },
  { id: 'costura',    label: 'Costura',              color: '#8B5CF6', step: 'Costura' },
  { id: 'personalizacao', label: 'Personalização',  color: '#F97316', step: 'Silk' },
  { id: 'limpeza',    label: 'Limpeza',              color: '#EAB308', step: 'Limpeza' },
  { id: 'pronto',     label: 'Pronto',               color: '#22C55E', step: null },
  { id: 'entregue',   label: 'Entregue',             color: '#16A34A', step: 'Entrega' },
];

type KanbanOrder = Order & {
  client_name?: string;
  company_name?: string;
  company_color?: string;
  current_step?: string;
  kanban_col?: string;
};

// Map current_step to column
function getColumn(order: KanbanOrder): string {
  if (order.status === 'entregue') return 'entregue';
  const step = order.current_step;
  if (!step) return 'aguardando';
  if (step === 'Corte') return 'corte';
  if (step === 'Costura') return 'costura';
  if (step === 'Silk' || step === 'Bordado' || step === 'DTG') return 'personalizacao';
  if (step === 'Limpeza') return 'limpeza';
  if (step === 'Entrega') return 'pronto';
  return 'aguardando';
}

export default function KanbanPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<KanbanOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<Record<string, KanbanOrder[]>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const dragItem = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.orders.list({ status: '' });
      const enriched = data.map((o: KanbanOrder) => ({ ...o, kanban_col: getColumn(o) }));
      setOrders(enriched);
      // Group by column
      const grouped: Record<string, KanbanOrder[]> = {};
      for (const col of COLUMNS) grouped[col.id] = [];
      for (const o of enriched) {
        const col = o.kanban_col || 'aguardando';
        if (grouped[col]) grouped[col].push(o);
      }
      setColumns(grouped);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Drag handlers
  const onDragStart = (orderId: string) => {
    dragItem.current = orderId;
    setDragging(orderId);
  };

  const onDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOver(colId);
  };

  const onDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const orderId = dragItem.current;
    if (!orderId) return;

    const order = orders.find(o => o.id === orderId);
    if (!order || order.kanban_col === targetColId) {
      setDragging(null);
      setDragOver(null);
      dragItem.current = null;
      return;
    }

    // Optimistic update
    setColumns(prev => {
      const next = { ...prev };
      const sourceCol = order.kanban_col || 'aguardando';
      next[sourceCol] = next[sourceCol].filter(o => o.id !== orderId);
      const updated = { ...order, kanban_col: targetColId };
      next[targetColId] = [...(next[targetColId] || []), updated];
      return next;
    });

    // Update status if moving to/from entregue
    if (targetColId === 'entregue') {
      await api.orders.update(orderId, {
        ...order, status: 'entregue', delivery_date: new Date().toISOString(),
      });
    } else if (order.status === 'entregue') {
      await api.orders.update(orderId, { ...order, status: 'producao', delivery_date: null });
    }

    // Update checklist step based on column
    const targetCol = COLUMNS.find(c => c.id === targetColId);
    if (targetCol?.step) {
      await api.orders.updateChecklist(orderId, targetCol.step, true);
    }

    setDragging(null);
    setDragOver(null);
    dragItem.current = null;
  };

  const onDragEnd = () => {
    setDragging(null);
    setDragOver(null);
    dragItem.current = null;
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Kanban de Produção</h1>
          <p className="text-sm text-zinc-500">{orders.filter(o => o.status !== 'entregue').length} pedidos ativos</p>
        </div>
        <button onClick={load} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700">
          Atualizar
        </button>
      </div>

      {/* Board */}
      <div className="flex flex-1 gap-3 overflow-x-auto p-4 pb-6">
        {COLUMNS.map(col => {
          const colOrders = columns[col.id] || [];
          const isOver = dragOver === col.id;

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-xl border transition-colors flex-shrink-0 w-60 ${
                isOver ? 'border-zinc-500 bg-zinc-800/80' : 'border-zinc-800 bg-zinc-900/60'
              }`}
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={e => onDrop(e, col.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                  <span className="text-xs font-medium text-zinc-300 leading-tight">{col.label}</span>
                </div>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  {colOrders.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 p-2 flex-1 overflow-y-auto">
                {colOrders.length === 0 ? (
                  <div className={`flex items-center justify-center h-20 rounded-lg border border-dashed transition-colors ${isOver ? 'border-zinc-500 bg-zinc-700/30' : 'border-zinc-800'}`}>
                    <p className="text-xs text-zinc-700">Soltar aqui</p>
                  </div>
                ) : (
                  colOrders.map(order => (
                    <KanbanCard
                      key={order.id}
                      order={order}
                      isDragging={dragging === order.id}
                      onDragStart={() => onDragStart(order.id)}
                      onDragEnd={onDragEnd}
                      onView={() => router.push(`/orders/${order.id}`)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({
  order, isDragging, onDragStart, onDragEnd, onView
}: {
  order: KanbanOrder;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onView: () => void;
}) {
  const isDelayed = order.status === 'atrasado' ||
    (order.status !== 'entregue' && new Date(order.expected_date) < new Date());

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group rounded-lg border bg-zinc-900 p-3 cursor-grab active:cursor-grabbing transition-all select-none ${
        isDragging ? 'opacity-40 scale-95 border-zinc-600' : 'border-zinc-800 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/40'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-1 mb-2">
        <span className="font-mono text-[11px] text-yellow-500 font-semibold leading-none">{order.number}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onView} className="rounded p-0.5 text-zinc-500 hover:text-zinc-200 transition-colors">
            <Eye className="h-3.5 w-3.5" />
          </button>
          <GripVertical className="h-3.5 w-3.5 text-zinc-700" />
        </div>
      </div>

      {/* Client */}
      <p className="text-sm font-medium text-zinc-200 leading-tight mb-1">{order.client_name}</p>

      {/* Company badge */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: order.company_color }} />
        <span className="text-[11px] text-zinc-500">{order.company_name}</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-zinc-800 pt-2 mt-2">
        <div className={`flex items-center gap-1 text-[10px] ${isDelayed ? 'text-red-400' : 'text-zinc-500'}`}>
          {isDelayed && <AlertCircle className="h-3 w-3" />}
          {formatDate(order.expected_date)}
        </div>
        <span className="text-[11px] font-semibold text-zinc-300">{formatCurrency(order.total_value)}</span>
      </div>
    </div>
  );
}
