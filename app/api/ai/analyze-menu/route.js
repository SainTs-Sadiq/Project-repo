import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { evaluateMeal } from "../../../../lib/food-engine";

export const runtime = "nodejs";

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          ingredients: { type: "array", items: { type: "string" } },
          allergens: { type: "array", items: { type: "string" } },
          dietary_attributes: { type: "array", items: { type: "string" } },
          nutrition_attributes: { type: "array", items: { type: "string" } },
          confidence: { type: "number" },
          uncertainties: { type: "array", items: { type: "string" } }
        },
        required: ["name", "description", "ingredients", "allergens", "dietary_attributes", "nutrition_attributes", "confidence", "uncertainties"],
        additionalProperties: false
      }
    }
  },
  required: ["items"],
  additionalProperties: false
};

const SYSTEM_PROMPT = `You are the menu intelligence extraction layer for an intelligent food procurement system. Extract only information supported by the supplied menu text. Do not invent ingredients, allergens, nutrition values, certifications, or dietary suitability. When an attribute is uncertain, put it in uncertainties and lower confidence. Distinguish explicitly stated allergens from possible allergens. Return structured JSON only.`;

export async function POST(request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Anthropic backend is not configured. Set ANTHROPIC_API_KEY in the server environment." }, { status: 503 });
    }

    const body = await request.json();
    const menuText = typeof body?.menuText === "string" ? body.menuText.trim() : "";
    const profile = body?.profile || { constraints: [], goal: "General wellness" };

    if (!menuText) return NextResponse.json({ error: "menuText is required." }, { status: 400 });
    if (menuText.length > 20000) return NextResponse.json({ error: "Menu text is too large. Maximum 20,000 characters." }, { status: 413 });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
      max_tokens: 3500,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Analyze this restaurant menu.\n\n${menuText}` }],
      output_config: { format: { type: "json_schema", schema: EXTRACTION_SCHEMA } }
    });

    const block = response.content?.find(item => item.type === "text");
    if (!block?.text) throw new Error("Anthropic returned no structured content.");

    const extraction = JSON.parse(block.text);
    const results = extraction.items.map(item => {
      const meal = {
        name: item.name,
        description: item.description,
        ingredients: item.ingredients,
        allergens: item.allergens,
        nutrition: {
          protein: item.nutrition_attributes.find(x => /protein/i.test(x)) || "Unknown",
          sodium: item.nutrition_attributes.find(x => /sodium/i.test(x)) || "Unknown",
          calories: item.nutrition_attributes.find(x => /calorie|kcal/i.test(x)) || "Unknown"
        }
      };
      return { ...item, compatibility: evaluateMeal(meal, profile) };
    });

    return NextResponse.json({
      ok: true,
      model: response.model,
      items: results,
      safety: { ai_role: "extraction", decision_role: "deterministic dietary engine" }
    });
  } catch (error) {
    console.error("AI menu analysis failed", error);
    return NextResponse.json({ error: "Menu analysis failed. No procurement decision was made." }, { status: 502 });
  }
}
