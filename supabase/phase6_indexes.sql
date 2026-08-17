-- Phase 6: query indexes
create index if not exists idx_vendors_status on public.vendors(status);
create index if not exists idx_menus_status_vendor on public.menus(status,vendor_id);
create index if not exists idx_menu_items_menu_price on public.menu_items(menu_id,price);
create index if not exists idx_evaluations_user_created on public.compatibility_evaluations(user_id,created_at desc);
create index if not exists idx_orders_user_created on public.procurement_orders(user_id,created_at desc);
create index if not exists idx_orders_vendor_created on public.procurement_orders(vendor_id,created_at desc);
create index if not exists idx_order_items_order on public.procurement_items(order_id);
