import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { XP_REWARDS } from "@/lib/gamification/levels";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { missionType } = await req.json();
    const today = new Date().toISOString().split("T")[0];

    // Find matching active missions for today
    const { data: missions } = await supabase
      .from("daily_missions")
      .select("*")
      .eq("user_id", user.id)
      .eq("mission_date", today)
      .eq("mission_type", missionType)
      .eq("completed", false);

    if (!missions || missions.length === 0) {
      return NextResponse.json({ ok: true, completed: [] });
    }

    const completed = [];
    for (const m of missions) {
      const newProgress = m.progress + 1;
      const isDone = newProgress >= m.target;

      await supabase
        .from("daily_missions")
        .update({ progress: newProgress, completed: isDone })
        .eq("id", m.id);

      if (isDone) {
        // Award XP for completing mission
        await supabase.from("xp_events").insert({
          user_id: user.id,
          amount: m.xp_reward,
          reason: "mission_complete",
          metadata: { mission_id: m.id, title: m.metadata?.title },
        });

        // Update user stats
        const { data: stats } = await supabase
          .from("user_stats")
          .select("total_xp")
          .eq("user_id", user.id)
          .single();

        if (stats) {
          await supabase
            .from("user_stats")
            .update({ total_xp: stats.total_xp + m.xp_reward })
            .eq("user_id", user.id);
        }

        completed.push(m);
      }
    }

    return NextResponse.json({ ok: true, completed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
