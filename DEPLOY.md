# Deploy no Railway — Templo Uno Corp ERP

## Pré-requisitos

- Conta gratuita no [Railway](https://railway.app) (login com GitHub)
- Conta gratuita no [GitHub](https://github.com)
- Git instalado no computador

---

## Passo 1 — Criar repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Nome do repositório: `templo-uno-erp`
3. Marque **Private** (repositório privado)
4. Clique em **Create repository**

---

## Passo 2 — Enviar o código para o GitHub

Abra o terminal na pasta do projeto e execute:

```bash
git init
git add .
git commit -m "Templo Uno Corp ERP v4"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/templo-uno-erp.git
git push -u origin main
```

> Substitua `SEU_USUARIO` pelo seu usuário do GitHub

---

## Passo 3 — Criar projeto no Railway

1. Acesse [railway.app](https://railway.app) e faça login
2. Clique em **New Project**
3. Escolha **Deploy from GitHub repo**
4. Selecione o repositório `templo-uno-erp`
5. Railway detecta Next.js automaticamente e inicia o build

---

## Passo 4 — Adicionar Volume (banco de dados persistente)

**Este passo é essencial** — sem ele o banco some a cada deploy.

1. No painel do projeto, clique no serviço
2. Vá em **Volumes** → **Add Volume**
3. Configure:
   - **Mount Path:** `/data`
   - **Size:** 1 GB (gratuito)
4. Clique em **Create**

---

## Passo 5 — Configurar variáveis de ambiente

1. No painel do serviço, vá em **Variables**
2. Clique em **Add Variable** e adicione:

| Nome | Valor |
|------|-------|
| `JWT_SECRET` | Uma frase longa e aleatória (ex: `templo-uno-2025-chave-super-secreta-xyz`) |
| `NODE_ENV` | `production` |

3. Clique em **Deploy** para aplicar

---

## Passo 6 — Acessar o sistema

1. No painel do Railway, vá em **Settings** → **Networking**
2. Clique em **Generate Domain**
3. Railway gera um link tipo: `https://templo-uno-erp-production.up.railway.app`
4. Acesse esse link de qualquer dispositivo

**Login padrão:**
- Email: `admin@templounocorp.com`
- Senha: `admin123`

> **Troque a senha após o primeiro acesso** em Configurações

---

## Custos

| Plano | Custo | Limite |
|-------|-------|--------|
| Hobby (gratuito) | R$ 0 | $5 de crédito/mês |
| Pro | ~R$ 30/mês | Sem limite |

Para a operação inicial da Templo Uno, o plano gratuito é suficiente.

---

## Atualizações futuras

Sempre que receber código novo, basta executar:

```bash
git add .
git commit -m "Atualização"
git push
```

Railway faz o redeploy automaticamente em ~2 minutos.

---

## Backup dos dados

Acesse `/configuracoes` dentro do sistema e clique em **Baixar Backup**.
Salve o arquivo `.db` em local seguro regularmente.

---

# Deploy no Render (alternativa)

## Passo 1 — GitHub (igual ao Railway)

Siga os passos 1 e 2 do guia Railway acima para enviar o código ao GitHub.

---

## Passo 2 — Criar Web Service no Render

1. Acesse [render.com](https://render.com) e faça login com GitHub
2. Clique em **New** → **Web Service**
3. Conecte o repositório `templo-uno-erp`
4. Configure:
   - **Name:** `templo-uno-erp`
   - **Region:** Oregon (US West)
   - **Branch:** `main`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free

---

## Passo 3 — Adicionar Disco persistente

1. Na tela de criação, role até **Advanced**
2. Clique em **Add Disk**
3. Configure:
   - **Name:** `erp-data`
   - **Mount Path:** `/var/data`
   - **Size:** 1 GB

> ⚠️ O disco persistente no Render **custa ~$0.25/GB/mês** — R$ 1,50/mês aprox.
> Sem ele, o banco some a cada deploy.

---

## Passo 4 — Variáveis de ambiente

Em **Environment** adicione:

| Nome | Valor |
|------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Frase longa e aleatória |
| `DATABASE_PATH` | `/var/data/templo-uno-erp.db` |

---

## Passo 5 — Deploy

Clique em **Create Web Service**. O build leva ~3 minutos.

Render gera um link tipo: `https://templo-uno-erp.onrender.com`

---

## ⚠️ Atenção: hibernação no plano gratuito

No plano **Free** do Render, o servidor hiberna após **15 minutos sem acesso**.
O primeiro acesso depois da hibernação demora ~30 segundos para carregar.

Para evitar isso, upgrada para o plano **Starter** (~$7/mês) ou usa o Railway.

---

## Comparativo Railway vs Render

| | Railway | Render |
|--|---------|--------|
| Plano gratuito | $5 crédito/mês | Sim (com hibernação) |
| Hibernação | Não | Sim (plano free) |
| Disco persistente | Gratuito | ~R$1,50/mês |
| Deploy automático | Sim | Sim |
| Facilidade | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**Recomendação:** Railway para começar sem custo. Render se já tem conta lá.
