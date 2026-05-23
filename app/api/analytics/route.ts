import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // XP over last 14 days
    const since = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data: xpEvents } = await supabase
      .from("xp_events")
      .select("amount, reason, created_at")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .order("created_at");

    // Bucket XP by day
    const xpByDay: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
      xpByDay[d] = 0;
    }
    (xpEvents || []).forEach((e) => {
      const day = e.created_at.split("T")[0];
      if (day in xpByDay) xpByDay[day] += e.amount;
    });

    // Progress per phase (skill graph)
    const { data: phases } = await supabase
      .from("phases")
      .select("id, title, topics(subtopics(id))")
      .order("order_index");

    const { data: progress } = await supabase
      .from("user_progress")
      .select("subtopic_id, status")
      .eq("user_id", user.id);

    const completedSet = new Set(
      (progress || [])
        .filter((p) => p.status === "completed")
        .map((p) => p.subtopic_id),
    );

    const skillGraph = (phases || []).map((phase: any) => {
      const subIds = phase.topics.flatMap((t: any) =>
        t.subtopics.map((s: any) => s.id),
      );
      const done = subIds.filter((id: string) => completedSet.has(id)).length;
      return {
        phase: phase.title,
        total: subIds.length,
        completed: done,
        pct: subIds.length ? Math.round((done / subIds.length) * 100) : 0,
      };
    });

    // MCQ accuracy = weak topic detection
    const { data: reviews } = await supabase
      .from("mcq_reviews")
      .select(
        "total_attempts, correct_attempts, mcqs(subtopic_id, subtopics(title))",
      )
      .eq("user_id", user.id);

    const topicStats: Record<
      string,
      { title: string; correct: number; total: number }
    > = {};
    (reviews || []).forEach((r: any) => {
      const sid = r.mcqs?.subtopic_id;
      const title = r.mcqs?.subtopics?.title;
      if (!sid || !title) return;
      if (!topicStats[sid]) topicStats[sid] = { title, correct: 0, total: 0 };
      topicStats[sid].correct += r.correct_attempts;
      topicStats[sid].total += r.total_attempts;
    });

    const weakTopics = Object.values(topicStats)
      .filter((t) => t.total >= 2)
      .map((t) => ({
        title: t.title,
        accuracy: Math.round((t.correct / t.total) * 100),
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    // Interview readiness score (composite)
    const { data: interviews } = await supabase
      .from("interviews")
      .select("overall_score")
      .eq("user_id", user.id)
      .eq("status", "completed");

    const avgInterview =
      interviews && interviews.length
        ? Math.round(
            interviews.reduce((s, i) => s + (i.overall_score || 0), 0) /
              interviews.length,
          )
        : 0;

    const totalLessons = skillGraph.reduce((s, p) => s + p.total, 0);
    const doneLessons = skillGraph.reduce((s, p) => s + p.completed, 0);
    const lessonPct = totalLessons ? (doneLessons / totalLessons) * 100 : 0;

    const avgMcqAccuracy = weakTopics.length
      ? Math.round(
          weakTopics.reduce((s, t) => s + t.accuracy, 0) / weakTopics.length,
        )
      : 0;

    // Weighted readiness: lessons 40%, mcq 30%, interviews 30%
    const readiness = Math.round(
      lessonPct * 0.4 + avgMcqAccuracy * 0.3 + avgInterview * 0.3,
    );

    return NextResponse.json({
      xpByDay,
      skillGraph,
      weakTopics,
      readiness,
      stats: {
        lessonsCompleted: doneLessons,
        totalLessons,
        interviewsTaken: interviews?.length || 0,
        avgInterviewScore: avgInterview,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
