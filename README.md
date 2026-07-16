# Templo Uno Corp ERP

Sistema ERP completo para gerenciamento das empresas Templo Uno, Templo, Lata e LEA.

## Instalação

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Login padrão

- **Email:** admin@templounocorp.com  
- **Senha:** admin123

## Funcionalidades desta versão

- ✅ Autenticação local (JWT + bcrypt, sem serviços externos)
- ✅ Banco de dados SQLite local (sem internet)
- ✅ Dashboard com 10 cards de KPIs
- ✅ Gráficos: pedidos/mês, faturamento, status, por empresa
- ✅ Módulo de Clientes (CRUD completo)
- ✅ Módulo de Pedidos (criar, listar, filtrar, detalhar)
- ✅ Checklist de produção (Tecido → Corte → Costura → Silk → Bordado → DTG → Limpeza → Entrega)
- ✅ Linha do tempo com data/hora/responsável
- ✅ Controle financeiro por pedido (pagamentos parciais/totais)
- ✅ Histórico automático de todas as ações
- ✅ Painel financeiro com gráficos por empresa
- ✅ 4 empresas configuradas (Templo Uno, Templo, Lata, LEA) com cores
- ✅ Dark theme premium (estilo Stripe/Linear/Vercel)
- ✅ Responsivo

## Stack

- Next.js 16 + TypeScript
- Tailwind CSS
- better-sqlite3 (banco local)
- JWT + bcrypt (auth local)
- Recharts (gráficos)
- Lucide React (ícones)
- Zustand (estado global)

## Próximas versões

- Kanban de produção com drag-and-drop
- Calendário de entregas
- Exportação PDF/Excel
- CEO Dashboard executivo
- PWA (instalação como app)
- Backup automático do banco
