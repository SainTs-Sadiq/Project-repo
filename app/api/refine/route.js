import { NextResponse } from "next/server";
import { getAnthropic, buildRefinePrompt } from "@/lib/anthropic";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { profile, currentPlan, question } = await request.json();
    if (!profile || typeof currentPlan !== "string" || typeof question !== "string" || !question.trim() || question.length > 2000) {
      return NextResponse.json({ error: "Invalid refinement request." }, { status: 400 });
    }
    const client = getAnthropic();
    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system: "You are a helpful food procurement and nutrition planning assistant.",
      messages: [{ role: "user", content: buildRefinePrompt(profile, currentPlan, question) }]
    });
    const text = message.content.filter(x => x.type === "text").map(x => x.text).join("\n");
    return NextResponse.json({ text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "The AI service could not process that refinement. Please try again." }, { status: 500 });
  }
}
