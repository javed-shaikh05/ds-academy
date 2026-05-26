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

    const { data: phases } = await supabase
      .from("phases")
      .select(
        "id, order_index, title, icon, color, topics(id, order_index, title, subtopics(id, order_index, title, difficulty))",
      )
      .order("order_index");

    const { data: progress } = await supabase
      .from("user_progress")
      .select("subtopic_id, status")
      .eq("user_id", user.id);

    const statusMap = new Map(
      progress?.map((p) => [p.subtopic_id, p.status]) || [],
    );

    // Build tree with computed status + unlock logic
    let prevPhaseComplete = true; // phase 1 always unlocked
    const tree = (phases || []).map((phase: any) => {
      phase.topics.sort((a: any, b: any) => a.order_index - b.order_index);
      phase.topics.forEach((t: any) =>
        t.subtopics.sort((a: any, b: any) => a.order_index - b.order_index),
      );

      const allSubs = phase.topics.flatMap((t: any) => t.subtopics);
      const completed = allSubs.filter(
        (s: any) => statusMap.get(s.id) === "completed",
      ).length;
      const total = allSubs.length;
      const phaseComplete = total > 0 && completed === total;

      // A phase unlocks if the previous one is at least 60% done
      const prevPct = prevPhaseComplete;
      const unlocked = phase.order_index === 1 || prevPhaseComplete;

      const topics = phase.topics.map((t: any) => ({
        id: t.id,
        title: t.title,
        subtopics: t.subtopics.map((s: any) => ({
          id: s.id,
          title: s.title,
          difficulty: s.difficulty,
          status: statusMap.get(s.id) || "not_started",
        })),
      }));

      // Update unlock gate: next phase unlocks when this one hits 60%+
      prevPhaseComplete = total > 0 && completed / total >= 0.6;

      return {
        id: phase.id,
        order: phase.order_index,
        title: phase.title,
        icon: phase.icon,
        color: phase.color,
        completed,
        total,
        pct: total ? Math.round((completed / total) * 100) : 0,
        unlocked,
        topics,
      };
    });

    return NextResponse.json({ tree });
  } catch (err: any) {
    console.error("Skilltree error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
