import {NextResponse} from 'next/server';
import {getSupabaseServer} from '../../../lib/supabase/server';
export const runtime='nodejs';
export async function GET(){try{const db=getSupabaseServer();const{error}=await db.from('vendors').select('id',{head:true,count:'exact'});if(error)throw error;return NextResponse.json({ok:true,service:'food-procurement-intelligence',database:'reachable',timestamp:new Date().toISOString()})}catch(e){return NextResponse.json({ok:false,service:'food-procurement-intelligence',database:'unreachable',timestamp:new Date().toISOString()},{status:503})}}
