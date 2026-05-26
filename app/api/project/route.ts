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

    const body = await req.json();
    const { action } = body;

    // ── REVIEW ──
    if (action === "review") {
      const { title, inputType, content } = body;

      const prompt = `You are a senior Data Scientist reviewing a ${inputType === "code" ? "code submission" : "project"} from someone preparing for FAANG interviews and academic exams.

PROJECT TITLE: ${title || "Untitled"}
TYPE: ${inputType}

SUBMISSION:
${content}

Review it honestly and constructively. Respond ONLY with valid JSON:
{
  "score": <0-100 integer overall quality>,
  "strengths": ["...", "..."],
  "issues": ["...", "..."],
  "suggestions": ["...", "..."],
  "interview_angle": "<what an interviewer would probe about this project, 1-2 sentences>"
}`;

      const raw = await generateWithRetry({ prompt, jsonMode: true });
      let cleaned = raw
        .replace(/```json\s*/gi, "")
        .replace(/```/g, "")
        .trim();
      const fb = cleaned.indexOf("{");
      const lb = cleaned.lastIndexOf("}");
      if (fb !== -1) cleaned = cleaned.slice(fb, lb + 1);

      let review;
      try {
        review = JSON.parse(cleaned);
      } catch {
        return NextResponse.json(
          { error: "Could not parse review. Try again." },
          { status: 500 },
        );
      }

      // Save
      const { data: saved } = await supabase
        .from("project_reviews")
        .insert({
          user_id: user.id,
          title,
          input_type: inputType,
          content,
          review,
        })
        .select()
        .single();

      // Award XP
      await supabase
        .from("xp_events")
        .insert({ user_id: user.id, amount: 60, reason: "project_review" });
      const { data: stats } = await supabase
        .from("user_stats")
        .select("total_xp")
        .eq("user_id", user.id)
        .single();
      if (stats)
        await supabase
          .from("user_stats")
          .update({ total_xp: stats.total_xp + 60 })
          .eq("user_id", user.id);

      return NextResponse.json({ reviewId: saved!.id, review });
    }

    // ── VIVA: get first/next question ──
    if (action === "viva_start") {
      const { reviewId } = body;
      const { data: pr } = await supabase
        .from("project_reviews")
        .select("*")
        .eq("id", reviewId)
        .eq("user_id", user.id)
        .single();

      if (!pr)
        return NextResponse.json(
          { error: "Review not found" },
          { status: 404 },
        );

      const q = await generateWithRetry({
        prompt: `You are conducting an oral viva / project deep-dive about this Data Science project:

TITLE: ${pr.title}
SUBMISSION: ${pr.content.slice(0, 3000)}

Ask your FIRST probing viva question — the kind that tests whether the candidate truly understands their own project (design choices, tradeoffs, alternatives, scaling). Ask ONE clear question, no preamble.`,
      });

      const questions = [{ question: q.trim(), answer: null, feedback: null }];
      await supabase
        .from("project_reviews")
        .update({ viva_questions: questions })
        .eq("id", reviewId);

      return NextResponse.json({ question: q.trim(), questionNumber: 1 });
    }

    // ── VIVA: answer + next ──
    if (action === "viva_answer") {
      const { reviewId, answer } = body;
      const { data: pr } = await supabase
        .from("project_reviews")
        .select("*")
        .eq("id", reviewId)
        .eq("user_id", user.id)
        .single();

      if (!pr)
        return NextResponse.json(
          { error: "Review not found" },
          { status: 404 },
        );

      const questions = pr.viva_questions as any[];
      const currentIdx = questions.findIndex((q) => q.answer === null);
      const currentQ = questions[currentIdx];

      const evalRaw = await generateWithRetry({
        jsonMode: true,
        prompt: `Viva on Data Science project "${pr.title}".

QUESTION: ${currentQ.question}
CANDIDATE ANSWER: ${answer}

Evaluate and respond ONLY with valid JSON:
{
  "feedback": "<1-2 sentences: was the answer solid? what was missing?>",
  "next_question": "<ask the next viva question, OR null if this was question ${currentIdx + 1} of max 4>"
}
${currentIdx + 1 >= 4 ? "This was the final question — set next_question to null." : ""}`,
      });

      let cleaned = evalRaw
        .replace(/```json\s*/gi, "")
        .replace(/```/g, "")
        .trim();
      const fb = cleaned.indexOf("{");
      const lb = cleaned.lastIndexOf("}");
      if (fb !== -1) cleaned = cleaned.slice(fb, lb + 1);
      const evalResult = JSON.parse(cleaned);

      questions[currentIdx] = {
        ...currentQ,
        answer,
        feedback: evalResult.feedback,
      };
      const isLast = currentIdx + 1 >= 4 || !evalResult.next_question;
      if (!isLast)
        questions.push({
          question: evalResult.next_question,
          answer: null,
          feedback: null,
        });

      await supabase
        .from("project_reviews")
        .update({ viva_questions: questions })
        .eq("id", reviewId);

      return NextResponse.json({
        feedback: evalResult.feedback,
        nextQuestion: isLast ? null : evalResult.next_question,
        isLast,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Project review error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
