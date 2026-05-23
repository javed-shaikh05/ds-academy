import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { schedule } from "@/lib/practice/spaced-repetition";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { mcqId, correct } = await req.json();

    // Get or create review state
    const { data: review } = await supabase
      .from("mcq_reviews")
      .select("*")
      .eq("user_id", user.id)
      .eq("mcq_id", mcqId)
      .single();

    const state = review || {
      ease: 2.5,
      interval_days: 0,
      repetitions: 0,
      total_attempts: 0,
      correct_attempts: 0,
    };
    const next = schedule(state, correct);

    await supabase.from("mcq_reviews").upsert(
      {
        user_id: user.id,
        mcq_id: mcqId,
        ease: next.ease,
        interval_days: next.interval_days,
        repetitions: next.repetitions,
        due_date: next.due_date,
        last_result: correct,
        total_attempts: (state.total_attempts || 0) + 1,
        correct_attempts: (state.correct_attempts || 0) + (correct ? 1 : 0),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,mcq_id" },
    );

    // Award small XP for correct answers
    let xpEarned = 0;
    if (correct) {
      xpEarned = 10;
      await supabase.from("xp_events").insert({
        user_id: user.id,
        amount: xpEarned,
        reason: "mcq_correct",
        metadata: { mcq_id: mcqId },
      });
      const { data: stats } = await supabase
        .from("user_stats")
        .select("total_xp")
        .eq("user_id", user.id)
        .single();
      if (stats) {
        await supabase
          .from("user_stats")
          .update({ total_xp: stats.total_xp + xpEarned })
          .eq("user_id", user.id);
      }
    }

    return NextResponse.json({
      ok: true,
      next_review_days: next.interval_days,
      xp_earned: xpEarned,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
