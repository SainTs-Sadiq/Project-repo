import { NextResponse } from 'next/server';
import { getSupabaseServer } from '../../../lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { userId, profile } = await request.json();
    if (!userId || !profile) return NextResponse.json({ error: 'userId and profile are required.' }, { status: 400 });
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.from('profiles').upsert({
      id: userId,
      display_name: profile.name || 'Guest',
      weekly_budget: Number(profile.budget || 0),
      nutrition_goal: profile.goal || 'General wellness',
      constraints: profile.constraints || [],
      updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error('Profile persistence failed', error);
    return NextResponse.json({ error: 'Unable to save profile.' }, { status: 500 });
  }
}
