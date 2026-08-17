import { NextResponse } from 'next/server';
import { getSupabaseServer, requireUser } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from('procurement_orders').select('*, procurement_items(*)').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ orders: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message === 'Unauthorized' ? 'Unauthorized.' : 'Unable to load orders.' }, { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const { items = [] } = await request.json();
    if (!Array.isArray(items) || !items.length) return NextResponse.json({ error: 'At least one procurement item is required.' }, { status: 400 });
    const total = items.reduce((sum, item) => sum + Number(item.unit_price || item.price || 0) * Math.max(1, Number(item.quantity || 1)), 0);
    const supabase = getSupabaseServer();
    const { data: order, error: orderError } = await supabase.from('procurement_orders').insert({ user_id: user.id, total, status: 'Pending' }).select().single();
    if (orderError) throw orderError;
    const rows = items.filter(item => item.menu_item_id).map(item => ({ order_id: order.id, menu_item_id: item.menu_item_id, quantity: Math.max(1, Number(item.quantity || 1)), unit_price: Number(item.unit_price || item.price || 0) }));
    if (rows.length) { const { error } = await supabase.from('procurement_items').insert(rows); if (error) throw error; }
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message === 'Unauthorized' ? 'Unauthorized.' : 'Unable to create procurement order.' }, { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
}
