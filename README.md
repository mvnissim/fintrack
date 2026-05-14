# FinTrack

Gestão financeira pessoal — Next.js 14, Supabase, Tailwind CSS.

## Setup

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie `.env.local` e preencha com suas credenciais do Supabase:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Configurar o banco de dados Supabase
1. Acesse o [Supabase Dashboard](https://supabase.com)
2. Crie um novo projeto
3. Vá em **SQL Editor** e execute o conteúdo de `supabase/schema.sql`

### 4. Rodar o servidor
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Deploy no Vercel

1. Push para o repositório Git
2. Importe o projeto no [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente no painel do Vercel
4. Deploy automático a cada push na branch `main`

## Estrutura de Páginas

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Visão geral do mês: receitas, comprometido, saldo, gráficos |
| `/despesas-fixas` | Tabela anual de despesas fixas — editável inline |
| `/parcelas` | Parcelas de cartão com progresso visual |
| `/cartao` | Gastos variáveis estimado vs real |
| `/investimentos` | Metas de investimento por tipo |

## Dados Iniciais

Na primeira vez que fizer login, o sistema popula automaticamente com:
- 9 despesas fixas mensais (escola, água, energia, etc.)
- 10 parcelas ativas
- Metas de investimento mensais (Renda Fixa R$ 2.000 + Renda Variável R$ 500)
