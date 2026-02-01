-- ===========================
-- SUPABASE SCHEMA (MVP)
-- ===========================

-- 1) Cardápio
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  description text,
  category text,
  price_cents int not null check (price_cents >= 0),
  is_active boolean not null default true
);

create index if not exists menu_items_active_idx on public.menu_items (is_active);
create index if not exists menu_items_category_idx on public.menu_items (category);

-- 2) Taxa de entrega (opcional)
create table if not exists public.delivery_fees (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  neighborhood text not null,
  fee_cents int not null check (fee_cents >= 0)
);

create index if not exists delivery_fees_neighborhood_idx on public.delivery_fees (neighborhood);

-- 3) Pedidos
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  from_phone text not null,
  customer_name text,
  fulfillment text not null check (fulfillment in ('delivery', 'pickup')),
  address text,
  neighborhood text,
  payment_method text,
  items jsonb not null default '[]'::jsonb,
  subtotal_cents int not null default 0,
  delivery_fee_cents int not null default 0,
  total_cents int not null default 0,
  status text not null default 'received' check (status in ('received','preparing','out_for_delivery','delivered','canceled'))
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_phone_idx on public.orders (from_phone);

-- 4) Conversas (estado/contexto por telefone)
create table if not exists public.conversations (
  from_phone text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  state jsonb not null default '{}'::jsonb,
  last_messages jsonb not null default '[]'::jsonb
);

-- Segurança (MVP):
-- Para simplificar o MVP, as tabelas ficam acessíveis via service role (server-side).
-- Para produção multi-usuários, implemente RLS com políticas e autenticação.

-- Dados de exemplo (opcional)
insert into public.menu_items (name, description, category, price_cents, is_active)
values
('X-Salada', 'Pão, hambúrguer, queijo, alface, tomate, maionese', 'Lanches', 1990, true),
('X-Bacon', 'Pão, hambúrguer, queijo, bacon, maionese', 'Lanches', 2490, true),
('Batata Frita P', 'Porção pequena', 'Acompanhamentos', 1290, true),
('Refrigerante Lata', '350ml', 'Bebidas', 690, true)
on conflict do nothing;

insert into public.delivery_fees (neighborhood, fee_cents)
values
('Centro', 500),
('Jardim', 700)
on conflict do nothing;
