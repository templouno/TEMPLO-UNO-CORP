'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { Order, Product, ChecklistItem, HistoryEntry } from '@/types';
import { CHECKLIST_STEPS, STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { StatusBadge, PaymentBadge } from '@/components/StatusBadge';
import { ArrowLeft, CheckCircle2, Circle, Clock, DollarSign, Package, FileText, Download, Loader2, Plus } from 'lucide-react';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order & { client_name?: string; client_phone?: string; client_email?: string; company_name?: string; company_color?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [payDialog, setPayDialog] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'pix', notes: '' });
  const [payLoading, setPayLoading] = useState(false);
  const [statusForm, setStatusForm] = useState('');

  const load = () => {
    setLoading(true);
    api.orders.get(id).then(o => { setOrder(o); setStatusForm(o.status); }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const toggleChecklist = async (step: string, completed: boolean) => {
    await api.orders.updateChecklist(id, step, !completed);
    load();
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusForm(newStatus);
    await api.orders.update(id, { ...order, status: newStatus });
    load();
  };

  const handlePayment = async () => {
    if (!payForm.amount) return;
    setPayLoading(true);
    try {
      await api.orders.addPayment(id, { amount: parseFloat(payForm.amount), method: payForm.method, notes: payForm.notes });
      setPayDialog(false);
      setPayForm({ amount: '', method: 'pix', notes: '' });
      load();
    } finally { setPayLoading(false); }
  };

  const handlePrint = () => window.print();

  const [pdfLoading, setPdfLoading] = useState(false);
  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const token = localStorage.getItem('erp_token');
      const res = await fetch(`/api/orders/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao gerar PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pedido-${order?.number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erro ao gerar PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-yellow-500" /></div>;
  if (!order) return <div className="p-6 text-zinc-500">Pedido não encontrado</div>;

  const checklist = (order.checklist || []) as ChecklistItem[];
  const completedSteps = checklist.filter(c => c.completed).length;
  const progress = CHECKLIST_STEPS.length > 0 ? (completedSteps / CHECKLIST_STEPS.length) * 100 : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-100 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-zinc-100 font-mono">{order.number}</h1>
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.payment_status} />
          </div>
          <p className="text-sm text-zinc-500">{order.client_name} · {order.company_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusForm} onChange={e => handleStatusChange(e.target.value)} className="w-36">
            <option value="producao">🟡 Produção</option>
            <option value="entregue">🟢 Entregue</option>
            <option value="atrasado">🔴 Atrasado</option>
          </Select>
          <Button variant="outline" size="sm" onClick={handlePrint}><FileText className="h-4 w-4" />Imprimir</Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={pdfLoading}>
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF
          </Button>
          <Button size="sm" onClick={() => setPayDialog(true)}><DollarSign className="h-4 w-4" />Pagamento</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left column */}
        <div className="col-span-2 space-y-4">
          {/* Info card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xs font-medium text-zinc-500 mb-4 uppercase tracking-wider">Informações</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: 'Cliente', value: order.client_name },
                { label: 'Empresa', value: order.company_name },
                { label: 'Entrada', value: formatDate(order.entry_date) },
                { label: 'Previsão de Entrega', value: formatDate(order.expected_date) },
                { label: 'Entrega Real', value: formatDate(order.delivery_date) },
                { label: 'Forma de Pagamento', value: order.payment_method ? PAYMENT_METHOD_LABELS[order.payment_method] : '-' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-zinc-600 mb-0.5">{label}</p>
                  <p className="text-sm text-zinc-200">{value || '-'}</p>
                </div>
              ))}
              {order.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-zinc-600 mb-0.5">Observações</p>
                  <p className="text-sm text-zinc-400">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Products */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xs font-medium text-zinc-500 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Package className="h-3.5 w-3.5" />Produtos
            </h2>
            {(order.products || []).length === 0 ? (
              <p className="text-sm text-zinc-600">Nenhum produto</p>
            ) : (
              <table className="w-full">
                <thead><tr className="border-b border-zinc-800">
                  {['Produto','Ref','Cor','Tam','Qtd','Unit.','Total'].map(h => (
                    <th key={h} className="pb-2 text-left text-xs text-zinc-600">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {(order.products || []).map((p: Product) => (
                    <tr key={p.id}>
                      <td className="py-2 text-sm text-zinc-200">{p.name}</td>
                      <td className="py-2 text-xs text-zinc-500">{p.reference || '-'}</td>
                      <td className="py-2 text-xs text-zinc-500">{p.color || '-'}</td>
                      <td className="py-2 text-xs text-zinc-500">{p.size || '-'}</td>
                      <td className="py-2 text-xs text-zinc-400">{p.quantity}</td>
                      <td className="py-2 text-xs text-zinc-400">{formatCurrency(p.unit_value)}</td>
                      <td className="py-2 text-sm font-medium text-zinc-200">{formatCurrency(p.total_value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Checklist / Timeline */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Produção</h2>
              <span className="text-xs text-zinc-500">{completedSteps}/{CHECKLIST_STEPS.length} etapas</span>
            </div>
            <div className="mb-4 h-1.5 w-full rounded-full bg-zinc-800">
              <div className="h-1.5 rounded-full bg-yellow-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="space-y-2">
              {checklist.map((item: ChecklistItem & { user_name?: string }) => (
                <div key={item.step} className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  onClick={() => toggleChecklist(item.step, item.completed)}>
                  {item.completed
                    ? <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    : <Circle className="h-5 w-5 text-zinc-600 flex-shrink-0" />
                  }
                  <div className="flex-1">
                    <p className={`text-sm ${item.completed ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>{item.step}</p>
                    {item.completed && item.completed_at && (
                      <p className="text-xs text-zinc-600">{formatDateTime(item.completed_at)}{item.user_name ? ` · ${item.user_name}` : ''}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Financial */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xs font-medium text-zinc-500 mb-4 uppercase tracking-wider">Financeiro</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500">Total</span>
                <span className="text-sm font-semibold text-zinc-100">{formatCurrency(order.total_value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500">Recebido</span>
                <span className="text-sm font-medium text-green-400">{formatCurrency(order.received_value)}</span>
              </div>
              <div className="h-px bg-zinc-800" />
              <div className="flex justify-between">
                <span className="text-xs text-zinc-500">Pendente</span>
                <span className="text-sm font-semibold text-red-400">{formatCurrency(order.total_value - order.received_value)}</span>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xs font-medium text-zinc-500 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />Histórico
            </h2>
            <div className="space-y-3">
              {(order.history || []).length === 0
                ? <p className="text-xs text-zinc-600">Nenhum registro</p>
                : (order.history || []).map((h: HistoryEntry & { user_name?: string }) => (
                  <div key={h.id} className="flex gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-300">{h.description}</p>
                      <p className="text-[10px] text-zinc-600">{formatDateTime(h.created_at)}{h.user_name ? ` · ${h.user_name}` : ''}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={payDialog} onClose={() => setPayDialog(false)}>
        <DialogHeader onClose={() => setPayDialog(false)}>Registrar Pagamento</DialogHeader>
        <DialogBody className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Valor (R$)</label>
            <Input type="number" step="0.01" value={payForm.amount}
              onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
              placeholder={`Saldo: ${formatCurrency(order.total_value - order.received_value)}`} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Forma de Pagamento</label>
            <Select value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))}>
              <option value="pix">PIX</option>
              <option value="transferencia">Transferência</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao">Cartão</option>
              <option value="boleto">Boleto</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Observações</label>
            <Input value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setPayDialog(false)}>Cancelar</Button>
          <Button onClick={handlePayment} disabled={payLoading || !payForm.amount}>
            {payLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
