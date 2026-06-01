import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embed } from "@/lib/ai/embed";
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

    // 1. Check cache
    const { data: cached } = await supabase
      .from('lesson_content')
      .select('content, sources, exercise')
      .eq('subtopic_id', subtopicId)
      .single()

    if (cached) {
      return NextResponse.json({ content: cached.content, sources: cached.sources, exercise: cached.exercise || '', cached: true })
    }

    // 2. Get subtopic details
    const { data: subtopic } = (await supabase
      .from("subtopics")
      .select(
        "title, difficulty, topic_id, topics(title, phase_id, phases(title))",
      )
      .eq("id", subtopicId)
      .single()) as any;

    if (!subtopic)
      return NextResponse.json(
        { error: "Subtopic not found" },
        { status: 404 },
      );

    const topicTitle = subtopic.topics?.title || "";
    const phaseTitle = subtopic.topics?.phases?.title || "";

    // 3. Retrieve relevant book chunks
    const query = `${subtopic.title} ${topicTitle}`;
    const queryEmbedding = await embed(query);
    const { data: matches } = await supabase.rpc("match_embeddings", {
      query_embedding: queryEmbedding,
      match_count: 6,
    });
    const goodMatches = (matches || []).filter((m: any) => m.similarity > 0.25);
    const context = goodMatches
      .map((m: any, i: number) => `[${m.source}] ${m.content}`)
      .join("\n\n---\n\n");

    // 4. Generate lesson
    const prompt = `You are an electrifying Data Science teacher. Teach "${subtopic.title}" in a way that's impossible to forget. AVOID dry, theoretical, textbook-style writing.

${context ? `Ground your explanation in this source material:\n${context}\n` : ''}

Write the lesson in markdown with this flow:

## ${subtopic.title}

**🎯 The hook** — Start with ONE punchy sentence or a real-world scenario that makes the reader care. Why does this matter?

**💡 The big idea** — Explain the core concept using a concrete ANALOGY or everyday example (not jargon). Make it click.

**🔍 How it actually works** — The real explanation, in plain language. Short paragraphs. Use a relatable example with real numbers if helpful.

**🧠 Remember this** — 2-3 bullet "memory hooks": vivid tricks, analogies, or mini-mnemonics to lock it in.

**⚠️ Common trap** — The #1 mistake people make, and how to avoid it.

**🎤 Interview angle** — How this shows up in interviews and what a strong answer sounds like.

Rules:
- Conversational and energetic, like a great teacher who loves the subject.
- Prefer analogies and examples over abstract definitions.
- Keep paragraphs SHORT. No walls of text.
- Around 350-450 words. Dense with insight, light on fluff.`


    // Generate lesson + exercise in ONE call to save quota
    const fullPrompt = `${prompt}

---

After the lesson, add a practice exercise. Output your response as JSON ONLY (no markdown fences):
{
  "lesson": "<the full lesson in markdown, following the structure above>",
  "exercise": "<a short 10-15 line beginner Python exercise using only numpy/pandas, with a TODO comment for the learner. If this topic isn't suited to code, use empty string>"
}`

    const raw = await generateWithRetry({ prompt: fullPrompt, jsonMode: true })

    let content = ''
    let exercise = ''
    try {
      let cleaned = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
      const fb = cleaned.indexOf('{'); const lb = cleaned.lastIndexOf('}')
      if (fb !== -1) cleaned = cleaned.slice(fb, lb + 1)
      const parsed = JSON.parse(cleaned)
      content = parsed.lesson || raw
      exercise = parsed.exercise || ''
    } catch {
      // If JSON parsing fails, treat the whole thing as the lesson
      content = raw
    }

    const sources = goodMatches.map((m: any) => ({
      source: m.source,
      similarity: Math.round(m.similarity * 100),
    }))

    await supabase.from('lesson_content').insert({
      subtopic_id: subtopicId,
      content,
      sources,
      exercise,
    })

    return NextResponse.json({ content, sources, exercise, cached: false })
  } catch (err: any) {
    console.error("Lesson generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
