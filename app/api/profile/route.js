import { NextResponse } from 'next/server';
import { getSupabaseServer, requireUser } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const user = await requireUser(request);
    const { profile } = await request.json();
    if (!profile) return NextResponse.json({ error: 'profile is required.' }, { status: 400 });
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: profile.name || user.email?.split('@')[0] || 'User',
      weekly_budget: Number(profile.budget || 0),
      nutrition_goal: profile.goal || 'General wellness',
      constraints: profile.constraints || [],
      updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Unauthorized.' : 'Unable to save profile.' }, { status });
  }
}

export async function GET(request) {
  try {
    const user = await requireUser(request);
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (error) {
    return NextResponse.json({ error: error.message === 'Unauthorized' ? 'Unauthorized.' : 'Unable to load profile.' }, { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
}
