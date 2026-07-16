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
