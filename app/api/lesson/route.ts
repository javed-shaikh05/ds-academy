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
    const prompt = `You are a world-class Data Science teacher creating a lesson for a beginner.

LESSON TOPIC: "${subtopic.title}"
CONTEXT: This is part of "${topicTitle}" in Phase "${phaseTitle}"
DIFFICULTY: ${subtopic.difficulty}

${context ? `REFERENCE MATERIAL FROM TEXTBOOKS:\n${context}\n\n` : ""}

Write a complete lesson in markdown with this exact structure:

## 🎯 What you'll learn
(2-3 bullet points of the key outcomes)

## 💡 The Big Idea
(One paragraph — intuition before formalism. Use a real-world analogy.)

## 📚 Concept Deep Dive
(Main content — clear explanation, broken into short paragraphs with **bold key terms**. Use bullet points where appropriate.)

## 🔢 Math / Formula
(If applicable — show the key formula, explain each symbol. Use code blocks for formulas if no LaTeX.)

## 💻 Code Example
\`\`\`python
# A short, runnable Python example
\`\`\`

## 🌍 Real-World Use Case
(One concrete industry example — Netflix, Uber, healthcare, fraud detection, etc.)

## ⚠️ Common Pitfalls
(2-3 mistakes beginners make)

## 🎯 Interview Perspective
(What a FAANG interviewer might ask + a tip on how to answer)

## 🧠 Quick Recap
(3 bullet points — the key takeaways)

Tone: friendly, clear, no jargon without explanation. Keep total length around 500-700 words. Use the textbook reference material when relevant.`;

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
