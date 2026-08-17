import { NextResponse } from "next/server";
import { getAnthropic, buildSystemPrompt } from "@/lib/anthropic";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { profile } = await request.json();
    if (!profile || !Number.isInteger(profile.household) || profile.household < 1 || profile.household > 12 || !Array.isArray(profile.constraints)) {
      return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
    }
    const client = getAnthropic();
    const message = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 1800,
      system: buildSystemPrompt(profile),
      messages: [{ role: "user", content: "Generate my comprehensive food procurement plan now." }]
    });
    const text = message.content.filter(x => x.type === "text").map(x => x.text).join("\n");
    return NextResponse.json({ text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "The AI service could not generate a plan. Please try again." }, { status: 500 });
  }
}
