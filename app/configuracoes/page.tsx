'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Database, FileSpreadsheet, Users, DollarSign, Package, Loader2, CheckCircle2, Smartphone, Monitor, Wifi, WifiOff } from 'lucide-react';

function useDownload() {
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const download = async (url: string, label: string) => {
    setLoading(label);
    setDone(null);
    try {
      const token = localStorage.getItem('erp_token');
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro');
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || 'download';
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
      setDone(label);
      setTimeout(() => setDone(null), 3000);
    } catch { alert('Erro ao baixar'); }
    finally { setLoading(null); }
  };

  return { loading, done, download };
}

export default function ConfiguracoesPage() {
  const { loading, done, download } = useDownload();
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const exportItems = [
    { label: 'Pedidos (CSV)', icon: Package, url: '/api/export?type=orders', desc: 'Todos os pedidos com status, valores e datas' },
    { label: 'Clientes (CSV)', icon: Users, url: '/api/export?type=clients', desc: 'Base de clientes com histórico de compras' },
    { label: 'Financeiro (CSV)', icon: DollarSign, url: '/api/export?type=financeiro', desc: 'Pagamentos e pendências por pedido' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Configurações</h1>
        <p className="text-sm text-zinc-500">Backup, exportação e administração do sistema</p>
      </div>

      {/* Backup */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-yellow-500" />
            <CardTitle className="text-zinc-100 text-sm">Backup do Banco de Dados</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-zinc-500 leading-relaxed">
            Baixa uma cópia completa do banco SQLite. Salve em local seguro regularmente.
            Uma cópia também é salva automaticamente na pasta <code className="bg-zinc-800 px-1 rounded text-yellow-400">backups/</code> do projeto.
          </p>
          <Button
            onClick={() => download('/api/backup', 'backup')}
            disabled={loading === 'backup'}
            variant="outline"
            className="gap-2"
          >
            {loading === 'backup'
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : done === 'backup'
              ? <CheckCircle2 className="h-4 w-4 text-green-400" />
              : <Download className="h-4 w-4" />}
            {done === 'backup' ? 'Baixado!' : 'Baixar Backup (.db)'}
          </Button>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-500 font-medium mb-1">Como restaurar:</p>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Substitua o arquivo <code className="text-zinc-400">dev.db</code> na raiz do projeto pelo arquivo de backup e reinicie o servidor.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-green-500" />
            <CardTitle className="text-zinc-100 text-sm">Exportação de Dados</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-zinc-500 mb-4">
            Exporte dados para CSV — compatível com Excel, Google Sheets e qualquer planilha.
          </p>
          <div className="space-y-2">
            {exportItems.map(item => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-zinc-800 p-1.5">
                    <item.icon className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-200">{item.label}</p>
                    <p className="text-[11px] text-zinc-600">{item.desc}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => download(item.url, item.label)}
                  disabled={loading === item.label}
                  className="gap-1.5 flex-shrink-0"
                >
                  {loading === item.label
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : done === item.label
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    : <Download className="h-3.5 w-3.5" />}
                  {done === item.label ? 'OK' : 'CSV'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PWA Status */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-zinc-100 text-sm">App Instalável (PWA)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <Monitor className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-zinc-300">Modo de Exibição</p>
                <p className="text-[11px] text-zinc-500">{isStandalone ? '✅ App instalado' : '🌐 Navegador'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              {isOnline
                ? <Wifi className="h-4 w-4 text-green-400 flex-shrink-0" />
                : <WifiOff className="h-4 w-4 text-red-400 flex-shrink-0" />}
              <div>
                <p className="text-xs font-medium text-zinc-300">Conexão</p>
                <p className="text-[11px] text-zinc-500">{isOnline ? '✅ Online' : '🔴 Offline'}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2">
            <p className="text-xs font-medium text-zinc-400">Como instalar:</p>
            <div className="space-y-1 text-[11px] text-zinc-600">
              <p>📱 <strong className="text-zinc-500">Android:</strong> Chrome → menu (⋮) → "Adicionar à tela inicial"</p>
              <p>🍎 <strong className="text-zinc-500">iPhone/iPad:</strong> Safari → compartilhar (□↑) → "Adicionar à Tela Inicial"</p>
              <p>💻 <strong className="text-zinc-500">Windows/Mac:</strong> Chrome/Edge → ícone de instalação (⊕) na barra de endereço</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle className="text-zinc-100 text-sm">Sistema</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: 'Stack', value: 'Next.js + TypeScript' },
              { label: 'Banco de Dados', value: 'SQLite (local)' },
              { label: 'Autenticação', value: 'JWT + bcrypt' },
              { label: 'PDF', value: '@react-pdf/renderer' },
              { label: 'PWA', value: 'next-pwa + Service Worker' },
              { label: 'Versão', value: 'v3.0 — 2025' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-zinc-600 mb-0.5">{label}</p>
                <p className="text-zinc-300 font-medium">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
