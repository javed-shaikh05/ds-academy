import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embed } from "@/lib/ai/embed";
import { MENTORS, MentorId } from "@/lib/ai/personalities";
import { generateWithRetry } from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { message, mentorId, history } = await req.json();
    const mentor = MENTORS[mentorId as MentorId] || MENTORS.friendly_teacher;

    // 1. Embed the user's question
    const queryEmbedding = await embed(message);

    // 2. Find relevant chunks from your books
    const { data: matches } = await supabase.rpc("match_embeddings", {
      query_embedding: queryEmbedding,
      match_count: 5,
    });

    // 3. Build context from top matches (only if similarity > 0.4)
    const goodMatches = (matches || []).filter((m: any) => m.similarity > 0.25);
    const context = goodMatches
      .map(
        (m: any, i: number) => `[Source ${i + 1}: ${m.source}]\n${m.content}`,
      )
      .join("\n\n---\n\n");

    // 4. Build the prompt
    const systemPrompt = `${mentor.systemPrompt}

You have access to the student's Data Science textbooks. When the context below is relevant, ground your answer in it. When the context is not relevant or insufficient, you may use your general knowledge — but say so explicitly ("This isn't covered in your books, but...").

Keep answers focused and under 300 words unless the student asks for depth.

${context ? `RELEVANT TEXTBOOK PASSAGES (use these to ground your answer):\n${context}\n\n` : ""}

IMPORTANT: Never mention "textbook passages" or "general knowledge" or whether sources were found. Just answer naturally. Use markdown formatting (bold, lists, code blocks) for clarity.`;

    // 5. Build conversation history for Gemini
    const contents = [
      ...((history || []) as Array<{ role: string; content: string }>).map(
        (m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }),
      ),
      { role: "user", parts: [{ text: message }] },
    ];

    // 6. Call Gemini with system instruction
    const responseText = await generateWithRetry({
      contents,
      systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
    });

    // Save both user message and assistant reply
    await supabase.from("mentor_chats").insert([
      { user_id: user.id, mentor_id: mentorId, role: "user", content: message },
      {
        user_id: user.id,
        mentor_id: mentorId,
        role: "assistant",
        content: responseText,
        sources: goodMatches.map((m: any) => ({
          source: m.source,
          similarity: Math.round(m.similarity * 100),
          preview: m.content.slice(0, 150) + "...",
        })),
      },
    ]);

    // 7. Return answer + which sources were used
    return NextResponse.json({
      reply: responseText,
      sources: goodMatches.map((m: any) => ({
        source: m.source,
        similarity: Math.round(m.similarity * 100),
        preview: m.content.slice(0, 150) + "...",
      })),
    });
  } catch (err: any) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
