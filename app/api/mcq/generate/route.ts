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

    // Already have MCQs for this subtopic? Return them.
    const { data: existing } = await supabase
      .from("mcqs")
      .select("*")
      .eq("subtopic_id", subtopicId);

    if (existing && existing.length >= 5) {
      return NextResponse.json({ mcqs: existing, cached: true });
    }

    // Get subtopic info
    const { data: subtopic } = (await supabase
      .from("subtopics")
      .select("title, difficulty, topics(title)")
      .eq("id", subtopicId)
      .single()) as any;

    if (!subtopic)
      return NextResponse.json(
        { error: "Subtopic not found" },
        { status: 404 },
      );

    // Retrieve book context
    const queryEmbedding = await embed(
      `${subtopic.title} ${subtopic.topics?.title || ""}`,
    );
    const { data: matches } = await supabase.rpc("match_embeddings", {
      query_embedding: queryEmbedding,
      match_count: 5,
    });
    const context = (matches || [])
      .filter((m: any) => m.similarity > 0.25)
      .map((m: any) => m.content)
      .join("\n\n");

    const prompt = `Generate 5 multiple-choice questions to test understanding of "${subtopic.title}" (${subtopic.difficulty} level Data Science).

${context ? `Base them on this material:\n${context}\n\n` : ""}

Rules:
- Mix of conceptual + applied questions
- 4 options each, exactly one correct
- Plausible distractors (not obviously wrong)
- Include a one-sentence explanation of the correct answer

Return ONLY valid JSON, no markdown, in this exact format:
{
  "questions": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "..."
    }
  ]
}`;

    // Generate with retry + model fallback (handles 503/429)
    let text = (await generateWithRetry({ prompt, jsonMode: true })).trim();

    // Safety: strip fences and isolate the JSON object
    text = text
      .replace(/```json\s*/gi, "")
      .replace(/```/g, "")
      .trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.slice(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse failed. Raw output:", text);
      return NextResponse.json(
        { error: "Failed to parse quiz. Try again." },
        { status: 500 },
      );
    }

    const questions = parsed.questions || [];
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions generated. Try again." },
        { status: 500 },
      );
    }

    // Save to DB
    const rows = questions.map((q: any) => ({
      subtopic_id: subtopicId,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation,
      difficulty: subtopic.difficulty,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("mcqs")
      .insert(rows)
      .select();

    if (insertError) {
      console.error("MCQ insert failed:", insertError);
      return NextResponse.json(
        { error: `DB insert failed: ${insertError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ mcqs: inserted || [], cached: false });
  } catch (err: any) {
    console.error("MCQ generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
