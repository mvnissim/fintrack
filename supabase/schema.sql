-- FinTrack - Schema do Banco de Dados Supabase
-- Execute este arquivo no SQL Editor do Supabase

-- Categorias de despesas
create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  nome text not null,
  cor text not null default '#0D7C66',
  icone text,
  created_at timestamptz default now()
);

-- Despesas fixas mensais
create table if not exists despesas_fixas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  descricao text not null,
  categoria_id uuid references categorias,
  valores jsonb not null default '{}', -- { "2026-01": 300, "2026-02": 350, ... }
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Parcelas de cartão
create table if not exists parcelas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  descricao text not null,
  categoria_id uuid references categorias,
  valor_parcela numeric(10,2) not null,
  total_parcelas integer not null,
  parcela_inicial integer not null default 1,
  mes_inicio text not null, -- "2026-01"
  created_at timestamptz default now()
);

-- Gastos variáveis do cartão por mês
create table if not exists gastos_cartao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  mes text not null, -- "2026-01"
  valor_estimado numeric(10,2),
  valor_real numeric(10,2),
  created_at timestamptz default now(),
  unique(user_id, mes)
);

-- Investimentos por mês
create table if not exists investimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  mes text not null, -- "2026-01"
  tipo text not null, -- 'renda_fixa', 'renda_variavel', 'outro'
  descricao text,
  meta numeric(10,2),
  realizado numeric(10,2),
  created_at timestamptz default now()
);

-- Salário/receita mensal
create table if not exists receitas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  mes text not null, -- "2026-01"
  descricao text not null default 'Salário',
  valor numeric(10,2) not null,
  created_at timestamptz default now()
);

-- RLS: todos os usuários só veem seus próprios dados
alter table categorias enable row level security;
alter table despesas_fixas enable row level security;
alter table parcelas enable row level security;
alter table gastos_cartao enable row level security;
alter table investimentos enable row level security;
alter table receitas enable row level security;

-- Policies
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'categorias' and policyname = 'users own data') then
    create policy "users own data" on categorias for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'despesas_fixas' and policyname = 'users own data') then
    create policy "users own data" on despesas_fixas for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'parcelas' and policyname = 'users own data') then
    create policy "users own data" on parcelas for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'gastos_cartao' and policyname = 'users own data') then
    create policy "users own data" on gastos_cartao for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'investimentos' and policyname = 'users own data') then
    create policy "users own data" on investimentos for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'receitas' and policyname = 'users own data') then
    create policy "users own data" on receitas for all using (auth.uid() = user_id);
  end if;
end $$;
