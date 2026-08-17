-- Phase 4: persistent application data model
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  weekly_budget numeric(12,2) default 0 check (weekly_budget >= 0),
  nutrition_goal text default 'General wellness',
  constraints text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  contact_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  name text not null,
  source_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  name text not null,
  description text,
  ingredients jsonb not null default '[]'::jsonb,
  allergens jsonb not null default '[]'::jsonb,
  dietary_attributes jsonb not null default '[]'::jsonb,
  nutrition_attributes jsonb not null default '[]'::jsonb,
  ai_confidence numeric(5,4),
  uncertainties jsonb not null default '[]'::jsonb,
  ai_model text,
  created_at timestamptz not null default now()
);

create table if not exists public.compatibility_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  score integer check (score between 0 and 100),
  decision text not null check (decision in ('ALLOW','REJECT')),
  conflicts jsonb not null default '[]'::jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.procurement_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'Pending' check (status in ('Pending','Approved','Rejected','Fulfilled','Cancelled')),
  total numeric(12,2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.procurement_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.procurement_orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0)
);

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.menus enable row level security;
alter table public.menu_items enable row level security;
alter table public.compatibility_evaluations enable row level security;
alter table public.procurement_orders enable row level security;
alter table public.procurement_items enable row level security;

create policy "profiles own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "vendors owner access" on public.vendors for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "menus vendor owner access" on public.menus for all using (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid())) with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid()));
create policy "menu items vendor owner access" on public.menu_items for all using (exists (select 1 from public.menus m join public.vendors v on v.id = m.vendor_id where m.id = menu_id and v.owner_id = auth.uid())) with check (exists (select 1 from public.menus m join public.vendors v on v.id = m.vendor_id where m.id = menu_id and v.owner_id = auth.uid()));
create policy "evaluations own rows" on public.compatibility_evaluations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "orders own rows" on public.procurement_orders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "order items own rows" on public.procurement_items for all using (exists (select 1 from public.procurement_orders o where o.id = order_id and o.user_id = auth.uid())) with check (exists (select 1 from public.procurement_orders o where o.id = order_id and o.user_id = auth.uid()));
