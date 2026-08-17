import { NextResponse } from "next/server";
import { parseMenuText } from "../../../lib/food-engine";

export async function POST(request) {
  try {
    const { menuText } = await request.json();
    if (!menuText || typeof menuText !== "string") {
      return NextResponse.json({ error: "menuText is required." }, { status: 400 });
    }
    return NextResponse.json(parseMenuText(menuText));
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
