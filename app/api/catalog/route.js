import {NextResponse} from 'next/server';
import {getSupabaseServer} from '../../../lib/supabase/server';
export const runtime='nodejs';
export async function GET(){try{const db=getSupabaseServer();const{data,error}=await db.from('menus').select('id,name,vendor_id,vendors!inner(id,name,status),menu_items(id,name,description,ingredients,allergens,dietary_attributes,nutrition_attributes,price)').eq('status','Published').eq('vendors.status','Active').order('created_at',{ascending:false});if(error)throw error;return NextResponse.json({menus:data||[]})}catch(e){return NextResponse.json({error:'Unable to load published catalogue.'},{status:500})}}
