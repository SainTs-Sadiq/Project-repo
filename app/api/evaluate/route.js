import { NextResponse } from "next/server";
import { evaluateMeal, evaluateMeals, parseMenuText } from "../../../lib/food-engine";

export async function POST(request) {
  try {
    const body = await request.json();
    const profile = body?.profile || {};

    if (Array.isArray(body?.meals)) {
      return NextResponse.json({ results: evaluateMeals(body.meals, profile) });
    }

    if (body?.meal) {
      return NextResponse.json({ result: evaluateMeal(body.meal, profile) });
    }

    if (typeof body?.menuText === "string") {
      return NextResponse.json({ parsed: parseMenuText(body.menuText) });
    }

    return NextResponse.json({ error: "Provide meal, meals, or menuText." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
