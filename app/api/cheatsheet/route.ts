import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithRetry } from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subtopicId } = await req.json();

    // Cache check
    const { data: cached } = await supabase
      .from("cheat_sheets")
      .select("content")
      .eq("subtopic_id", subtopicId)
      .single();

    if (cached)
      return NextResponse.json({ content: cached.content, cached: true });

    // Get subtopic info
    const { data: subtopic } = (await supabase
      .from("subtopics")
      .select("title, topics(title)")
      .eq("id", subtopicId)
      .single()) as any;

    if (!subtopic)
      return NextResponse.json(
        { error: "Subtopic not found" },
        { status: 404 },
      );

    const prompt = `Create a CONCISE cheat sheet for "${subtopic.title}" (Data Science). This is for fast revision before an exam or interview — dense, scannable, no fluff.

Use markdown with this structure:
## ${subtopic.title} — Cheat Sheet

**In one line:** <the core idea in a single sentence>

**Key points:**
- <bullet>
- <bullet>
(4-6 sharp bullets)

**Formulas / Code:** (only if relevant)
\`\`\`
<key formula or one-liner code>
\`\`\`

**Remember:**
- <common gotcha or interview tip>
- <another>

Keep the WHOLE thing under 200 words. Maximum density, minimum words.`;

    const content = await generateWithRetry({ prompt });

    await supabase
      .from("cheat_sheets")
      .insert({ subtopic_id: subtopicId, content });

    return NextResponse.json({ content, cached: false });
  } catch (err: any) {
    console.error("Cheatsheet error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
