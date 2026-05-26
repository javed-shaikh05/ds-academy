import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithRetry } from "@/lib/ai/gemini";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check cache — regenerate only if older than 7 days
    const { data: cached } = await supabase
      .from("industry_pulse")
      .select("content, generated_at")
      .eq("id", "latest")
      .single();

    if (cached) {
      const ageMs = Date.now() - new Date(cached.generated_at).getTime();
      const sevenDays = 7 * 86400000;
      if (ageMs < sevenDays) {
        return NextResponse.json({
          ...cached.content,
          generated_at: cached.generated_at,
          cached: true,
        });
      }
    }

    // Generate fresh briefing
    const prompt = `You are a Data Science career advisor. Generate a current industry briefing for someone learning DS and targeting FAANG / top company roles.

Respond ONLY with valid JSON:
{
  "hot_skills": [{"skill": "...", "why": "<1 line why it matters now>"}],
  "trending_tools": [{"tool": "...", "use": "<1 line>"}],
  "interview_trends": ["<what top companies are focusing on in DS interviews>", "..."],
  "emerging_topics": [{"topic": "...", "note": "<1 line>"}],
  "advice": "<2-3 sentences of strategic advice for a learner right now>"
}

Give 5 items in hot_skills, 5 in trending_tools, 4 in interview_trends, 4 in emerging_topics. Be specific and practical (real tool/skill names).`;

    const raw = await generateWithRetry({ prompt, jsonMode: true });
    let cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();
    const fb = cleaned.indexOf("{");
    const lb = cleaned.lastIndexOf("}");
    if (fb !== -1) cleaned = cleaned.slice(fb, lb + 1);

    let content;
    try {
      content = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Could not generate briefing. Try again." },
        { status: 500 },
      );
    }

    // Cache it (upsert the single 'latest' row)
    await supabase.from("industry_pulse").upsert({
      id: "latest",
      content,
      generated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ...content,
      generated_at: new Date().toISOString(),
      cached: false,
    });
  } catch (err: any) {
    console.error("Pulse error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
