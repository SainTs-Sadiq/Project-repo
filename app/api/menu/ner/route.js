import {NextResponse} from 'next/server';
import {requireUser} from '../../../../lib/supabase/server';
import {parseWithTransformer} from '../../../../lib/ner/ingredientParser';
import {enrichIngredients} from '../../../../lib/enrichment/foodData';
export const runtime='nodejs';
export async function POST(request){try{await requireUser(request);const body=await request.json();if(!body.text)return NextResponse.json({error:'Menu text is required.'},{status:400});const extraction=await parseWithTransformer(body.text,{endpoint:process.env.NER_TRANSFORMER_ENDPOINT,token:process.env.NER_TRANSFORMER_TOKEN});const enrichment=await enrichIngredients(extraction.ingredients);return NextResponse.json({source:'transformer-ner',extraction,enrichment})}catch(e){return NextResponse.json({error:e.message||'NER analysis failed.'},{status:e.message==='Unauthorized'?401:500})}}
