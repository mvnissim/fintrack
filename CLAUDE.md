# FinTrack — Contexto do Projeto

App de gestão financeira pessoal construído com Next.js 14 (App Router), TypeScript, Tailwind CSS e Supabase.

## Stack
- **Framework**: Next.js 14 com App Router
- **Linguagem**: TypeScript
- **Estilo**: Tailwind CSS + CSS Variables (design tokens em globals.css)
- **Backend**: Supabase (Auth + Postgres + Realtime)
- **Gráficos**: Recharts
- **Cache**: @tanstack/react-query
- **Deploy**: Vercel

## Estrutura do Projeto

```
src/
├── app/
│   ├── layout.tsx          # Root layout (fonts DM Sans + Syne, QueryProvider)
│   ├── page.tsx            # Redirect para /dashboard
│   ├── login/page.tsx      # Página de login/cadastro
│   └── (app)/              # Route group — páginas autenticadas
│       ├── layout.tsx      # AppLayout com Sidebar + Topbar + MonthProvider
│       ├── dashboard/
│       ├── despesas-fixas/
│       ├── parcelas/
│       ├── cartao/
│       └── investimentos/
├── components/
│   ├── layout/             # Sidebar, Topbar
│   ├── ui/                 # InlineEdit, CategoryTag
│   └── dashboard/          # SummaryCards, CommitmentBar, CategoryPieChart, MonthlyBarChart, TopExpenses
├── contexts/
│   └── MonthContext.tsx    # Mês selecionado global (currentMonth, nextMonth, prevMonth)
├── lib/
│   ├── supabase/           # client.ts (browser) + server.ts (SSR)
│   ├── utils.ts            # formatCurrency, addMonths, isParcelaActiveInMonth, etc.
│   └── seed.ts             # Popula dados iniciais após primeiro login
├── providers/
│   └── QueryProvider.tsx   # React Query client
└── types/
    └── index.ts            # Interfaces TypeScript para todas as tabelas
```

## Banco de Dados (Supabase)
Tabelas: `categorias`, `despesas_fixas`, `parcelas`, `gastos_cartao`, `investimentos`, `receitas`

- `despesas_fixas.valores`: JSONB com chaves `"YYYY-MM"` e valores numéricos
- `parcelas.mes_inicio`: string `"YYYY-MM"` de início das parcelas
- Row Level Security (RLS) ativo em todas as tabelas

## Design System
- **Fonte display**: Syne (700 logo, 600 títulos, 500 valores grandes)
- **Fonte corpo**: DM Sans (400 regular, 500 medium)
- **Cor primária**: `#0D7C66` (verde)
- **Perigo**: `#D85A30` | **Alerta**: `#EF9F27`
- Tokens como CSS variables em `globals.css`

## Filosofia de UX
- **Edição inline**: `InlineEdit` component — clicar no valor abre input, onBlur salva no Supabase
- **Sem modais**: formulários inline ou popover
- **Auto-save**: nenhum botão "Salvar" explícito
- **Mobile-first**: sidebar colapsável em telas pequenas (futuro)

## Seed de Dados
`src/lib/seed.ts` — executado automaticamente no primeiro login via `useEffect` no Dashboard.
Contém despesas fixas reais de Jan/2026 e parcelas ativas.

## Variáveis de Ambiente
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=   # reservado para feature de IA futura
```

## Comandos
```bash
npm run dev      # desenvolvimento
npm run build    # build de produção
npm run lint     # eslint
```
