import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { evaluateMeal } from "../../../../lib/food-engine";
import { getSupabaseServer, requireUser } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

const EXTRACTION_SCHEMA = { type:"object", properties:{ items:{ type:"array", items:{ type:"object", properties:{ name:{type:"string"}, description:{type:"string"}, ingredients:{type:"array",items:{type:"string"}}, allergens:{type:"array",items:{type:"string"}}, dietary_attributes:{type:"array",items:{type:"string"}}, nutrition_attributes:{type:"array",items:{type:"string"}}, confidence:{type:"number"}, uncertainties:{type:"array",items:{type:"string"}} }, required:["name","description","ingredients","allergens","dietary_attributes","nutrition_attributes","confidence","uncertainties"], additionalProperties:false } } }, required:["items"], additionalProperties:false };
const SYSTEM_PROMPT = `You are the menu intelligence extraction layer for an intelligent food procurement system. Extract only information supported by the supplied menu text. Do not invent ingredients, allergens, nutrition values, certifications, or dietary suitability. When an attribute is uncertain, put it in uncertainties and lower confidence. Distinguish explicitly stated allergens from possible allergens. Return structured JSON only.`;

export async function POST(request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({error:"Anthropic backend is not configured."},{status:503});
    const user = await requireUser(request);
    const body = await request.json();
    const menuText = typeof body?.menuText === "string" ? body.menuText.trim() : "";
    const profile = body?.profile || { constraints: [], goal: "General wellness" };
    if (!menuText) return NextResponse.json({error:"menuText is required."},{status:400});
    if (menuText.length > 20000) return NextResponse.json({error:"Menu text is too large. Maximum 20,000 characters."},{status:413});

    const client = new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY});
    const response = await client.messages.create({ model:process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest", max_tokens:3500, temperature:0, system:SYSTEM_PROMPT, messages:[{role:"user",content:`Analyze this restaurant menu.\n\n${menuText}`}], output_config:{format:{type:"json_schema",schema:EXTRACTION_SCHEMA}} });
    const block = response.content?.find(item=>item.type === "text");
    if (!block?.text) throw new Error("Anthropic returned no structured content.");
    const extraction = JSON.parse(block.text);
    const results = extraction.items.map(item=>({ ...item, compatibility:evaluateMeal({name:item.name,description:item.description,ingredients:item.ingredients,allergens:item.allergens,nutrition:{protein:item.nutrition_attributes.find(x=>/protein/i.test(x))||"Unknown",sodium:item.nutrition_attributes.find(x=>/sodium/i.test(x))||"Unknown",calories:item.nutrition_attributes.find(x=>/calorie|kcal/i.test(x))||"Unknown"}},profile) }));

    const supabase = getSupabaseServer();
    let { data: vendor } = await supabase.from("vendors").select("id").eq("owner_id",user.id).order("created_at",{ascending:true}).limit(1).maybeSingle();
    if (!vendor) { const created = await supabase.from("vendors").insert({owner_id:user.id,name:"My Restaurant"}).select("id").single(); if (created.error) throw created.error; vendor=created.data; }
    const menuInsert = await supabase.from("menus").insert({vendor_id:vendor.id,name:"AI analyzed menu",source_text:menuText}).select("id").single();
    if (menuInsert.error) throw menuInsert.error;
    const menuItems = results.map(item=>({menu_id:menuInsert.data.id,name:item.name,description:item.description,ingredients:item.ingredients,allergens:item.allergens,dietary_attributes:item.dietary_attributes,nutrition_attributes:item.nutrition_attributes,ai_confidence:item.confidence,uncertainties:item.uncertainties,ai_model:response.model}));
    const inserted = await supabase.from("menu_items").insert(menuItems).select("id,name");
    if (inserted.error) throw inserted.error;
    const evaluations = inserted.data.map((saved,index)=>({user_id:user.id,menu_item_id:saved.id,score:results[index].compatibility.score,decision:results[index].compatibility.decision,conflicts:results[index].compatibility.conflicts,reason:results[index].compatibility.reason}));
    const evalInsert = await supabase.from("compatibility_evaluations").insert(evaluations);
    if (evalInsert.error) throw evalInsert.error;

    return NextResponse.json({ok:true,model:response.model,menu_id:menuInsert.data.id,items:results,safety:{ai_role:"extraction",decision_role:"deterministic dietary engine",persisted:true}});
  } catch(error) {
    console.error("AI menu analysis failed",error);
    const status=error.message === "Unauthorized" ? 401 : 502;
    return NextResponse.json({error:status===401?"Unauthorized. Sign in first.":"Menu analysis failed. No procurement decision was made."},{status});
  }
}
