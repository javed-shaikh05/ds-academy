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
    const prompt = `You are the friendliest teacher alive. Explain "${subtopic.title}" to someone who is COMPLETELY new — imagine a smart 12-year-old or a person with zero tech background. Your goal: make them understand and remember it easily, with NO confusion.

${context ? `You may use this reference material, but translate it into super simple language:\n${context}\n` : ''}

Write in markdown with this flow:

## ${subtopic.title}

**🌟 What is it, really?**
Start with a everyday-life analogy a child would get. (Example style: "Imagine sorting your laundry into whites and colors — that's basically classification.") One simple idea first.

**🧒 Explain like I'm new**
Now explain the actual concept in the simplest words possible. Pretend you're talking to a friend over coffee. Short sentences. No jargon.

**📦 A real example**
Walk through ONE concrete, relatable example step by step. Use familiar things (shopping, food, movies, sports — not abstract math).

**🧠 Easy way to remember**
2-3 simple memory tricks, analogies, or one-liners that make it stick.

**⚠️ Don't get confused**
Clear up the ONE thing beginners usually mix up, in plain words.

**🎤 If someone asks you**
In one or two simple sentences, how you'd explain this if asked in an interview or exam.

STRICT RULES:
- Use ONLY everyday words. If you must use a technical term, immediately explain it in brackets like this: "a model (think of it as a smart guesser)".
- NO complex math symbols or formulas unless absolutely necessary — and if used, explain in words.
- Short sentences. Short paragraphs. Lots of white space.
- Warm, encouraging, slightly fun tone.
- Around 300-400 words. Simple beats long.
- Every example must be from EVERYDAY LIFE, not abstract or academic.`


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
