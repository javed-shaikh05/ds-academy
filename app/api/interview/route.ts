import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithRetry } from "@/lib/ai/gemini";

interface Question {
  question: string;
  answer: string | null;
  feedback: string | null;
  score: number | null;
}

const TRACKS: Record<string, string> = {
  technical:
    "Python, SQL, data manipulation, and coding problem-solving for data science",
  ml_concepts:
    "machine learning concepts: algorithms, model evaluation, bias-variance, overfitting, feature engineering",
  stats:
    "statistics and probability: distributions, hypothesis testing, p-values, A/B testing",
  behavioral:
    "behavioral and project-experience questions, communication, teamwork, handling failure",
};

// ACTION: start — creates interview, returns first question
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, interviewId, track, difficulty, answer } = await req.json();

    // ── START ──
    if (action === "start") {
      const focus = TRACKS[track] || TRACKS.technical;
      const firstQ = await generateWithRetry({
        prompt: `You are a senior Data Scientist conducting a ${difficulty}-difficulty technical interview at a top tech company (FAANG-level). Focus area: ${focus}.

Ask your FIRST interview question. Make it realistic and appropriately challenging for ${difficulty} level. Ask ONE clear question. No preamble, no "welcome" — just the question as an interviewer would pose it.`,
      });

      const { data: interview } = await supabase
        .from("interviews")
        .insert({
          user_id: user.id,
          track,
          difficulty,
          questions: [
            {
              question: firstQ.trim(),
              answer: null,
              feedback: null,
              score: null,
            },
          ],
        })
        .select()
        .single();

      return NextResponse.json({
        interviewId: interview!.id,
        question: firstQ.trim(),
        questionNumber: 1,
      });
    }

    // ── ANSWER ── (score the answer, return feedback + next question)
    if (action === "answer") {
      const { data: interview } = await supabase
        .from("interviews")
        .select("*")
        .eq("id", interviewId)
        .eq("user_id", user.id)
        .single();

      if (!interview)
        return NextResponse.json(
          { error: "Interview not found" },
          { status: 404 },
        );

      const questions = interview.questions as Question[];
      const currentIdx = questions.findIndex((q) => q.answer === null);
      const currentQ = questions[currentIdx];
      const focus = TRACKS[interview.track];

      // Score the answer + decide follow-up
      const evalText = await generateWithRetry({
        jsonMode: true,
        prompt: `You are a FAANG Data Science interviewer. Focus: ${focus}.

QUESTION: ${currentQ.question}
CANDIDATE'S ANSWER: ${answer}

Evaluate the answer and respond ONLY with valid JSON:
{
  "score": <0-10 integer>,
  "feedback": "<2-3 sentences: what was strong, what was missing, how a hiring manager would view it>",
  "ask_followup": <true if a probing follow-up would help, false if time to move on>,
  "next_question": "<if this is question ${currentIdx + 1} of max 5, ask the next question OR a follow-up. If already at question 5, set to null>"
}

Be honest but constructive. ${currentIdx + 1 >= 5 ? "This was the final question, set next_question to null." : ""}`,
      });

      let cleaned = evalText
        .replace(/```json\s*/gi, "")
        .replace(/```/g, "")
        .trim();
      const fb = cleaned.indexOf("{");
      const lb = cleaned.lastIndexOf("}");
      if (fb !== -1) cleaned = cleaned.slice(fb, lb + 1);
      const evalResult = JSON.parse(cleaned);

      // Update current question with answer + feedback
      questions[currentIdx] = {
        ...currentQ,
        answer,
        feedback: evalResult.feedback,
        score: evalResult.score,
      };

      const isLast = currentIdx + 1 >= 5 || !evalResult.next_question;
      if (!isLast) {
        questions.push({
          question: evalResult.next_question,
          answer: null,
          feedback: null,
          score: null,
        });
      }

      await supabase
        .from("interviews")
        .update({ questions })
        .eq("id", interviewId);

      return NextResponse.json({
        feedback: evalResult.feedback,
        score: evalResult.score,
        nextQuestion: isLast ? null : evalResult.next_question,
        questionNumber: currentIdx + 2,
        isLast,
      });
    }

    // ── FINISH ── (generate overall report)
    if (action === "finish") {
      const { data: interview } = await supabase
        .from("interviews")
        .select("*")
        .eq("id", interviewId)
        .eq("user_id", user.id)
        .single();

      if (!interview)
        return NextResponse.json(
          { error: "Interview not found" },
          { status: 404 },
        );

      const questions = (interview.questions as Question[]).filter(
        (q) => q.answer !== null,
      );
      const avgScore = Math.round(
        (questions.reduce((s, q) => s + (q.score || 0), 0) / questions.length) *
          10,
      );

      const transcript = questions
        .map(
          (q, i) =>
            `Q${i + 1}: ${q.question}\nAnswer: ${q.answer}\nScore: ${q.score}/10`,
        )
        .join("\n\n");

      const summaryText = await generateWithRetry({
        jsonMode: true,
        prompt: `Review this complete Data Science mock interview transcript and give an honest hiring assessment.

${transcript}

Respond ONLY with valid JSON:
{
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "hire_verdict": "<one of: 'Strong Hire', 'Hire', 'Lean Hire', 'No Hire'> — with one sentence why",
  "advice": "<2-3 sentences of actionable advice for next time>"
}`,
      });

      let cleaned = summaryText
        .replace(/```json\s*/gi, "")
        .replace(/```/g, "")
        .trim();
      const fb = cleaned.indexOf("{");
      const lb = cleaned.lastIndexOf("}");
      if (fb !== -1) cleaned = cleaned.slice(fb, lb + 1);

      let summary;
      try {
        summary = JSON.parse(cleaned);
      } catch {
        console.error("Summary JSON parse failed. Raw:", cleaned);
        // Fallback summary so the interview still completes
        summary = {
          strengths: ["You completed the full interview"],
          weaknesses: ["Report generation had a hiccup — try another round"],
          hire_verdict: "Lean Hire — review your answers above",
          advice:
            "Your per-question feedback above is still accurate. Try another interview for a fresh assessment.",
        };
      }

      await supabase
        .from("interviews")
        .update({
          status: "completed",
          overall_score: avgScore,
          summary,
          completed_at: new Date().toISOString(),
        })
        .eq("id", interviewId);

      // Award XP
      await supabase.from("xp_events").insert({
        user_id: user.id,
        amount: 100,
        reason: "interview_complete",
        metadata: { interview_id: interviewId, score: avgScore },
      });
      const { data: stats } = await supabase
        .from("user_stats")
        .select("total_xp")
        .eq("user_id", user.id)
        .single();
      if (stats) {
        await supabase
          .from("user_stats")
          .update({ total_xp: stats.total_xp + 100 })
          .eq("user_id", user.id);
      }

      return NextResponse.json({ overall_score: avgScore, summary, questions });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    console.error("Interview error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
