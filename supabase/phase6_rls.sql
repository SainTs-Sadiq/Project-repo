-- Phase 6: production RLS hardening
-- Run after schema.sql and phase5.sql.
-- These policies are intentionally additive and keep vendor-owner writes private.

alter table public.vendors enable row level security;
alter table public.menus enable row level security;
alter table public.menu_items enable row level security;
alter table public.compatibility_evaluations enable row level security;
alter table public.procurement_orders enable row level security;
alter table public.procurement_items enable row level security;

-- Customers may discover only active vendors. Owners retain management access.
create policy "active vendors public read" on public.vendors for select to authenticated using (status = 'Active' or owner_id = auth.uid());

-- Published menus from active vendors are customer-readable. Owners retain management access.
create policy "published active menus read" on public.menus for select to authenticated using ((status = 'Published' and exists (select 1 from public.vendors v where v.id = vendor_id and v.status = 'Active')) or exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid()));

-- Items follow their menu visibility. Vendor owners can manage their own items.
create policy "published active menu items read" on public.menu_items for select to authenticated using (exists (select 1 from public.menus m join public.vendors v on v.id = m.vendor_id where m.id = menu_id and ((m.status = 'Published' and v.status = 'Active') or v.owner_id = auth.uid())));

-- Customers can create/read only their own evaluations and orders.
create policy "evaluations own rows v6" on public.compatibility_evaluations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "orders own rows v6" on public.procurement_orders for select to authenticated using (auth.uid() = user_id);
create policy "order items own rows v6" on public.procurement_items for select to authenticated using (exists (select 1 from public.procurement_orders o where o.id = order_id and o.user_id = auth.uid()));

-- Do not grant browser-side inserts/updates for procurement orders. The server API performs
-- authentication, vendor validation, price calculation and state transitions.

-- Vendor owners can read their incoming orders without gaining access to other users' orders.
create policy "vendor owners read their orders" on public.procurement_orders for select to authenticated using (exists (select 1 from public.vendors v where v.id = vendor_id and v.owner_id = auth.uid()));
create policy "vendor owners read their order items" on public.procurement_items for select to authenticated using (exists (select 1 from public.procurement_orders o join public.vendors v on v.id = o.vendor_id where o.id = order_id and v.owner_id = auth.uid()));

-- Admins are handled by server APIs using the service-role client. No browser policy is added
-- for admin mutation, preventing clients from self-assigning operational privileges.
