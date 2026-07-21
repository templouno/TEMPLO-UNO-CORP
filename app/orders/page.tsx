'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order, Company, Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge, PaymentBadge } from '@/components/StatusBadge';
import { Plus, Search, Eye, Printer, Trash2, Loader2, X, Package } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' }, { value: 'transferencia', label: 'Transferência' },
  { value: 'dinheiro', label: 'Dinheiro' }, { value: 'cartao', label: 'Cartão' }, { value: 'boleto', label: 'Boleto' },
];

const emptyProduct = { name: '', reference: '', color: '', size: '', quantity: 1, unit_value: 0, notes: '' };

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_id: '', company_id: '', expected_date: '', payment_method: 'pix', notes: '' });
  const [products, setProducts] = useState([{ ...emptyProduct }]);

  const loadOrders = useCallback(() => {
    setLoading(true);
    api.orders.list({ search, status: filterStatus, company: filterCompany })
      .then(setOrders).finally(() => setLoading(false));
  }, [search, filterStatus, filterCompany]);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => {
    api.companies.list().then(setCompanies);
    api.clients.list().then(setClients);
  }, []);

  const totalProducts = products.reduce((s, p) => s + (p.quantity * p.unit_value), 0);

  const handleSave = async () => {
    if (!form.client_id || !form.company_id || !form.expected_date) return alert('Preencha os campos obrigatórios');
    setSaving(true);
    try {
      await api.orders.create({ ...form, products });
      setDialogOpen(false);
      setForm({ client_id: '', company_id: '', expected_date: '', payment_method: 'pix', notes: '' });
      setProducts([{ ...emptyProduct }]);
      loadOrders();
    } catch (e) { alert('Erro ao criar pedido'); }
    finally { setSaving(false); }
  };

  const addProduct = () => setProducts(p => [...p, { ...emptyProduct }]);
  const removeProduct = (i: number) => setProducts(p => p.filter((_, idx) => idx !== i));
  const updateProduct = (i: number, key: string, val: string | number) =>
    setProducts(p => p.map((item, idx) => idx === i ? { ...item, [key]: val } : item));

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir pedido?')) return;
    await api.orders.delete(id);
    loadOrders();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Pedidos</h1>
          <p className="text-sm text-zinc-500">{orders.length} pedidos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" />Novo Pedido</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input className="pl-9" placeholder="Buscar pedido ou cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-36">
          <option value="">Todos status</option>
          <option value="producao">Produção</option>
          <option value="entregue">Entregue</option>
          <option value="atrasado">Atrasado</option>
        </Select>
        <Select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} className="w-36">
          <option value="">Todas empresas</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-yellow-500" /></div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
          <Package className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                {['Pedido','Cliente','Empresa','Entrada','Entrega','Pagamento','Status','Etapa','Valor',''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {orders.map((o: Order & { client_name?: string; company_name?: string; company_color?: string; current_step?: string }) => (
                <tr key={o.id} className="bg-zinc-900 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-3 py-3 text-xs font-mono text-yellow-500">{o.number}</td>
                  <td className="px-3 py-3 text-sm text-zinc-200">{o.client_name}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: o.company_color }} />
                      {o.company_name}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-500">{formatDate(o.entry_date)}</td>
                  <td className="px-3 py-3 text-xs text-zinc-500">{formatDate(o.expected_date)}</td>
                  <td className="px-3 py-3"><PaymentBadge status={o.payment_status} /></td>
                  <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-3 py-3 text-xs text-zinc-500">{o.current_step || '-'}</td>
                  <td className="px-3 py-3 text-sm font-medium text-zinc-200">{formatCurrency(o.total_value)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => router.push(`/orders/${o.id}`)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(o.id)} className="rounded p-1.5 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Order Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader onClose={() => setDialogOpen(false)}>Novo Pedido</DialogHeader>
        <DialogBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Cliente *</label>
              <Select value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}>
                <option value="">Selecionar cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Empresa *</label>
              <Select value={form.company_id} onChange={e => setForm(p => ({ ...p, company_id: e.target.value }))}>
                <option value="">Selecionar empresa</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Data de Entrega *</label>
              <Input type="date" value={form.expected_date} onChange={e => setForm(p => ({ ...p, expected_date: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Forma de Pagamento</label>
              <Select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-zinc-400">Observações</label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
          </div>

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-zinc-400">Produtos</p>
              <button onClick={addProduct} className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1">
                <Plus className="h-3 w-3" />Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {products.map((p, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input placeholder="Nome do produto *" value={p.name} onChange={e => updateProduct(i, 'name', e.target.value)} className="col-span-2 text-xs h-8" />
                      <Input placeholder="Referência" value={p.reference} onChange={e => updateProduct(i, 'reference', e.target.value)} className="text-xs h-8" />
                      <Input placeholder="Cor" value={p.color} onChange={e => updateProduct(i, 'color', e.target.value)} className="text-xs h-8" />
                      <Input placeholder="Tamanho" value={p.size} onChange={e => updateProduct(i, 'size', e.target.value)} className="text-xs h-8" />
                      <div className="grid grid-cols-2 gap-1">
                        <Input type="number" placeholder="Qtd" value={p.quantity} onChange={e => updateProduct(i, 'quantity', +e.target.value)} className="text-xs h-8" />
                        <Input type="number" placeholder="R$ unit." value={p.unit_value} onChange={e => updateProduct(i, 'unit_value', +e.target.value)} className="text-xs h-8" />
                      </div>
                    </div>
                    {products.length > 1 && (
                      <button onClick={() => removeProduct(i)} className="mt-1 text-zinc-600 hover:text-red-400 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {p.name && p.quantity > 0 && p.unit_value > 0 && (
                    <p className="mt-1.5 text-xs text-zinc-500">= {formatCurrency(p.quantity * p.unit_value)}</p>
                  )}
                </div>
              ))}
            </div>
            {totalProducts > 0 && (
              <div className="mt-3 flex justify-end">
                <p className="text-sm font-semibold text-zinc-100">Total: {formatCurrency(totalProducts)}</p>
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Pedido'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
