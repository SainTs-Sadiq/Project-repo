import {NextResponse} from 'next/server';
import {requireUser} from '../../../lib/supabase/server';
export async function authenticated(request){try{return{user:await requireUser(request)}}catch{return{response:NextResponse.json({error:'Unauthorized.'},{status:401})}}}
export function adminOnly(user){return user?.user_metadata?.role==='admin'||user?.app_metadata?.role==='admin'}
