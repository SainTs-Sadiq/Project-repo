-- Phase 5: operational vendor onboarding and procurement workflow
alter table public.vendors add column if not exists status text not null default 'Pending' check (status in ('Pending','Active','Suspended'));
alter table public.vendors add column if not exists phone text;
alter table public.vendors add column if not exists address text;
alter table public.menus add column if not exists status text not null default 'Draft' check (status in ('Draft','Published','Archived'));
alter table public.menu_items add column if not exists price numeric(12,2) not null default 0 check (price >= 0);
alter table public.procurement_orders add column if not exists vendor_id uuid references public.vendors(id) on delete set null;
alter table public.procurement_orders add column if not exists notes text;
alter table public.procurement_orders add column if not exists updated_at timestamptz not null default now();
alter table public.procurement_orders add column if not exists decision_note text;
alter table public.procurement_orders add column if not exists decided_at timestamptz;
create index if not exists idx_vendors_owner on public.vendors(owner_id);
create index if not exists idx_menus_vendor_status on public.menus(vendor_id,status);
create index if not exists idx_menu_items_menu on public.menu_items(menu_id);
create index if not exists idx_orders_vendor_status on public.procurement_orders(vendor_id,status);

-- Vendor owners can manage their own operational data through the authenticated server APIs.
create policy if not exists "vendor owners manage vendor menus" on public.menus for all using (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid())) with check (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid()));

-- Phase 5 order state transitions are intentionally performed by server-side authenticated APIs.
